Usage Example torch
===================
torch - example code `[link to example] <https://github.com/confusionflow/confusionflow/tree/master/examples/torch/mnist>`_

.. note::
  This code was tested with Pytorch v0.4.1

.. literalinclude:: ../../../examples/torch/mnist/mnist_demo.py
  :lines: 102-
  :lineno-match:

In the `PyTorch <https://pytorch.org>`_ version we wrap the ``Dataloader``
objects for both the train- and test-fold in a :py:class:`Fold` object and
provide a unique identifier which references the additional metadata specified
in the ``dataset_config`` (see :doc:`dataset-config`).

We then create a :py:class:`Run` object with a unique identifier for the
experiment that is run, the list of folds that should be tracked as well as the
fold identifier ``trainfoldId`` of the fold that's used during training.

After that we can pass the :py:class:`Run` object along with the model, device,
epoch and number of classes to a utility function ``log_epoch`` which will
automatically log the performance of the current model on the specified folds.
After the training completed we can export the results to a directory
``logdir``.
