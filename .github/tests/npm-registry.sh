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
readonly UNSET_TOKEN="CODEARTIFACT_AUTH_TOKEN is unset: set it to a CodeArtifact authorization token"
readonly UNSET_TOKEN_LINE="npm-registry.sh: ${UNSET_TOKEN}"
readonly FAKE_TOKEN="fake-token-4711"

root="$(cd "$(dirname "$0")/../.." && pwd)"
scratch="$(mktemp -d "${TMPDIR:-/tmp}/npm-registry.XXXXXX")"
readonly root scratch
readonly MAX_AGE_HOURS=$(( $(sed -n 's/^minimum-release-age=//p' "${root}/.npmrc") / MINUTES_PER_HOUR ))
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
  if [[ "${jenkins}" == true ]]; then
    return
  fi
  if [[ -z "${CODEARTIFACT_AUTH_TOKEN:-}" ]]; then
    fail "${UNSET_TOKEN}"
  fi
  mkdir -p "${scratch}/project"
  cp "${root}/.npmrc" "${scratch}/project/.npmrc"
  node -e 'const pkg = require(process.argv[1]); process.stdout.write(JSON.stringify({name: "registry-check", private: true, packageManager: pkg.packageManager}))' \
    "${root}/package.json" > "${scratch}/project/package.json"
}

in_project() {
  (cd "${scratch}/project" && pnpm "$@" --store-dir "${scratch}/store" 2>&1)
}

view() {
  (cd "${scratch}/project" && pnpm view "$@")
}

publish_time() {
  local package="$1"
  local version="$2"
  shift 2
  view "${package}" time --json "$@" \
    | node -e 'let text = ""; process.stdin.on("data", (chunk) => { text += chunk; }).on("end", () => { process.stdout.write(JSON.parse(text)[process.argv[1]] ?? ""); })' "${version}"
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
  output="$(cd "${root}" && pnpm audit:ci 2>&1)" || status=$?
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

set_up
if [[ "${jenkins}" == true ]]; then
  for case in "${JENKINS_CASES[@]}"; do
    "${case}"
  done
  printf '%s\n' "${JENKINS_LINE}"
  exit 0
fi
check_young_version_is_refused
check_old_version_keeps_its_publish_time
check_mature_version_installs
check_audit_uses_npmjs
check_unset_token_is_named
check_token_is_never_printed
check_jenkins_mode_runs_only_the_audit
printf '%s\n' "npm-registry.sh: CodeArtifact refuses ${YOUNG_PACKAGE}@${refused_version} by age, keeps the npmjs publish time and installs ${OLD_PACKAGE}@${OLD_VERSION}, audit:ci reports from npmjs, an unset token is named, and the token is never printed"
