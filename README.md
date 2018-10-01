![ConfusionFlow Banner](https://github.com/confusionflow/confusionflow/blob/master/docs/_static/img/confusionflow-banner.png)

ConfusionFlow is a visualization tool distributed as Python package that enables more nuanced monitoring of a neural network's training process.
- track and visualize the model performance of different timepoints (i.e., epochs) and dataset folds and compare different runs (e.g., different hyperparameter configurations).
- we provide wrappers for exporting performance logs in the required format.

ConfusionFlow is in an early-preview alpha. Expect some bugs and rough edges.


## Additional Information
ConfusionFlow was developed as a visualization tool to provide users with more feedback while developing or tuning neural network based classifiers. Performance monitoring often only utilizes simple line charts (one would for example plot the model loss and accuracy) which might easily miss many details and changes in the model's error structure.

While the errors for a specific model state (e.g., at a certain epoch) can be represented as a confusion matrix, it is difficult to compare multiple confusion matrices or track changes over time.
ConfusionFlow visualizes model confusion over multiple model states and let users compare different folds (e.g., train vs test set) or different hyperparameter configurations.

To the best of our knowledge there are still no other tools with similar functionality.


### Limitations
#### Number of classes
Due to screenspace limitations the system is currently limited to around 10 classes. We are aware that we will not be able to handle datasets at *ImageNet* scale BUT those datesets are not very common, as they are usually very expensive to obtain. A large percentage of classification problems ranges around 10 or less classes where ConfusionFlow can provide additional feedback.

#### Runtime overhead
Logging the performance for multiple folds every epoch might severely slowdown the time to convergence (especially when creating logs for the complete train and test sets). While logging on a minibatch level might provide additional information, it also severely slows down the training even further. It is possible to alleviate this problem by persisting model checkpoints and creating the performance logs on different machines. However, this also involves a lot of engineering effort and will not be supported by the ConfusionFlow in the near future.

## Installation
Confusionflow can be either downloaded directly from PyPI via `pip install confusionflow` or by cloning and installing the repository directly from source:

### From Source
Make sure you have [node](https://nodejs.org/en/) installed (required for building the UI component).

Clone and install the repository:
```
git clone https://github.com/confusionflow/confusionflow
cd confusionflow
python setup.py install
```

## Getting started
As a first step you must create some logs before you can start analyzing. Have a look at the `examples` folder and run one of the demos.
The examples will create a new subdirectory `logs` where the performance logs will be stored.

You then can start the ConfusionFlow UI via:
```
confusionflow --logdir `<path_to_logdir>`
```

### Usage Example
```
## tensorflow.keras
cd examples/tf.keras/fashion-mnist
python fashion-mnist_demo.py
confusionflow --logdir logs

## pytorch
cd examples/torch/mnist
python mnist_demo.py
confusionflow --logdir logs
```

If you are using your own datasets you must create a `dataset-configuration` first. We provide some example configurations for some popular datasets in `examples/dataset-templates` which should help you getting started.


## Logging
We provide simple wrappers for `Tensorflow + Keras` and `Pytorch` for logging confusion matrices and exporting them in the required ConfusionFlow format.


### Log Directory Layout
```
<logdir>
├── datasets  		            <--- dataset config files
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
