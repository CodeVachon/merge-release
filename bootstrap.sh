rm -fr test-repo
mkdir test-repo
git clone git@github.com:CodeVachon/CodeVachon.git test-repo
cd test-repo
git checkout -b test
git checkout main
git fetch
git checkout Patch-v1.0.1 || exit 1
git pull
git checkout Release-v1.1.0 || exit 1
git pull
git checkout -b banana
git checkout -b production
