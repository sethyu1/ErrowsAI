#!/usr/bin/env sh

set -e;

BASE=$(cd `dirname "$0"`; pwd);
DOMAIN=$1;
APP=$2
PKG=$(realpath "$3")
dst="$APP-$(date +%Y%m%dT%H%M%S)";

echo $PKG;
echo "deploying to $dst ..";
cd "/srv/services/";

mkdir -p $DOMAIN/$dst;
cd $DOMAIN/$dst;
tar xf $PKG --strip-components=1 --exclude "*.map";

cd ..;
echo "linking release to `realpath $dst`";
ln -sfn `realpath $dst` $APP;