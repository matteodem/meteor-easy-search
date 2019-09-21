#!/usr/bin/env bash

if [ -d "packages/easy_search" ]; then
    cd packages/easysearch_core
    meteor publish
    cd ../easysearch_components
    meteor publish
    cd ../easy:search
    meteor publish
    cd ../easysearch_autosuggest
    meteor publish
    cd ../easysearch_elasticsearch
    meteor publish
    cd ..
else
    echo "Execute in root folder"
fi
