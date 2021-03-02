FROM amazon/aws-sam-cli-build-image-nodejs14.x
LABEL maintainer="noogen <friends@niiknow.org>"
ADD ./build-poppler.sh /
RUN bash /build-poppler.sh
VOLUME ["/output"]
