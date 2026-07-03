#!/usr/bin/env bash

set -eu;

SERVER=${1:-errows@errows-dev}

DEPLOY_SCRIPT=$(realpath "`dirname $0`/../deploy.sh")
$DEPLOY_SCRIPT testing errows-console $SERVER