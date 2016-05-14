#!/bin/bash
/usr/bin/nodejs $SNOW_IRC_BOT_PATH/snow.js &
echo $! > $SNOW_IRC_BOT_PATH/scripts/process.pid

