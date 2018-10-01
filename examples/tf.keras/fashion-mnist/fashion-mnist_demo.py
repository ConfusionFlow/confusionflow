from __future__ import print_function

import numpy as np
import tensorflow as tf

from confusionflow.logging import Fold, Run

fashion_mnist = tf.keras.datasets.fashion_mnist

(x_train, y_train), (x_test, y_test) = fashion_mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0

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

# define folds used by this run
train_fold = Fold((x_train, y_train), "fashion-mnist_train", "fashion-mnist.yml")
test_fold = Fold((x_test, y_test), "fashion-mnist_test", "fashion-mnist.yml")

# create new run object with the folds that should be logged
run = Run(
    runId="example_logs",
    folds=[train_fold, test_fold],
    trainfoldId="fashion-mnist_train",
)

# create a new Keras callback for logging the performance after every epoch
runlogger = run.get_keras_callback("sparse_categorical_crossentropy")

# fit the model and supply the `runlogger` callback.
model.fit(x_train, y_train, epochs=3, batch_size=64, callbacks=[runlogger])

# export current log to logdir
run.export(logdir="logs")

