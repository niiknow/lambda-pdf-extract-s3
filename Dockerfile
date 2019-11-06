FROM amazonlinux:2
LABEL maintainer="noogen <friends@niiknow.org>"
ADD ./build-poppler.sh /
RUN bash /build-poppler.sh
VOLUME ["/output"]
