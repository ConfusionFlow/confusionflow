from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os

from flask import Flask

import confusionflow
from confusionflow.server.blueprints import api, web
from confusionflow.utils import check_folderpath, get_logdir_from_env


def create_app(logdir=None):
    app = Flask(__name__)

    if logdir is None:
        logdir = get_logdir_from_env()

    static_file_path = os.path.join(
        os.path.dirname(os.path.realpath(confusionflow.__file__)), "static"
    )

    # setup api
    app.config["LOGDIR"] = check_folderpath(logdir)
    app.register_blueprint(api.bp, url_prefix="/api")

    # setup web
    # only setup web if not in development mode
    if app.config["ENV"] != "development":
        app.config["STATIC_FILE_PATH"] = check_folderpath(static_file_path)
        app.register_blueprint(web.bp)
        app.add_url_rule("/", endpoint="index")

    return app
