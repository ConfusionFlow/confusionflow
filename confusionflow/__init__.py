from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import argparse

from gevent import pywsgi

from confusionflow import _version
from confusionflow.server import create_app

__version__ = _version.__version__


def main():
    parser = argparse.ArgumentParser(description="ConfusionFlow CLI")
    parser.add_argument("--host", type=str, default="localhost")
    parser.add_argument("--logdir", type=str, required=True)
    parser.add_argument("--port", type=int, default=8080)

    FLAGS = parser.parse_args()

    confusionflow_app = create_app(FLAGS.logdir)

    http_server = pywsgi.WSGIServer((FLAGS.host, FLAGS.port), confusionflow_app)

    try:
        print(
            "Starting ConfusionFlow Server on http://{}:{}".format(
                FLAGS.host, FLAGS.port
            )
        )
        http_server.serve_forever()
    except KeyboardInterrupt:
        print("Server received KeyboardInterrupt. Shutting down ...")


if __name__ == "__main__":
    main()
