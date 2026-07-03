#!/usr/bin/env bash

set -eu;

SERVER=${1:-errows@errows-v2-web}

DEPLOY_SCRIPT=$(realpath "`dirname $0`/../deploy.sh")
$DEPLOY_SCRIPT errows errows-console $SERVER