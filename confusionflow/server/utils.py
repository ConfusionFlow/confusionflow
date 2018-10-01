from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os

from flask import send_from_directory


def serve_file(foldername, filename, errormsg):
    if not os.path.isfile(os.path.join(foldername, filename)):
        return errormsg
    else:
        return send_from_directory(foldername, filename)
