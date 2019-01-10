#!/usr/bin/env bash

if [ -d "packages/easy:search" ]; then
    cd packages/easysearch:core
    meteor publish
    cd ../easysearch:components
    meteor publish
    cd ../easy:search
    meteor publish
    cd ../easysearch:autosuggest
    meteor publish
    cd ../easysearch:elasticsearch
    meteor publish
    cd ..
else
    echo "Execute in root folder"
fi
