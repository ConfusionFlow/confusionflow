from __future__ import print_function

import numpy as np
import tensorflow as tf

from confusionflow.logging import Fold, Run

model = tf.keras.models.Sequential(
    [
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(256, activation=tf.nn.relu),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(10, activation=tf.nn.softmax),
    ]
)

model.compile(
    optimizer="sgd", loss="sparse_categorical_crossentropy", metrics=["accuracy"]
)

fashion_mnist = tf.keras.datasets.fashion_mnist
(x_train, y_train), (x_test, y_test) = fashion_mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0

# define folds used by this run
train_fold = Fold(
    data=(x_train, y_train),
    foldId="fashion-mnist_train",
    dataset_config="fashion-mnist.yml",
)
test_fold = Fold(
    data=(x_test, y_test),
    foldId="fashion-mnist_test",
    dataset_config="fashion-mnist.yml",
)

# create new run object with the folds that should be logged
run = Run(
    runId="example_logs_tf.keras",
    folds=[train_fold, test_fold],
    trainfoldId="fashion-mnist_train",
)

# create a new Keras callback for logging the performance after every epoch
runlogger = run.get_keras_callback(loss="sparse_categorical_crossentropy")

# fit the model and supply the `runlogger` callback.
model.fit(x_train, y_train, epochs=3, batch_size=64, callbacks=[runlogger])

# export current log to logdir
run.export(logdir="logs")

