#!/bin/bash

cd /output
rm -rf bin

rsync -av /build/tar/poppler.tar.gz /output/

tar zxf poppler.tar.gz
