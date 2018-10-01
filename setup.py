import setuptools.command.build_py
import subprocess
import os

from setuptools import Command
from setuptools import find_packages, setup


class build_ui(setuptools.Command):
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        subprocess.call(["npm", "install"], cwd="./confusionflow/ui")
        subprocess.call(["npm", "run", "build"], cwd="./confusionflow/ui")
        subprocess.call(
            ["cp", "-r", "./confusionflow/ui/build", "./confusionflow/static"])


class build_py(setuptools.command.build_py.build_py):
    def run(self):
        if not os.path.exists("./confusionflow/static"):
            self.run_command('build_ui')
        setuptools.command.build_py.build_py.run(self)


here = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(here, 'confusionflow/VERSION')) as version_file:
    version = version_file.read().strip()


readme = open('README.md').read()


requirements = [
    "flask",
    "gevent",
    "pyyaml"
]

cmdclass = {
    'build_py': build_py,
    'build_ui': build_ui,
}

entry_points = {
    "console_scripts": [
        "confusionflow=confusionflow:main"
    ]
}

setup(
    # Metadata
    name="confusionflow",
    version=version,
    author="ConfusionFlow Contributors",
    author_email="gfrogat@gmail.com",
    url="https://github.com/confusionflow/confusionflow",
    license="BSD-3-Clause",
    description="ConfusionFlow is a visualization tool that enables more nuanced monitoring of a neural network's training process.",
    long_description=readme,
    long_description_content_type='text/markdown',
    project_urls={
        'Documentation': 'https://docs.confusionflow.org',
        'Source': 'https://github.com/confusionflow/confusionflow/',
        'Tracker': 'https://github.com/confusionflow/confusionflow/issues',
    },

    # Package info
    cmdclass=cmdclass,
    packages=find_packages(),
    package_data={"confusionflow": ["static/*.*"]},
    include_package_data=True,
    zip_safe=False,
    install_requires=requirements,
    entry_points=entry_points,
)
