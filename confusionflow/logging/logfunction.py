import torch
import torchnet as tnt


def log_epoch(run, model, device, epoch, numclass):
    for fold, foldlog in zip(run.folds, run.foldlogs):
        assert fold.foldId == foldlog.foldId

        data_loader = fold.data
        log_performance(foldlog, model, device, data_loader, epoch, numclass)


def log_performance(foldlog, model, device, data_loader, epoch, numclass):
    model.eval()

    confusion_matrix = tnt.meter.ConfusionMeter(numclass)

    with torch.no_grad():
        for data, target in data_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            pred = output.max(1, keepdim=True)[1]

            confusion_matrix.add(pred.data.squeeze(), target.long())

    foldlog.add_epochdata(
        epochId=epoch, confmat=confusion_matrix.conf.flatten().tolist()
    )
