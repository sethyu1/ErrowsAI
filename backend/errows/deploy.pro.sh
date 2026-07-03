#!/usr/bin/env bash

set -eu;

SCRIPT_DIR=`dirname $(realpath $0)`;
SERVER=${1:-errows@errows-v2-db}

echo "deploy to $SERVER ...";
"${SCRIPT_DIR}/deploy.sh" $SERVER errows;

ssh $SERVER "cd /srv/services/errows \
&& pnpm -s errowsctl bootstrap -c production \
&& pnpm -s errowsctl migration upgrade -c production \
&& sudo systemctl restart errows@errows"