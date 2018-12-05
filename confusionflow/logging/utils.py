from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import json
import os

import yaml


def create_logdir(logdir):
    logdir = os.path.realpath(logdir)
    if not os.path.exists(logdir):
        os.mkdir(logdir)
        for subfolder in ["/datasets", "/foldlogdata", "/foldlogs", "/runs", "/views"]:
            os.mkdir(logdir + subfolder)


def create_dataset_config(logdir, template_file_path):
    if not os.path.exists(os.path.realpath(template_file_path)):
        raise OSError(
            "Error! File `{}` not found!".format(os.path.realpath(template_file_path))
        )

    with open(template_file_path) as f:
        content = f.read()
        data = yaml.load(content)

    export_dict = dict()
    export_dict["datasetId"] = data["dataset"]
    export_dict["description"] = data["description"]
    export_dict["numclass"] = len(data["classes"])
    export_dict["numfolds"] = len(data["folds"])
    export_dict["classes"] = list(map(str, data["classes"]))
    export_dict["folds"] = []

    for foldentry in data["folds"]:
        foldname, folddata = list(foldentry.items())[0]
        export_fold = dict()
        export_fold["foldId"] = "{}_{}".format(export_dict["datasetId"], foldname)
        export_fold["description"] = folddata["description"]
        export_fold["dataset"] = export_dict["datasetId"]
        export_fold["numinstances"] = 0
        export_fold["classcounts"] = []

        for classfrequency in folddata["classfrequencies"]:
            classname, instancecount = list(classfrequency.items())[0]
            export_classcount = dict()
            export_classcount["classname"] = str(classname)
            export_classcount["instancecount"] = instancecount
            export_fold["numinstances"] += instancecount
            export_fold["classcounts"].append(export_classcount)

        export_dict["folds"].append(export_fold)

    datasetfolder = logdir + "/datasets/"
    filename = data["dataset"] + ".json"
    with open(datasetfolder + filename, "w") as outfile:
        outfile.write(json.dumps(export_dict))

    update_datasetindex(logdir)


def check_folderpath(folderpath):
    folderpath = os.path.realpath(folderpath)
    if os.path.isdir(folderpath):
        return folderpath
    else:
        raise OSError("Error! Please specify a valid folder {}".format(folderpath))


def update_runindex(logdir):
    runfolder = logdir + "/runs/"
    runfiles = os.listdir(runfolder)

    update_index(runfolder, runfiles)


def update_datasetindex(logdir):
    datasetfolder = logdir + "/datasets/"
    datasetfiles = os.listdir(datasetfolder)

    update_index(datasetfolder, datasetfiles)


def update_index(folder, files):
    index = []
    for file in files:
        if file != "index.json":
            with open(folder + file, "r") as f:
                index.append(json.loads(f.read()))

    with open(folder + "index.json", "w") as f:
        f.write(json.dumps(index))
