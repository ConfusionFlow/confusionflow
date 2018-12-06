Logging with ConfusionFlow
==========================

In ConfusionFlow provides a way to monitor your deep learning experiments at
the model error level.
An experiment encompasses a ``model`` derived from a ``model class`` or
``architecture``, an ``optimization`` or ``model selection`` procedure as well
as multiple independent subsets of your data, called ``folds``, that are used
for training and evaluation.

In the standard setting the performance of the model is evaluated every epoch
on the training as well as the test set and the model errors at each epoch are
logged as a confusion matrix.

As ConfusionFlow requires some additional meta-information on the dataset and
fold compositions for rendering the UI one needs to wrap each data fold in a
separate :py:class:`Fold` object.
Each :py:class:`Fold` object is identified by a ``foldId`` which references
the relevant entry in the ``dataset-config`` file.

For an explanation of the ``dataset_config`` format please see
:doc:`dataset-config`.


.. code-block:: python

  train_fold = Fold(data=<train_data>, foldId="mnist_train", dataset_config="mnist.yml")
  test_fold = Fold(data=<test_data>, foldId="mnist_test", dataset_config="mnist.yml")


Next we create a :py:class:`Run` object with a unique ``runId``, which
identifies the corresponding experiment, a list with the dataset folds that you
want to evaluate the performance on, and the ``trainfoldId`` which references
the fold that is used for training.


.. code-block:: python

  run = Run(
      runId="mnist_experiment",
      folds=[train_fold, test_fold],
      trainfoldId="mnist_train",
  )


The :py:class:`Run` object is then used for logging the performance metrics and
integrates into the training loop of each frameworks (see examples below).

.. _logging-how-to.usage-examples:

Usage Examples
~~~~~~~~~~~~~~
.. toctree::
   :maxdepth: 1

   tf.keras <how-to-logging-keras>
   torch <how-to-logging-torch>

After the experiment has been completed the logs ran be exported to a log
directory.


.. code-block:: python

  run.export(logdir="logs")


The logs are organized in the log directory in separate folders ``datasets``,
``runs``, ``foldlogs`` (the logs for each fold) and the corresponding data
``foldlogdata``.


.. code-block:: text

  <logdir>
  ├── datasets                    <--- dataset config files
  │   ├── mnist.json
  │   └── index.json
  ├── foldlogdata                 <--- foldlog data
  │   ├── example_log_mnist_train_data.json
  │   └── example_log_mnist_test_data.json
  ├── foldlog                     <--- foldlog specifications
  │   ├── example_log_mnist_train.json
  │   └── example_log_mnist_test.json
  ├── runs                        <--- run specifications
  │   ├── example_log.json
  │   └── index.json
  └── views                       <--- view specifications (currently unsused)
