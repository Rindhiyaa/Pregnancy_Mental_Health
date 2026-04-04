#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Building Backend..."
cd Pregnancy_Mental_Health/backend
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir

echo "Build Complete!"
