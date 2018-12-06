from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os


def check_folderpath(folderpath):
    """Checks whether supplied folderpath is a path to a directory"""
    folderpath = os.path.realpath(folderpath)
    if os.path.isdir(folderpath):
        return folderpath
    else:
        raise OSError("Error! `{}` is not a path to a valid folder".format(folderpath))


def get_logdir_from_env():
    """Tries to set the <path_to_logdir>
    from the CONFUSIONFLOW_LOGDIR environment variable"""
    logdir = os.environ.get("CONFUSIONFLOW_LOGDIR", None)
    if logdir is None:
        raise OSError(
            "Error! Please specify folder with the logs "
            "via `export CONFUSIONFLOW_LOGDIR=<path to logdir>`"
        )
    else:
        return logdir
