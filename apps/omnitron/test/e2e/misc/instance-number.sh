#!/usr/bin/env bash

SRC=$(cd $(dirname "$0"); pwd)
source "${SRC}/../include.sh"
cd $file_path

$omnitron start server.js -i -100
should 'should have started 1 processes' 'online' 1

$omnitron delete all
