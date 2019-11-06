#!/bin/bash

cd /output
rm -rf bin
rm -rf lib
rm -rf share

rsync -av /build/tar/poppler.tar.gz /output/

tar zxf poppler.tar.gz
