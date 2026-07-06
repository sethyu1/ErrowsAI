#!/usr/bin/env bash

set -eu;

SERVER=${1:-errows@dev-server}

DEPLOY_SCRIPT=$(realpath "`dirname $0`/../deploy.sh")
$DEPLOY_SCRIPT testing errows-web $SERVER