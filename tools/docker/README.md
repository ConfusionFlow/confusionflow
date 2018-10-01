## Docker

### Building Container
Make sure that the UI component is already built before building the Docker containers (the containers size will blow up otherwise to the `node_modules`).
```
# UI component
python setup.py build_ui

# Development
docker build . -f tools/docker/dev.Dockerfile -t confusionflow-dev

# Production
docker build . -f tools/docker/Dockerfile -t confusionflow
```


### Usage

```
docker run --rm -p 8080:80 -v <path_to_logdir>:/logs -ti confusionflow/confusionflow:latest
```
