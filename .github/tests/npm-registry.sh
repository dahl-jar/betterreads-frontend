#!/usr/bin/env bash
set -euo pipefail

readonly NPMJS_URL="https://registry.npmjs.org/"
readonly YOUNG_PACKAGE="typescript"
readonly OLD_PACKAGE="is-number"
readonly OLD_VERSION="7.0.0"
readonly MINUTES_PER_HOUR=60
readonly MS_PER_HOUR=3600000
readonly AGE_REFUSAL="ERR_PNPM_NO_MATURE_MATCHING_VERSION"
readonly AUDIT_SUMMARY="vulnerabilities found"
readonly PNPM_ERROR="ERR_PNPM_"
readonly AUDIT_FINDINGS_EXIT=1
readonly SELF=".github/tests/npm-registry.sh"
readonly JENKINS_FLAG="--jenkins"
readonly JENKINS_CASES=(check_audit_uses_npmjs)
readonly JENKINS_LINE="npm-registry.sh: Jenkins mode ran ${JENKINS_CASES[*]}"
readonly UNSET_TOKEN="CODEARTIFACT_AUTH_TOKEN is unset or empty: set it to a CodeArtifact authorization token"
readonly UNSET_TOKEN_LINE="npm-registry.sh: ${UNSET_TOKEN}"
readonly FAKE_TOKEN="fake-token-4711"
readonly FETCH_401="ERR_PNPM_FETCH_401"
readonly ENV_WARNING="Failed to replace env"
readonly TOKEN_REFERENCE="\${CODEARTIFACT_AUTH_TOKEN}"
readonly TOKEN_KEY="_authToken"
readonly VARIABLE_START="\${"

root="$(cd "$(dirname "$0")/../.." && pwd)"
scratch="$(mktemp -d "${TMPDIR:-/tmp}/npm-registry.XXXXXX")"
readonly root scratch
readonly MAX_AGE_HOURS=$(( $(sed -n 's/^minimum-release-age=//p' "${root}/.npmrc") / MINUTES_PER_HOUR ))
REGISTRY_URL="$(sed -n 's/^registry=//p' "${root}/.npmrc")"
readonly REGISTRY_URL
readonly USER_CONFIG="${scratch}/user.npmrc"
trap 'rm -rf "${scratch}"' EXIT

