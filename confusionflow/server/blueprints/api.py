from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os

from flask import Blueprint

from confusionflow.server.utils import serve_file


logdir = None

bp = Blueprint("api", __name__)


@bp.record
def record_logdir(setup_state):
    """Sets the logdir based on the config during Blueprint setup."""
    global logdir

    config = setup_state.app.config
    logdir = config["LOGDIR"]


# TODO update to ETag
@bp.after_request
def set_response_headers(response):
    """Disables caching."""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@bp.route("/")
def api_hello():
    return "Welcome to ConfusionFlow API"


@bp.route("/runs")
def get_runs():
    """Returns a list of all available runs as a JSON file."""
    runfolder = os.path.join(logdir, "runs")
    return serve_file(runfolder, "index.json", "Could not load runs.")


@bp.route("/run/<runId>")
def get_run_by_id(runId):
    """Returns the run <runId> as a JSON file."""
    runfolder = os.path.join(logdir, "runs")
    filename = runId + ".json"
    return serve_file(runfolder, filename, "runId not found")


@bp.route("/foldlog/<foldlogId>")
def get_foldlog_by_id(foldlogId):
    """Returns the foldlog <foldlogId> as a JSON file."""
    foldlogfolder = os.path.join(logdir, "foldlogs")
    filename = foldlogId + ".json"
    return serve_file(foldlogfolder, filename, "foldlogId not found")


@bp.route("/foldlog/<foldlogId>/data")
def get_foldlogdata_by_id(foldlogId):
    """Returns the data for foldlog <foldlogId> as a JSON file."""
    foldlogdatafolder = os.path.join(logdir, "foldlogdata")
    filename = foldlogId + "_data.json"
    return serve_file(foldlogdatafolder, filename, "data for foldlogId not found")


@bp.route("/datasets")
def get_datasets():
    """Returns a list of all avaliable datasets as a JSON file."""
    datasetsfolder = os.path.join(logdir, "datasets")
    return serve_file(datasetsfolder, "index.json", "Could not load datasets.")


@bp.route("/dataset/<datasetId>")
def get_dataset_by_id(datasetId):
    """Returns the dataset <datasetId> as a JSON file."""
    datasetsfolder = os.path.join(logdir, "datasets")
    filename = datasetId + ".json"
    return serve_file(datasetsfolder, filename, "datasetId not found.")


@bp.route("/views")
def get_views():
    return "not implemented yet"


@bp.route("/view/<viewId>")
def get_view_by_id(viewId):
    return "not implemented yet"
