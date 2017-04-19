#!/usr/bin/env bash

cd packages/easysearch:core && spacejam test-packages ./ && cd ../../
cd packages/easysearch:components && spacejam test-packages ./ && cd ../../
cd packages/easysearch:elasticsearch && spacejam test-packages ./ && cd ../../
