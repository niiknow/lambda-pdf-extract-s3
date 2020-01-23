#!/bin/bash

cd /output
rm -rf bin

rsync -av /build/tar/poppler.tar.gz /output/

tar zxf poppler.tar.gz

rm -f /output/bin/lib/libnssckbi.so
cp -f /usr/lib64/pkcs11/p11-kit-trust.so /output/bin/lib/libnssckbi.so

rm -f poppler.tar.gz
