from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import numpy as np
import tensorflow as tf


class RunLogger(tf.keras.callbacks.Callback):
    """
    A Runlogger is a Keras Callback for evaluating the model performance on the
    specified folds and logging the confusion matrices.
    """

    def __init__(self, run, loss):
        self.run = run
        self.loss = loss
        self.session = tf.Session()

    def on_epoch_begin(self, epoch, logs={}):
        for fold, foldlog in zip(self.run.folds, self.run.foldlogs):
            assert fold.foldId == foldlog.foldId

            self.log_performance(fold, foldlog, epoch)

    def log_performance(self, fold, foldlog, epoch):
        x, y = fold.data
        predictions = np.argmax(self.model.predict(x, verbose=0), axis=1)
        if self.loss == "categorical_crossentropy":
            targets = np.argmax(y, axis=1)
        elif self.loss == "sparse_categorical_crossentropy":
            targets = y
        else:
            raise ValueError("loss `{}` is not supported".format(self.loss))
        confmat = tf.confusion_matrix(targets, predictions)
        # transform tf.Tensor to list
        confmat = confmat.eval(session=self.session).flatten().tolist()
        foldlog.add_epochdata(epochId=epoch, confmat=confmat)
