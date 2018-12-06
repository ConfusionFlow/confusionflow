from __future__ import absolute_import
from __future__ import division
from __future__ import print_function


class Fold:
    """
    A Fold is a subset of your dataset
    """

    def __init__(self, data, foldId, dataset_config):
        self.data = data
        self.foldId = foldId
        self.description = ""
        self.dataset_config = dataset_config
