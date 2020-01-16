#!/bin/bash -xe
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
DOC_DIR="${BASE_DIR}/documentation"

# exit if diractories do not exist
[[ ! -d "$BASE_DIR" ]] && exit 1

# ensure we return to original directory even if script fails
function finish {
  popd
}
trap finish exit

# go to project dir and generate documentation
pushd $BASE_DIR
npx compodoc --tsconfig tsconfig.json
popd

# go to doc dir, init new repository, add contents, commit and push to gh-pages branch
pushd $DOC_DIR
rm -rf .git
git init
git add .
git commit -m "Deploy to GitHub Pages"
git push --force git@github.com:ConsenSys/ekho.git master:gh-pages
rm -rf .git
