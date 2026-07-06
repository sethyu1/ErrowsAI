#!/usr/bin/env bash

set -eu;

SCRIPT_DIR=`dirname $(realpath $0)`;
SERVER=${1:-errows@dev-server}

echo "deploy to $SERVER ...";
"${SCRIPT_DIR}/deploy.sh" $SERVER testing;

ssh $SERVER "cd /srv/services/testing \
&& pnpm -s errowsctl bootstrap -c production \
&& pnpm -s errowsctl migration upgrade -c production \
&& sudo systemctl restart errows@testing"