#!/usr/bin/env bash

SRC=$(cd $(dirname "$0"); pwd)
source "${SRC}/../include.sh"

cd $file_path

#
# Re init module system
#
$omnitron kill
rm -rf ~/.omnitron
#
#
#
$omnitron ls
$omnitron install omnitron-sample-module@2.3.5
spec "Should have installed module"

sleep 1
should 'should have started module' 'online' 1
should 'should module be in stable state' 'restart_time: 0' 1
#should 'should module be on the right version' "module_version: '2.3.5'" 1

$omnitron install omnitron-sample-module@2.2.5 --safe
ispec "Should installation of unstable module fail (npm installation has failed)"
should 'should have restored module to previous version and online' 'online' 1
should 'should module be in stable state' 'restart_time: 0' 1
#should 'should module be on the right version' "module_version: '2.3.5'" 1

$omnitron install omnitron-sample-module@2.3.5 --safe
spec "Should installation of unstable module fail (module bad behavior (restart))"
should 'should have restored module to previous version and online' 'online' 1
should 'should module be in stable state' 'restart_time: 0' 1
#should 'should module be on the right version' "module_version: '2.3.5'" 1

#
# Test edge cases
#
$omnitron uninstall all
