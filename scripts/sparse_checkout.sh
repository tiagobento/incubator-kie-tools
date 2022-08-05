#!/bin/sh

ARGV=("$@")
KIE_TOOLS_ORG=$1
KIE_TOOLS_BRANCH=$2
KIE_TOOLS_PACKAGE_NAMES_TO_BUILD=("${ARGV[@]:2}")
KIE_TOOLS_PACKAGES_PNPM_FILTER_STRING=$(echo ${KIE_TOOLS_PACKAGE_NAMES_TO_BUILD[@]} | xargs -n1 -I{} echo -n "-F {}... " | xargs)
KIE_TOOLS_GIT_REMOTE_URL="https://github.com/$KIE_TOOLS_ORG/kie-tools"
KIE_TOOLS_CLONE_DIR_PATH='kie-tools'
KIE_TOOLS_PATHS_INCLUDED_BY_DEFAULT='scripts repo docs'

echo "[kie-tools-sparse-checkout] Starting..."
echo "KIE_TOOLS_ORG:\t\t\t\t\t $KIE_TOOLS_ORG"
echo "KIE_TOOLS_BRANCH:\t\t\t\t $KIE_TOOLS_BRANCH"
echo "KIE_TOOLS_PACKAGE_NAMES_TO_BUILD:\t\t ${KIE_TOOLS_PACKAGE_NAMES_TO_BUILD[@]}"
echo "KIE_TOOLS_PACKAGES_PNPM_FILTER_STRING:\t\t $KIE_TOOLS_PACKAGES_PNPM_FILTER_STRING"
echo "KIE_TOOLS_GIT_REMOTE_URL:\t\t\t $KIE_TOOLS_GIT_REMOTE_URL"
echo "KIE_TOOLS_CLONE_DIR_PATH:\t\t\t $KIE_TOOLS_CLONE_DIR_PATH"
echo "KIE_TOOLS_PATHS_INCLUDED_BY_DEFAULT:\t\t $KIE_TOOLS_PATHS_INCLUDED_BY_DEFAULT"
echo ""

echo "[kie-tools-sparse-checkout] Cloning into $KIE_TOOLS_CLONE_DIR_PATH..."
git clone --filter=blob:none --no-checkout --depth 1 --branch $KIE_TOOLS_BRANCH $KIE_TOOLS_GIT_REMOTE_URL
cd $KIE_TOOLS_CLONE_DIR_PATH
git sparse-checkout init --cone
git checkout $KIE_TOOLS_BRANCH
git sparse-checkout set $KIE_TOOLS_PATHS_INCLUDED_BY_DEFAULT
echo ""

echo "[kie-tools-sparse-checkout] Installing root dependencies..."
pnpm install-dependencies -F . --frozen-lockfile
echo ""

KIE_TOOLS_PACKAGE_NAMES_TO_BUILD=(@kie-tools-core/envelope @kie-tools/kn-plugin-workflow)
echo "[kie-tools-sparse-checkout] Listing paths of packages to fetch for (${KIE_TOOLS_PACKAGE_NAMES_TO_BUILD[@]})..."
KIE_TOOLS_PACKAGE_PATHS_TO_FETCH=$(pnpm run --silent list-packages-dependencies repo "${KIE_TOOLS_PACKAGE_NAMES_TO_BUILD[@]}")
echo $KIE_TOOLS_PACKAGE_PATHS_TO_FETCH | xargs -n1
echo ""

echo "[kie-tools-sparse-checkout] Fetching packages..."
eval "git sparse-checkout set $KIE_TOOLS_PATHS_INCLUDED_BY_DEFAULT $KIE_TOOLS_PACKAGE_PATHS_TO_FETCH"
echo ""

echo "[kie-tools-sparse-checkout] Installing packages dependencies..."
eval "pnpm install-dependencies $KIE_TOOLS_PACKAGES_PNPM_FILTER_STRING -F . --frozen-lockfile && pnpm link-packages-with-self"
echo ""

echo "[kie-tools-sparse-checkout] Building packages with 'build:dev'..."
eval "pnpm $KIE_TOOLS_PACKAGES_PNPM_FILTER_STRING build:dev"
echo ""

echo "[kie-tools-sparse-checkout] Formatting changes..."
pnpm pretty-quick
echo ""

echo "[kie-tools-sparse-checkout] Git status..."
git status
echo ""

echo "[kie-tools-sparse-checkout] Done."