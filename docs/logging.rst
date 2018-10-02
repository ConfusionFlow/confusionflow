confusionflow.logging
===================================

.. automodule:: confusionflow.logging

DataStructures
--------------

.. autoclass:: Fold
    :members:

.. autoclass:: Run
    :members:



How to log a run
----------------

Usage Example tf.keras
~~~~~~~~~~~~~~~~~~~~~~
tf.keras - example code `[link to example] <https://github.com/confusionflow/confusionflow/tree/master/examples/tf.keras/fashion-mnist>`_

.. literalinclude:: ../examples/tf.keras/fashion-mnist/fashion-mnist_demo.py
   :lines: 25-
   :lineno-match:


Usage Example torch
~~~~~~~~~~~~~~~~~~~
torch - example code `[link to example] <https://github.com/confusionflow/confusionflow/tree/master/examples/torch/mnist>`_

.. literalinclude:: ../examples/torch/mnist/mnist_demo.py
   :lines: 102-
   :lineno-match:



Log Directory Layout
--------------------

.. code-block:: text

    <logdir>
    ├── datasets                    <--- dataset config files
    │   ├── mnist.json
    │   └── index.yml
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
