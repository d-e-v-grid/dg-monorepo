
#!/usr/bin/env bash

SRC=$(cd $(dirname "$0"); pwd)
source "${SRC}/../include.sh"

cd $file_path

rm ~/.omnitron/logs/echo-out.log
rm ~/.omnitron/logs/echo-error.log

echo ">>>>>>>>>>>>>>>>>>>> LOG PATH SET TO NULL"

# set error log to null in fork
$omnitron start echo.js -o out.log -e NULL --merge-logs

sleep 1

test -f out.log
spec "err log should exist with null in fork mode"
! test -f ~/.omnitron/logs/echo-error.log
spec "err log shouldnt exist with null in fork mode"

$omnitron delete all
rm out.log

# set error log to null in cluster
$omnitron start echo.js -i 1 -o out.log -e NULL --merge-logs

sleep 1

test -f out.log
spec "err log should exist with null in cluster mode"
! test -f ~/.omnitron/logs/echo-error.log
spec "err log shouldnt exist with null in cluster mode"

$omnitron delete all
rm out.log

# set out log to null in fork
$omnitron start echo.js -o NULL -e err.log --merge-logs

sleep 1

test -f err.log
spec "err log should exist with null in fork mode"
! test -f ~/.omnitron/logs/echo-out.log
spec "output log shouldnt exist with null in fork mode"

$omnitron delete all
rm err.log

# set out log to null in cluster
$omnitron start echo.js -i 1 -o NULL -e err.log --merge-logs

sleep 1

test -f err.log
spec "err log should exist with null in cluster mode"
! test -f ~/.omnitron/logs/echo-out.log
spec "output log shouldnt exis with null in cluster mode"

$omnitron delete all
rm err.log

# set error AND out log to null in cluster
$omnitron start echo.js -i 1 -o NULL -e NULL --merge-logs

sleep 1

! test -f ~/.omnitron/logs/echo-out.log
spec "out log shouldnt exist with null in cluster mode"
! test -f ~/.omnitron/logs/echo-error.log
spec "error log shouldnt exist with null in cluster mode"

$omnitron delete all

# set error AND out log to null in fork
$omnitron start echo.js -o NULL -e NULL --merge-logs

sleep 1

! test -f ~/.omnitron/logs/echo-out.log
spec "out log shouldnt exist with null in fork mode"
! test -f ~/.omnitron/logs/echo-error.log
spec "error log shouldnt exist with null in fork mode"

$omnitron delete all

rm ~/.omnitron/logs/echo-out.log
rm ~/.omnitron/logs/echo-error.log

echo ">>>>>>>>>>>>>>>>>>>> LOG PATH SET TO /dev/null"

# set error log to null in fork
$omnitron start echo.js -o out.log -e /dev/null --merge-logs

sleep 1

test -f out.log
spec "err log should exist with /dev/null in fork mode"
! test -f ~/.omnitron/logs/echo-error.log
spec "err log shouldnt exist with /dev/null in fork mode"

$omnitron delete all
rm out.log

# set error log to null in cluster
$omnitron start echo.js -i 1 -o out.log -e /dev/null --merge-logs

sleep 1

test -f out.log
spec "err log should exist with /dev/null in cluster mode"
! test -f ~/.omnitron/logs/echo-error.log
spec "err log shouldnt exist with /dev/null in cluster mode"

$omnitron delete all
rm out.log

# set out log to null in fork
$omnitron start echo.js -o /dev/null -e err.log --merge-logs

sleep 1

test -f err.log
spec "err log should exist with /dev/null in fork mode"
! test -f ~/.omnitron/logs/echo-out.log
spec "output log shouldnt exist with /dev/null in fork mode"

$omnitron delete all
rm err.log

# set out log to null in cluster
$omnitron start echo.js -i 1 -o /dev/null -e err.log --merge-logs

sleep 1

test -f err.log
spec "err log should exist with /dev/null in cluster mode"
! test -f ~/.omnitron/logs/echo-out.log
spec "output log shouldnt exis with /dev/null in cluster mode"

$omnitron delete all
rm err.log

# set error AND out log to null in cluster
$omnitron start echo.js -i 1 -o /dev/null -e /dev/null --merge-logs

sleep 1

! test -f ~/.omnitron/logs/echo-out.log
spec "out log shouldnt exist with /dev/null in cluster mode"
! test -f ~/.omnitron/logs/echo-error.log
spec "error log shouldnt exist with /dev/null in cluster mode"

$omnitron delete all

# set error AND out log to null in fork
$omnitron start echo.js -o /dev/null -e /dev/null --merge-logs

sleep 1

! test -f ~/.omnitron/logs/echo-out.log
spec "out log shouldnt exist with /dev/null in fork mode"
! test -f ~/.omnitron/logs/echo-error.log
spec "error log shouldnt exist with /dev/null in fork mode"

$omnitron delete all
