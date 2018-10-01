from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import json
import os

from confusionflow.logging.utils import check_folderpath


class FoldLogData:
    """
    A FoldLogData is contains the EpochData for a specific FoldLog.
    """

    def __init__(self, foldlogId):
        self.foldlogId = foldlogId
        self.numepochs = 0
        self.epochdata = list()

    def add_epochdata(self, epochId, confmat):
        epochdata = dict()
        epochdata["epochId"] = epochId
        epochdata["confmat"] = confmat

        self.epochdata.append(epochdata)
        self.numepochs = len(self.epochdata)

    def get_id(self):
        return self.foldlogId

    def get_numepochs(self):
        return self.numepochs

    def export(self, logdir):
        foldlogdata_path = check_folderpath(os.path.join(logdir, "foldlogdata"))
        filepath = os.path.join(foldlogdata_path, self.foldlogId + "_data.json")
        with open(filepath, "w") as outfile:
            json.dump(self.asdict(), outfile)

    def asdict(self):
        d = dict()
        d["foldlogId"] = self.foldlogId
        d["numepochs"] = self.numepochs
        d["epochdata"] = self.epochdata

        return d
