# Lambda pdfxs3 (PDF extract s3)
> A [Serverless](https://serverless.com/) service extract pdf on s3

# Build
```
tmp_img=`docker build .`
docker run -v $(pwd)/poppler:/output -it $tmp_img ./output/copy.sh
cd poppler
```
# MIT
