#!/usr/bin/env bash
set -euo pipefail

readonly DOCKERFILE="docker/Dockerfile"
readonly PLATFORM="linux/amd64"
readonly BUNDLE_TEXT="bundle-stub"
readonly PAGES_HEADERS="dist/_headers"
readonly ADDED_FILES="etc/nginx/conf.d/default.conf etc/nginx/nginx.conf srv/app/index.html"
readonly SHELL_OR_PACKAGE_MANAGER='^(usr/)?(local/)?s?bin/(sh|ash|bash|dash|busybox|apk|apt|apt-get|dpkg|rpm|yum|dnf|microdnf|pip|pip3|npm|pnpm|corepack)$'
readonly PACKAGE_MANAGERS='pnpm|npm |npx|corepack'
readonly TOKEN_MARKERS='codeartifact|_authToken'
readonly APP_USER="101:101"
readonly APP_PORT="8080/tcp"
readonly KUBE_DNS="kube-dns.kube-system.svc.cluster.local"
readonly DOCKER_DNS="127.0.0.11"
readonly BACKEND_HOST="betterreads.betterreads-dev.svc.cluster.local"
readonly BACKEND_TEXT="backend-stub"
readonly APP_ROUTE="/books/42"
readonly API_ROUTE="/api/books?q=dune"
readonly STOCK_ERROR_PAGE="/50x.html"
readonly SELF=".github/tests/runtime-image.sh"
readonly JENKINS_FLAG="--jenkins"
readonly JENKINS_CASES=(check_dockerfile_runs_no_package_manager)
readonly JENKINS_LINE="runtime-image.sh: Jenkins mode ran ${JENKINS_CASES[*]}"

root="$(cd "$(dirname "$0")/../.." && pwd)"
scratch="$(mktemp -d "${TMPDIR:-/tmp}/runtime-image.XXXXXX")"
readonly root scratch
readonly image="runtime-image-check:$$"
readonly backend_image="runtime-image-check-backend:$$"
readonly missing_bundle_image="runtime-image-check-missing:$$"
readonly network="runtime-image-check-$$"
readonly app_container="runtime-image-check-app-$$"
readonly backend_container="runtime-image-check-backend-$$"

clean_up() {
  if [[ "${jenkins}" == false ]]; then
    docker rm -f "${app_container}" "${backend_container}" > /dev/null 2>&1 || true
    docker network rm "${network}" > /dev/null 2>&1 || true
    docker image rm -f "${image}" "${backend_image}" "${missing_bundle_image}" > /dev/null 2>&1 || true
  fi
  rm -rf "${scratch}"
}

fail() {
  printf 'runtime-image.sh: %s\n' "$1" >&2
  exit 1
}

jenkins=false
for arg in "$@"; do
  if [[ "${arg}" != "${JENKINS_FLAG}" ]]; then
    fail "unknown argument ${arg}, expected ${JENKINS_FLAG} or nothing"
  fi
  jenkins=true
done
readonly jenkins
trap clean_up EXIT

path_without_docker() {
  local dir dirs
  local kept=()
  IFS=: read -ra dirs <<< "${PATH}"
  for dir in "${dirs[@]}"; do
    if [[ ! -x "${dir}/docker" ]]; then
      kept+=("${dir}")
    fi
  done
  (IFS=:; printf '%s' "${kept[*]}")
}

base_image() {
  sed -n 's/^FROM //p' "${root}/${DOCKERFILE}"
}

make_context() {
  local context="$1"
  mkdir -p "${context}/dist"
  (cd "${root}" && tar -cf - ./docker ./.dockerignore ./.npmrc) | tar -xf - -C "${context}"
  printf '%s' "${BUNDLE_TEXT}" > "${context}/dist/index.html"
  printf '%s\n' "/*" > "${context}/${PAGES_HEADERS}"
}

build() {
  docker build --quiet --platform "${PLATFORM}" -f "$1/${DOCKERFILE}" -t "$2" "$1" 2>&1
}

build_stub_image() {
  make_context "${scratch}/context"
  build "${scratch}/context" "${image}" > /dev/null || fail "the image build from the stub context failed"
  local container
  container="$(docker create --platform "${PLATFORM}" "${image}")"
  docker export "${container}" > "${scratch}/filesystem.tar"
  docker rm "${container}" > /dev/null
}

added_files() {
  local base_layers
  docker pull --quiet --platform "${PLATFORM}" "$(base_image)" > /dev/null
  base_layers="$(docker image inspect --format '{{len .RootFS.Layers}}' "$(base_image)")"
  docker save "${image}" -o "${scratch}/image.tar"
  python3 -I - "${scratch}/image.tar" "${base_layers}" <<'PY'
import json
import sys
import tarfile

image = tarfile.open(sys.argv[1])
layers = json.load(image.extractfile("manifest.json"))[0]["Layers"][int(sys.argv[2]):]
names = set()
for layer in layers:
    for member in tarfile.open(fileobj=image.extractfile(layer)).getmembers():
        if not member.isdir():
            names.add(member.name.removeprefix("./"))
sys.stdout.write(" ".join(sorted(names)))
PY
}

check_dockerfile_runs_no_package_manager() {
  local instructions
  instructions="$(sed -e ':join' -e '/\\$/N' -e 's/\\\n//' -e 't join' "${root}/${DOCKERFILE}" | grep -E '^RUN ' || true)"
  if grep -Eq "${PACKAGE_MANAGERS}" <<< "${instructions}"; then
    fail "${DOCKERFILE} runs a package manager: $(grep -E "${PACKAGE_MANAGERS}" <<< "${instructions}")"
  fi
}

