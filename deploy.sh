#!/bin/sh
# Build and publish dist/ to the gh-pages branch (served by GitHub Pages).
set -e
npm test
npm run build
touch dist/.nojekyll
cd dist
git init -q
git checkout -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date +%Y-%m-%d\ %H:%M)"
git push -f -q "$(git -C .. remote get-url origin)" gh-pages
rm -rf .git
echo "Deployed. Live in ~1 minute."