fail() {
  printf 'npm-registry.sh: %s\n' "$1" >&2
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

set_up() {
  printf '%s:%s=%s\n' "${REGISTRY_URL#https:}" "${TOKEN_KEY}" "${TOKEN_REFERENCE}" > "${USER_CONFIG}"
  if [[ "${jenkins}" == true ]]; then
    return
  fi
  if [[ -z "${CODEARTIFACT_AUTH_TOKEN:-}" ]]; then
    fail "${UNSET_TOKEN}"
  fi
  make_project "${scratch}/project"
}

make_project() {
  local dir="$1"
  mkdir -p "${dir}"
  cp "${root}/.npmrc" "${dir}/.npmrc"
  node -e 'const pkg = require(process.argv[1]); process.stdout.write(JSON.stringify({name: "registry-check", private: true, packageManager: pkg.packageManager}))' \
    "${root}/package.json" > "${dir}/package.json"
}

with_user_config() {
  NPM_CONFIG_USERCONFIG="${USER_CONFIG}" "$@"
}

in_project() {
  (cd "${scratch}/project" && with_user_config pnpm "$@" --store-dir "${scratch}/store" 2>&1)
}

view() {
  (cd "${scratch}/project" && with_user_config pnpm view "$@")
}

publish_time() {
  local package="$1"
  local version="$2"
  shift 2
  view "${package}" time --json "$@" \
    | node -e 'let text = ""; process.stdin.on("data", (chunk) => { text += chunk; }).on("end", () => { process.stdout.write(JSON.parse(text)[process.argv[1]] ?? ""); })' "${version}"
}

check_repo_npmrc_has_no_token() {
  if grep -qF -e "${VARIABLE_START}" -e "${TOKEN_KEY}" "${root}/.npmrc"; then
    fail "the repo .npmrc has a ${TOKEN_KEY} line or a ${VARIABLE_START} variable, the token line belongs in the user-level npm config"
  fi
}

check_view_works_with_token() {
  local version
  if ! version="$(view "${OLD_PACKAGE}@${OLD_VERSION}" version 2> "${scratch}/view.err")"; then
    cat "${scratch}/view.err" >&2
    fail "pnpm view ${OLD_PACKAGE}@${OLD_VERSION} failed with CODEARTIFACT_AUTH_TOKEN set: the token is invalid or expired, or the user-level token line is not read"
  fi
  if [[ "${version}" != "${OLD_VERSION}" ]]; then
    fail "pnpm view ${OLD_PACKAGE}@${OLD_VERSION} printed '${version}'"
  fi
}

check_young_version_is_refused() {
  local version upstream time age_hours output
  version="$(view "${YOUNG_PACKAGE}" dist-tags.next)"
  upstream="$(view "${YOUNG_PACKAGE}" dist-tags.next --registry "${NPMJS_URL}")"
  if [[ "${version}" != "${upstream}" ]]; then
    fail "CodeArtifact has ${YOUNG_PACKAGE}@next ${version}, npmjs has ${upstream}"
  fi
  time="$(publish_time "${YOUNG_PACKAGE}" "${version}")"
  age_hours="$(node -e 'process.stdout.write(String(Math.floor((Date.now() - Date.parse(process.argv[1])) / Number(process.argv[2]))))' "${time}" "${MS_PER_HOUR}")"
  if (( age_hours >= MAX_AGE_HOURS )); then
    fail "${YOUNG_PACKAGE}@next ${version} is older than ${MAX_AGE_HOURS} hours, the check needs a younger version"
  fi
  if output="$(in_project add --save-exact "${YOUNG_PACKAGE}@${version}")"; then
    fail "pnpm add ${YOUNG_PACKAGE}@${version} passed, expected ${AGE_REFUSAL}"
  fi
  if [[ "${output}" != *"${AGE_REFUSAL}"* ]]; then
    printf '%s\n' "${output}" >&2
    fail "pnpm add ${YOUNG_PACKAGE}@${version} failed without ${AGE_REFUSAL}"
  fi
  refused_version="${version}"
}

check_old_version_keeps_its_publish_time() {
  local cached upstream
  cached="$(publish_time "${OLD_PACKAGE}" "${OLD_VERSION}")"
  upstream="$(publish_time "${OLD_PACKAGE}" "${OLD_VERSION}" --registry "${NPMJS_URL}")"
  if [[ -z "${cached}" || "${cached}" != "${upstream}" ]]; then
    fail "CodeArtifact dates ${OLD_PACKAGE}@${OLD_VERSION} '${cached}', npmjs dates it '${upstream}'"
  fi
}

check_mature_version_installs() {
  local output installed
  if ! output="$(in_project add --save-exact "${OLD_PACKAGE}@${OLD_VERSION}")"; then
    printf '%s\n' "${output}" >&2
    fail "pnpm add ${OLD_PACKAGE}@${OLD_VERSION} failed"
  fi
  installed="$(node -p 'require(process.argv[1]).version' "${scratch}/project/node_modules/${OLD_PACKAGE}/package.json")"
  if [[ "${installed}" != "${OLD_VERSION}" ]]; then
    fail "node_modules has ${OLD_PACKAGE} ${installed}, expected ${OLD_VERSION}"
  fi
}

check_audit_uses_npmjs() {
  local output status=0
  output="$(cd "${root}" && with_user_config pnpm audit:ci 2>&1)" || status=$?
  if (( status != 0 && status != AUDIT_FINDINGS_EXIT )); then
    printf '%s\n' "${output}" >&2
    fail "pnpm audit:ci exited ${status}, expected 0 or ${AUDIT_FINDINGS_EXIT}"
  fi
  if [[ "${output}" != *"${AUDIT_SUMMARY}"* || "${output}" == *"${PNPM_ERROR}"* ]]; then
    printf '%s\n' "${output}" >&2
    fail "pnpm audit:ci printed no '${AUDIT_SUMMARY}' summary or a ${PNPM_ERROR} error"
  fi
}

check_unset_token_is_named() {
  local output
  if output="$(env -u CODEARTIFACT_AUTH_TOKEN "${BASH}" "${root}/${SELF}" 2>&1)"; then
    fail "a run without CODEARTIFACT_AUTH_TOKEN passed"
  fi
  if [[ "${output}" != "${UNSET_TOKEN_LINE}" ]]; then
    fail "a run without CODEARTIFACT_AUTH_TOKEN printed '${output}', expected '${UNSET_TOKEN_LINE}'"
  fi
}

check_unset_token_keeps_the_registry() {
  local dir="${scratch}/no-token"
  local output npmrc
  make_project "${dir}"
  npmrc="$(cd "${dir}" && pwd -P)/.npmrc"
  if output="$(cd "${dir}" && with_user_config env -u CODEARTIFACT_AUTH_TOKEN pnpm add --save-exact "${OLD_PACKAGE}@${OLD_VERSION}" --store-dir "${dir}/store" 2>&1)"; then
    fail "pnpm add with CODEARTIFACT_AUTH_TOKEN unset passed, a registry other than CodeArtifact served it"
  fi
  if [[ "${output}" != *"${FETCH_401}"* || "${output}" != *"${REGISTRY_URL}"* || "${output}" == *"${npmrc}\". ${ENV_WARNING}"* ]]; then
    printf '%s\n' "${output}" >&2
    fail "pnpm add with CODEARTIFACT_AUTH_TOKEN unset printed no ${FETCH_401} from ${REGISTRY_URL}, or dropped the .npmrc"
  fi
  if [[ -e "${dir}/node_modules/${OLD_PACKAGE}" ]]; then
    fail "pnpm add with CODEARTIFACT_AUTH_TOKEN unset left node_modules/${OLD_PACKAGE}"
  fi
}

check_token_is_never_printed() {
  local output
  output="$(CODEARTIFACT_AUTH_TOKEN="${FAKE_TOKEN}" "${BASH}" "${root}/${SELF}" "${JENKINS_FLAG}" 2>&1)" || true
  if [[ "${output}" == *"${FAKE_TOKEN}"* ]]; then
    fail "a ${JENKINS_FLAG} run printed the token value"
  fi
}

check_jenkins_mode_runs_only_the_audit() {
  local output
  if ! output="$(env -u CODEARTIFACT_AUTH_TOKEN "${BASH}" "${root}/${SELF}" "${JENKINS_FLAG}" 2>&1)"; then
    printf '%s\n' "${output}" >&2
    fail "${JENKINS_FLAG} without CODEARTIFACT_AUTH_TOKEN failed"
  fi
  if [[ "${output}" != "${JENKINS_LINE}" ]]; then
    fail "${JENKINS_FLAG} printed '${output}', expected '${JENKINS_LINE}'"
  fi
}

check_repo_npmrc_has_no_token
set_up
if [[ "${jenkins}" == true ]]; then
  for case in "${JENKINS_CASES[@]}"; do
    "${case}"
  done
  printf '%s\n' "${JENKINS_LINE}"
  exit 0
fi
check_view_works_with_token
check_young_version_is_refused
check_old_version_keeps_its_publish_time
check_mature_version_installs
check_audit_uses_npmjs
check_unset_token_is_named
check_unset_token_keeps_the_registry
check_token_is_never_printed
check_jenkins_mode_runs_only_the_audit
printf '%s\n' "npm-registry.sh: the repo .npmrc has no token line, pnpm view works with a token, CodeArtifact refuses ${YOUNG_PACKAGE}@${refused_version} by age, keeps the npmjs publish time and installs ${OLD_PACKAGE}@${OLD_VERSION}, audit:ci reports from npmjs, an unset token is named, an install with an unset token gets a 401 from CodeArtifact, and a ${JENKINS_FLAG} run does not print the token"