check_image_adds_only_the_runtime_files() {
  local actual
  actual="$(added_files)"
  if [[ "${actual}" != "${ADDED_FILES}" ]]; then
    fail "the image adds '${actual}' over $(base_image), expected '${ADDED_FILES}'"
  fi
}

check_image_has_no_shell_or_package_manager() {
  local found
  found="$(tar -tf "${scratch}/filesystem.tar" | sed 's|^\./||' | grep -E "${SHELL_OR_PACKAGE_MANAGER}" || true)"
  if [[ -n "${found}" ]]; then
    fail "the image has a shell or package manager: $(tr '\n' ' ' <<< "${found}")"
  fi
}

check_image_holds_no_token() {
  if docker history --no-trunc --format '{{.CreatedBy}}' "${image}" | grep -E "${TOKEN_MARKERS}" > /dev/null; then
    fail "the image history names codeartifact or _authToken"
  fi
  if grep -aqE "${TOKEN_MARKERS}" "${scratch}/filesystem.tar"; then
    fail "the image filesystem contains codeartifact or _authToken"
  fi
}

start_backend() {
  mkdir -p "${scratch}/backend"
  printf 'FROM %s\nCOPY backend.conf /etc/nginx/conf.d/nginx.default.conf\n' "$(base_image)" > "${scratch}/backend/Dockerfile"
  printf 'server {\n    listen 80;\n    location / {\n        return 200 "%s $request_uri";\n    }\n}\n' "${BACKEND_TEXT}" > "${scratch}/backend/backend.conf"
  docker build --quiet --platform "${PLATFORM}" -t "${backend_image}" "${scratch}/backend" > /dev/null
  docker run --detach --platform "${PLATFORM}" --name "${backend_container}" --network "${network}" \
    --network-alias "${BACKEND_HOST}" "${backend_image}" > /dev/null
}

start_app() {
  docker run --detach --platform "${PLATFORM}" --name "${app_container}" --network "${network}" \
    --add-host "${KUBE_DNS}:${DOCKER_DNS}" --user "${APP_USER}" --read-only --tmpfs /tmp \
    --cap-drop ALL --security-opt no-new-privileges --publish "127.0.0.1::${APP_PORT}" "${image}" > /dev/null
}

fetch() {
  local address
  address="$(docker port "${app_container}" "${APP_PORT}" | head -n 1)"
  curl --silent --show-error --fail --retry 20 --retry-all-errors --retry-delay 1 "http://${address}$1" 2> "${scratch}/curl.err"
}

expect_body() {
  local route="$1"
  local expected="$2"
  local body
  if ! body="$(fetch "${route}")" || [[ "${body}" != "${expected}" ]]; then
    docker logs "${app_container}" >&2 || true
    cat "${scratch}/curl.err" >&2
    fail "GET ${route} returned '${body}', expected '${expected}'"
  fi
}

start_containers() {
  docker network create "${network}" > /dev/null
  start_backend
  start_app
}

check_image_serves_the_app() {
  expect_body / "${BUNDLE_TEXT}"
  expect_body "${APP_ROUTE}" "${BUNDLE_TEXT}"
}

check_stock_error_page_is_unreachable() {
  expect_body "${STOCK_ERROR_PAGE}" "${BUNDLE_TEXT}"
}

check_image_proxies_the_api() {
  expect_body "${API_ROUTE}" "${BACKEND_TEXT} ${API_ROUTE}"
}

check_missing_bundle_fails_the_build() {
  make_context "${scratch}/missing-bundle"
  rm -r "${scratch}/missing-bundle/dist"
  local output
  if output="$(build "${scratch}/missing-bundle" "${missing_bundle_image}")"; then
    fail "the image build without dist passed"
  fi
  if [[ "${output}" != *"dist"* ]]; then
    printf '%s\n' "${output}" >&2
    fail "the failed image build does not name dist"
  fi
}

check_jenkins_mode_runs_only_the_dockerfile_check() {
  local output
  if ! output="$(PATH="$(path_without_docker)" "${BASH}" "${root}/${SELF}" "${JENKINS_FLAG}" 2>&1)"; then
    printf '%s\n' "${output}" >&2
    fail "${JENKINS_FLAG} without docker on PATH failed"
  fi
  if [[ "${output}" != "${JENKINS_LINE}" ]]; then
    fail "${JENKINS_FLAG} printed '${output}', expected '${JENKINS_LINE}'"
  fi
}

if [[ "${jenkins}" == true ]]; then
  for case in "${JENKINS_CASES[@]}"; do
    "${case}"
  done
  printf '%s\n' "${JENKINS_LINE}"
  exit 0
fi
check_dockerfile_runs_no_package_manager
build_stub_image
check_image_adds_only_the_runtime_files
check_image_has_no_shell_or_package_manager
check_image_holds_no_token
start_containers
check_image_serves_the_app
check_stock_error_page_is_unreachable
check_image_proxies_the_api
check_missing_bundle_fails_the_build
check_jenkins_mode_runs_only_the_dockerfile_check
printf '%s\n' "runtime-image.sh: the image runs no package manager, adds only the nginx config and the bundle without _headers, has no shell or package manager, holds no token, serves the app in place of the stock error page and proxies /api/ as user 101 on a read-only root, and fails without the bundle"
