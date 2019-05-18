#!/bin/bash

docker build -t turndown-service . && docker run -p 9999:9999 --rm -d turndown-service
