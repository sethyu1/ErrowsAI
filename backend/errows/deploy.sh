#!/usr/bin/env bash

set -eu;

BASE_DIR=$(dirname `realpath $0`)
cd $BASE_DIR/../..;

SERVER=$1
SERVICE=$2

shift
shift

SERVICES=${@:-user errows payment ops api}
DEPENDENCE="models utils ai mailer"

PROJECT_DIR="/srv/services/$SERVICE";

echo "build dependencies...";
pnpm run server build

rsync -aP  config/{errows@.service,nginx,sudoers.d}                 "$SERVER:/srv/etc/";

echo "deploy to $SERVER, SERVICE: $SERVICE";
rsync -aP ./{pnpm-workspace.yaml,pnpm-lock.yaml,package.json}       "$SERVER:$PROJECT_DIR/";

echo "install dependence...";
for d in $DEPENDENCE; do
    rsync -aPR  "backend/$d/package.json"                          "$SERVER:$PROJECT_DIR/";
done
rsync -aPR  backend/errows/package.json                            "$SERVER:$PROJECT_DIR/";
ssh $SERVER "cd "$PROJECT_DIR/"; pnpm install --prefer-offline --frozen-lockfile --prod";


for d in $DEPENDENCE; do
    echo "deploy $d package...";
    rsync -aPR "backend/$d/dist/src/index.js"                        "$SERVER:$PROJECT_DIR/"
    rsync -aP --delete --delete-excluded --include="**/*.js" --exclude="*.*" \
        "backend/$d/dist/src/"               "$SERVER:$PROJECT_DIR/backend/$d/dist/src/"
done

echo "deploy server service file...";
rsync -aPR  backend/errows/config/default.mjs                      "$SERVER:$PROJECT_DIR/";
rsync -aPR  backend/errows/config.js                               "$SERVER:$PROJECT_DIR/";
rsync -aPR  backend/errows/db                                      "$SERVER:$PROJECT_DIR/" --delete;
rsync -aPR  backend/errows/scripts                                 "$SERVER:$PROJECT_DIR/" --delete;
rsync -aPR  backend/errows/static                                  "$SERVER:$PROJECT_DIR/" --delete;
rsync -aPR  backend/errows/services/libs/characters.mjs            "$SERVER:$PROJECT_DIR/";
rsync -aPR  backend/errows/services/libs                         "$SERVER:$PROJECT_DIR/" --delete;

for d in $SERVICES; do
    echo "deploy $d service file..."
    rsync -aPR "backend/errows/services/$d.service.mjs" "$SERVER:$PROJECT_DIR/"
done