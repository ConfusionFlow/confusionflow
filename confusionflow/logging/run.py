from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import json
import os

from confusionflow.logging.utils import (
    check_folderpath,
    update_runindex,
    update_datasetindex,
    create_logdir,
    create_dataset_config,
)
from confusionflow.logging import FoldLog


class Run:
    """
    Run is a simple wrapper for simplifying the logging of an experiment.
    """

    def __init__(self, runId, folds, trainfoldId):
        self.runId = runId
        self.folds = folds
        self.trainfoldId = trainfoldId
        self.foldlogs = list()

        for fold in self.folds:
            foldlog = self.create_foldlog(fold.foldId)
            self.foldlogs.append(foldlog)

    def get_keras_callback(self, loss):
        from confusionflow.logging.callbacks import RunLogger

        runlogger = RunLogger(self, loss)
        return runlogger

    def export(self, logdir):
        create_logdir(logdir)
        run_path = check_folderpath(os.path.join(logdir, "runs"))
        filepath = os.path.join(run_path, self.runId + ".json")
        with open(filepath, "w") as outfile:
            json.dump(self.asdict(), outfile)

        update_runindex(logdir)

        for fold in self.folds:
            create_dataset_config(logdir, fold.dataset_config)
        update_datasetindex(logdir)

        for foldlog in self.foldlogs:
            foldlog.export(logdir)

    def create_foldlog(self, foldId):
        foldlogId = self.runId + "_" + foldId
        return FoldLog(foldlogId, self.runId, foldId)

    def asdict(self):
        d = dict()
        d["runId"] = self.runId
        d["trainfoldId"] = self.trainfoldId
        d["hyperparam"] = dict()
        d["foldlogs"] = []
        for foldlog in self.foldlogs:
            d["foldlogs"].append(foldlog.asdict())

        return d
