
#!/usr/bin/env bash

SRC=$(cd $(dirname "$0"); pwd)
source "${SRC}/../include.sh"

cd $file_path

CURRENT_YEAR=`date +"%Y"`

# CLUSTERMODE YYYY
$omnitron start echo.js --log-date-format "YYYY" -o out-rel.log --merge-logs

>out-rel.log

sleep 2

grep $CURRENT_YEAR out-rel.log
spec "Should have written year in log file according to format YYYY"

rm out-rel.log

$omnitron delete all

# CLUSTERMODE Wrong format
$omnitron start echo.js --log-date-format "YYYY asdsd asd asd sad asd " -o out-rel.log --merge-logs

sleep 1
should 'should has not restarted' 'restart_time: 0' 1
spec "Should have not fail with random format"

rm out-rel.log

$omnitron delete all


# CLUSTERMODE YYYY
$omnitron start echo.js --log-date-format "YYYY" -o out-rel.log --merge-logs -x

>out-rel.log

sleep 2

grep $CURRENT_YEAR out-rel.log
spec "Should have written year in log file according to format YYYY"

rm out-rel.log

$omnitron delete all
