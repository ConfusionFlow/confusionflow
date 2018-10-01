from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import json
import os

from confusionflow.logging.utils import check_folderpath
from confusionflow.logging.foldlogdata import FoldLogData


class FoldLog:
    """
    A FoldLog is a performance log of a model for a fold.
    """

    def __init__(self, foldlogId, runId, foldId):
        self.foldlogId = foldlogId
        self.description = ""
        self.runId = runId
        self.foldId = foldId
        self.foldlogdata = FoldLogData(foldlogId)

    def add_epochdata(self, epochId, confmat):
        self.foldlogdata.add_epochdata(epochId, confmat)

    def export(self, logdir):
        foldlog_path = check_folderpath(os.path.join(logdir, "foldlogs"))
        filepath = os.path.join(foldlog_path, self.foldlogId + ".json")
        with open(filepath, "w") as outfile:
            json.dump(self.asdict(), outfile)

        self.foldlogdata.export(logdir)

    def asdict(self):
        return {
            "foldlogId": self.foldlogId,
            "description": self.description,
            "runId": self.runId,
            "foldId": self.foldId,
            "foldlogdataId": self.foldlogdata.get_id() + "_data",
            "numepochs": self.foldlogdata.get_numepochs(),
        }
