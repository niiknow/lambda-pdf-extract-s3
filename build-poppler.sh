#!/bin/bash
# This script is use to build poppler on ec2 and push to an s3 bucket
#
S3BUCKET=bucket-to-push # bucket to push build result to

## Set desired software version here
# until aws support openjpeg2-devel we have to stay on 0.61.0
# even latest AWS AMI2 doesn't have openjpeg2 at the moment
VCMake=3.15.5
VPoppler=0.61.0
Vpopplerdata=0.4.9
VBuild=/build

yum -y groupinstall "Development Tools"

## Install necessary tools
yum -y install gcc gnu-getopt libpng-devel curl rsync \
  libspiro-devel freetype-devel libjpeg-turbo-devel git zip unzip make gettext

## Additional poppler dependencies
yum -y install gcc-c++ openjpeg-devel patch libtool libtool-ltdl-devel \
  pixman-devel python-devel glib2-devel pango-devel libxml2-devel libtiff-devel \
  giflib-devel

rm -rf ${VBuild}/

## Make temporary directory
mkdir -p ${VBuild}/{install,downloads,tar,pkg}

if ! [ -x "$(command -v cmake)" ] || [ "$(cmake --version | head -n1 | cut -d' ' -f3 | cut -d'.' -f1)" -lt 3 ] ; then
  echo "CMake is less than 3.0.0 - install new cmake"

  ## Make sure old cname is removed cmake before we install
  yum -y remove cmake

  ###################
  pushd .

  ## CMake
  cd  ${VBuild}/downloads/
  curl -sL https://github.com/Kitware/CMake/releases/download/v${VCMake}/cmake-${VCMake}.tar.gz -o cmake.tar.gz
  tar xzf cmake.tar.gz
  cd cmake-${VCMake}

  ## Compile
  ./bootstrap
  make
  make install
fi

## Poppler
cd  ${VBuild}/downloads/
#curl -sL https://poppler.freedesktop.org/poppler-${VPoppler}.tar.xz -o poppler.tar.xz
curl -sL http://poppler.freedesktop.org/poppler-${VPoppler}.tar.xz -o poppler.tar.xz
tar xf poppler.tar.xz
cd poppler-${VPoppler}

## Compile
mkdir build
cd build
cmake ..
make install DESTDIR="$VBuild"

#############
## Install poppler-data
cd ${VBuild}/downloads/
#curl -sL https://poppler.freedesktop.org/poppler-data-${Vpopplerdata}.tar.gz -o poppler-data.tar.gz
curl -sL https://poppler.freedesktop.org/poppler-data-${Vpopplerdata}.tar.gz -o poppler-data.tar.gz
tar xzf poppler-data.tar.gz
cd poppler-data-${Vpopplerdata}

mkdir build
cd build
cmake ..
make install DESTDIR="$VBuild"
###############

##############
## Copying dependencies
mkdir -p ${VBuild}/pkg/{lib,bin,share}
mkdir -p ${VBuild}/pkg/lib/pkgconfig
rsync -av /usr/lib64/libfontconf* ${VBuild}/pkg/lib/
rsync -av /usr/lib64/libfreety* ${VBuild}/pkg/lib/
rsync -av /usr/lib64/libjp* ${VBuild}/pkg/lib/
rsync -av /usr/lib64/libz.* ${VBuild}/pkg/lib/
rsync -av /usr/lib64/libpn* ${VBuild}/pkg/lib/
rsync -av /usr/lib64/libti* ${VBuild}/pkg/lib/
rsync -av /usr/lib64/libca* ${VBuild}/pkg/lib/
rsync -av /usr/lib64/libopenjp* ${VBuild}/pkg/lib/
rsync -av /usr/lib64/libc.so ${VBuild}/pkg/lib/
rsync -av /usr/lib64/libnss* ${VBuild}/pkg/lib/
rsync -av ${VBuild}/usr/local/lib64/ ${VBuild}/pkg/lib/
rsync -av ${VBuild}/usr/local/lib64/pkgconfig/ ${VBuild}/pkg/lib/pkgconfig/
rsync -av ${VBuild}/usr/local/share/pkgconfig/*.pc ${VBuild}/pkg/lib/pkgconfig/
rsync -av ${VBuild}/usr/local/bin/ ${VBuild}/pkg/bin/
rsync -av ${VBuild}/usr/local/share/poppler ${VBuild}/pkg/share/

popd

tar -C ${VBuild}/pkg -zcvf ${VBuild}/tar/poppler.tar.gz .

echo "!\bin/bash\nrsync -av /build/tar/*.* /output/\n" > /copy.sh
chmod +x /copy.sh

#aws s3 cp ~/tmp/tar/poppler.tar.gz s3://"${S3BUCKET}"/poppler.tar.gz
