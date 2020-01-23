#!/bin/bash

cd /output
rm -rf bin

rsync -av /build/tar/poppler.tar.gz /output/

tar zxf poppler.tar.gz

rm -f /output/bin/lib/libnssckbi.so
cp -fH /etc/alternatives/libnssckbi.so.x86_64 /output/bin/lib/libnssckbi.so
cp -fH /usr/lib64/libexpat.so.1  /output/bin/lib/
cp -fH /usr/lib64/libjbig.so.2.0 /output/bin/lib/
rm -f poppler.tar.gz
