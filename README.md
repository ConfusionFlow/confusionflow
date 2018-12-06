![ConfusionFlow Banner](https://github.com/confusionflow/confusionflow/blob/master/docs/source/_static/img/confusionflow-banner.png)

ConfusionFlow is a visualization tool distributed as Python package that enables more nuanced monitoring of a neural network's training process.

-   track and visualize the model performance of different timepoints (i.e., epochs) and dataset folds and compare different runs (e.g., different hyperparameter configurations).
-   we provide wrappers for exporting performance logs in the required format.

ConfusionFlow is in an early-preview alpha. Expect some bugs and rough edges.

![ConfusionFlow Teaser](https://github.com/confusionflow/confusionflow/blob/master/docs/source/_static/img/confusionflow-teaser.png)

## Demo

Try the latest stable release of ConfusionFlow with several [example logs](http://data.caleydo.org/app_data/confusionflow-example-data.zip) for the CIFAR-10 dataset: http://confusionflow.caleydoapp.org

## Additional Information

ConfusionFlow was developed as a visualization tool to provide users with more feedback while developing or tuning neural network based classifiers. Performance monitoring often only utilizes simple line charts (one would for example plot the model loss and accuracy) which might easily miss many details and changes in the model's error structure.

While the errors for a specific model state (e.g., at a certain epoch) can be represented as a confusion matrix, it is difficult to compare multiple confusion matrices or track changes over time.
ConfusionFlow visualizes model confusion over multiple model states and lets users compare different folds (e.g., train vs test set) or different hyperparameter configurations.

To the best of our knowledge there are still no other tools with similar functionality.

### Limitations

#### Number of classes

Due to screenspace limitations the system is currently limited to around 10 classes. We are aware that we will not be able to handle datasets at _ImageNet_ scale BUT those datesets are not very common, as they are usually very expensive to obtain. A large percentage of classification problems range around 10 or less classes where ConfusionFlow can provide additional feedback.

#### Runtime overhead

Logging the performance for multiple folds every epoch might severely slowdown the time to convergence (especially when creating logs for the complete train and test sets). While logging on a minibatch level might provide additional information, it also severely slows down the training even further. It is possible to alleviate this problem by persisting model checkpoints and creating the performance logs on different machines. However, this also involves a lot of engineering effort and will not be supported by ConfusionFlow in the near future.

## Installation

Confusionflow can be either downloaded directly from PyPI via `pip install confusionflow` or by cloning and installing the repository directly from source:

### From Source

First make sure you have [node](https://nodejs.org/en/) installed (required for building the UI component).

Clone and install the repository:

```
git clone https://github.com/confusionflow/confusionflow
cd confusionflow
python setup.py install
```

#### Development

If you want develop ConfusionFlow locally run:

```
python setup.py build_ui develop
```

## Getting Started

As a first step you need to create some logs before you can start analyzing. Have a look at the `examples` folder and run one of the examples.
The each example will create a new subdirectory `logs` where the performance logs will be stored.

You then can start the ConfusionFlow UI via:

```
confusionflow --logdir `<path_to_logdir>`
```

### Usage Examples

#### tf.keras

-   [fashion-mnist](./examples/tf.keras/fashion-mnist)

#### torch

-   [mnist](./examples/torch/mnist)

If you are using your own datasets you have to create a [dataset-configuration](https://docs.confusionflow.org/notes/dataset-config) first. We provide some example configurations for some popular datasets in `examples/dataset-templates` which should help you getting started.

### Docker

You can also run ConfusionFlow via Docker. For more information please see the [documentation](https://docs.confusionflow.org/notes/how-to-commandline.html#docker).

## Logging

We provide simple wrappers for [Tensorflow Keras API](https://www.tensorflow.org/guide/keras) as well as [Pytorch](https://pytorch.org) for logging confusion matrices and exporting them in the format required by ConfusionFlow. For more information please consult the [logging documentation](https://docs.confusionflow.org/notes/how-to-logging.html).

### Log Directory Layout

```
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
```

## Documentation

The latest documentation can be viewed on [docs.confusionflow.org](https://docs.confusionflow.org)

### API

The Python package includes a simple Flask based server that implements the current API.
The current API definition can be found in `tools/swagger/api.yml` and can be viewed using the [Swagger Editor](https://editor.swagger.io/).

## ConfusionFlow UI

The ConfusionFlow UI is currently developed at [Caleydo/confusionflow-ui](https://github.com/Caleydo/confusionflow-ui).

## The Team

ConfusionFlow is a research project of the [Institute of Computer Graphics](https://www.jku.at/cg) at [Johannes Kepler University Linz](https://www.jku.at/) in collaboration with the [IBM Visual AI Lab](https://researcher.watson.ibm.com/researcher/view_group.php?id=5948).
ConfusionFlow is currently maintained by [Peter Ruch](https://github.com/gfrogat) and [Holger Stitz](https://github.com/thinkh).

## Feedback

We would be really grateful for any [feedback](https://github.com/confusionflow/confusionflow/issues/new?template=feedback.md) via the repository's issues section.

## Getting Involved

-   You can ask questions on our mailing list [confusionflow-dev@googlegroups.com](https://groups.google.com/forum/#!forum/confusionflow-dev).
-   Please report bugs by submitting a [GitHub issue](https://github.com/ConfusionFlow/confusionflow/issues/new?template=bug_report.md).
