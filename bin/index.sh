#!/bin/bash
cwd=$(pwd)
file_dpi=$1
work_dir=$2
width=$3
filename=$4

cd "$work_dir"
$cwd/poppler/bin/pdftoppm -jpeg -r $file_dpi -scale-to-x 1000 -scale-to-y -1 index.pdf jpeg-1000-page
$cwd/poppler/bin/pdftoppm -jpeg -r $file_dpi -scale-to-x $width -scale-to-y -1 index.pdf "jpeg-$width-page"
$cwd/poppler/bin/pdftohtml -p -xml -hidden index.pdf
$cwd/poppler/bin/pdftoppm -r $file_dpi index.pdf ppm-page
cp -f jpeg-1000-page-1.jpg index.jpg || true
cp -f jpeg-1000-page-01.jpg index.jpg || true
cp -f jpeg-1000-page-1.jpg "$filename" || true
