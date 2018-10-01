FROM alpine:3.8

LABEL MAINTAINER Peter Ruch <gfrogat@gmail.com>

RUN apk add --no-cache python3 py3-gevent

COPY . /opt/app
WORKDIR /opt/app

RUN python3 setup.py build develop

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

ENV FLASK_APP=confusionflow
ENV FLASK_ENV=development
ENV CONFUSIONFLOW_LOGDIR=/logs

EXPOSE 80
CMD [ "flask", "run", "--host=0.0.0.0", "--port=80"]
