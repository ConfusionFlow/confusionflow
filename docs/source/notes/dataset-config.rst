Dataset Configuration
=====================

ConfusionFlow requires some additional meta-information on the dataset and
fold compositions. The information is stored in a `YAML <http://yaml.org/>`_
file.

The example below shows a configuration for the MNIST dataset.
The file contains the dataset identifier ``dataset``, a short description
``description`` and a list of the class labels ``classes``.

It then specifies the dataset folds ``folds`` as a list. In the example we have
two fold specifications, one for fold ``train`` and one for fold ``test``.
A fold has a field ``description`` for short annotations and a field
``classfrequencies`` where the frequencies for each class are added as a list
of key value items.

.. literalinclude:: ../../../examples/dataset-templates/mnist.yml
  :linenos:

.. note::
  The list of key-value item values might seem a bit strange as it will be
  parsed by ``YAML`` as a list of dictionaries of size 1.
  We decide for the option which is more user-friendly when editing the ``yml``
  file by hand as one can simply copy the list of class labels from ``classes``
  and append the frequencies.
