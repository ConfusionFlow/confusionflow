FROM alpine:3.8

LABEL MAINTAINER Peter Ruch <gfrogat@gmail.com>

RUN apk add --no-cache python3 py3-gevent

COPY . /opt/app
WORKDIR /opt/app

RUN python3 setup.py install

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

EXPOSE 80
CMD [ "confusionflow", "--logdir=/logs", "--host=0.0.0.0", "--port=80"]
