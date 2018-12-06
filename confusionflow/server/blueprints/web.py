from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from flask import Blueprint

from confusionflow.server.utils import serve_file


static_file_path = None

bp = Blueprint("static", __name__)


@bp.record
def record_satic_file_path(setup_state):
    """Sets the static_file_path based on the config during Blueprint setup."""
    global static_file_path

    config = setup_state.app.config
    static_file_path = config["STATIC_FILE_PATH"]


@bp.route("/")
def index():
    """Returns 'index.html' of 'ui' component"""
    return serve_file(static_file_path, "index.html", "")


@bp.route("/<path:filename>")
def serve_static(filename):
    """Serves files from 'static_file_folder'."""
    return serve_file(static_file_path, filename, "")
