confusionflow.server
===================================

.. automodule:: confusionflow.server

How to start the server
-----------------------

The server can be started by typing

.. code-block:: bash

    confusionflow --logdir <path_to_logdir>


After starting the server navigate to http://localhost:8080 in your browser.


Example Data
------------

You can use the `example data <http://data.caleydo.org/app_data/confusionflow-example-data.zip>`_ which contains several logs for the `CIFAR-10 <https://www.cs.toronto.edu/~kriz/cifar.html>`_ dataset.

Simply download and unzip the archive and point ``confusionflow`` to the ``data`` folder.

.. code-block:: bash

    wget http://data.caleydo.org/app_data/confusionflow-example-data.zip
    unzip confusionflow-example-data.zip
    confusionflow --logdir data


Docker
~~~~~~

If you are already familiar with `Docker <https://docs.docker.com/get-started/>`_ you can also run the server from a container.

.. code-block:: bash

    # optional: download the example data
    wget http://data.caleydo.org/app_data/confusionflow-example-data.zip
    unzip confusionflow-example-data.zip

    docker run --rm -p 8080:80 -v <absolute_path_to_logdir>:/logs -ti confusionflow/confusionflow:latest

By default the server runs inside the container on ``http://0.0.0.0:80`` and serves the ``/logs`` folder.
For our needs we map the container to ``http://localhost:8080`` and map our local ``logdir`` to the ``/logs`` folder in the container.

**Important:** Make sure you use the **absolute path** to your ``logdir``.
