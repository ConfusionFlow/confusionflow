Usage Example tf.keras
======================
tf.keras - example code `[link to example] <https://github.com/confusionflow/confusionflow/tree/master/examples/tf.keras/fashion-mnist>`_

.. note::
  This code was tested with Tensorflow v1.10.1

.. literalinclude:: ../../../examples/tf.keras/fashion-mnist/fashion-mnist_demo.py
  :lines: 21-
  :lineno-match:

In the example using the `Tensorflow Keras API <https://www.tensorflow.org/guide/keras>`_
we first wrap the tuple of the ``numpy`` arrays of the instances and
corresponding labels in a :py:class:`Fold` object and provide a unique
identifier which references the additional metadata specified in the
``dataset_config`` (see :doc:`dataset-config`).

We then create a :py:class:`Run` object with a unique identifier for the
experiment that is run, the list of folds that should be tracked as well as the
fold identifier ``trainfoldId`` of the fold that's used during training.

After that we call the ``get_keras_callback`` function with the loss we use in
``model.compile``. After that we can simply pass the callback to the ``fit``
function which will automatically evaluate the model performance on the
specified folds at every epoch.

In the end we can export the ``logs`` to a ``logdir``.
