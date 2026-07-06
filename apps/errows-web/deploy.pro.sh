#!/usr/bin/env bash

set -eu;

SERVER=${1:-errows@production-web}

DEPLOY_SCRIPT=$(realpath "`dirname $0`/../deploy.sh")
$DEPLOY_SCRIPT errows errows-web $SERVER