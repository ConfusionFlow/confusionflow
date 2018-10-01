from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import json
import os

from confusionflow.logging.utils import check_folderpath


class Fold:
    """
    A Fold is a subset of your dataset
    """

    def __init__(self, dataset, foldId, dataset_config):
        self.dataset = dataset
        self.foldId = foldId
        self.description = ""
        self.dataset_config = dataset_config
