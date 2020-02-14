#!/bin/sh
cwd=$(pwd)
file_dpi=$1
work_dir=$2
width=$3
filename=$4
base_exec="$cwd/bin/"


if [ "$(uname)" = "Darwin" ]; then
  base_exec=""
fi

echo $(pwd)

cd "$work_dir"

echo $(pwd)

if [ "1400" != "$width" ]; then
  ${base_exec}pdftoppm -q -cropbox -jpeg -r $file_dpi -scale-to-x $width -scale-to-y -1 index.pdf "jpeg-$width-page"
fi

PDF_INFO=${base_exec}pdfinfo

MBSTR=`$PDF_INFO -box index.pdf | grep "MediaBox:"`
CBSTR=`$PDF_INFO -box index.pdf | grep "CropBox:"`
MBARRAY=($MBSTR)
CBARRAY=($CBSTR)

echo '{ "MediaBox": { "x": '${MBARRAY[1]}', "y": '${MBARRAY[2]}', "xx": '${MBARRAY[3]}', "yy": '${MBARRAY[4]}' }, "CropBox": { "x": '${CBARRAY[1]}', "y": '${CBARRAY[2]}', "xx": '${CBARRAY[3]}', "yy": '${CBARRAY[4]}'} }' > mcbox.json

${base_exec}pdftoppm -q -cropbox -jpeg -r $file_dpi -scale-to-x 1400 -scale-to-y -1 index.pdf jpeg-1400-page
${base_exec}pdftohtml -q -p -hidden -xml index.pdf
${base_exec}pdftoppm -q -cropbox -r $file_dpi index.pdf ppm-page

if [ -f "jpeg-1400-page-01.jpg " ]; then
  cp -f jpeg-1400-page-01.jpg index.jpg || true
else
  cp -f jpeg-1400-page-1.jpg index.jpg || true
fi

cp -f index.jpg "$filename"

# finally, rename index pdf to prevent infinit loop of bucket reprocessing
mv -f index.pdf index.pdx
