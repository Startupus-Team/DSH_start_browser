#!/usr/bin/env sh
# Recreate .chromium-deps/ without root: download the Debian/Ubuntu packages
# providing libnspr4/libnss3 and unpack them next to the plugin. The host
# launcher injects this directory via LD_LIBRARY_PATH when it exists.
# Only needed on systems missing those libraries (e.g. minimal WSL setups);
# systems that can sudo can simply: apt-get install -y libnspr4 libnss3
set -eu
cd "$(dirname "$0")/.."
mkdir -p .chromium-deps
cd .chromium-deps
apt-get download libnspr4 libnss3
for deb in *.deb; do
  dpkg -x "$deb" .
done
echo "OK: $(find . -name 'libnss3.so' -o -name 'libnspr4.so' | tr '\n' ' ')"
