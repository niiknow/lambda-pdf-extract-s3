FROM public.ecr.aws/sam/build-nodejs18.x
LABEL maintainer="noogen <friends@niiknow.org>"
ADD ./build-poppler.sh /
RUN bash /build-poppler.sh
VOLUME ["/output"]
