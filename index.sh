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

read -r mbx1 mby1 mbx2 mby2 < <(pdfinfo -box index.pdf | grep "MediaBox:" | sed 's/[a-zA-Z: ]*\([0-9\.]\+\)*[ ]\([0-9\.]\+\)*[ ]\([0-9\.]\+\)*[ ]\([0-9\.]\+\)*[ ]/\1 \2 \3 \4/')
read -r cbx1 cby1 cbx2 cby2  < <(pdfinfo -box index.pdf | grep "CropBox:" | sed 's/[a-zA-Z: ]*\([0-9\.]\+\)*[ ]\([0-9\.]\+\)*[ ]\([0-9\.]\+\)*[ ]\([0-9\.]\+\)*[ ]/\1 \2 \3 \4/')

echo '{ "MediaBox": { "x": $mbx1, "y": $mby1, "xx": $mbx2 "yy": $mby2 }, "CropBox": { "x": $cbx1, "y": $cby1, "xx": $cbx2 "yy": $cby2 } }' > mcbox.json

${base_exec}pdftoppm -q -cropbox-jpeg -r $file_dpi -scale-to-x 1400 -scale-to-y -1 index.pdf jpeg-1400-page
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
