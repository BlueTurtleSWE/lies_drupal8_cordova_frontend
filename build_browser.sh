#!/bin/bash
cordova build browser
cd temp
unzip -o ../platforms/browser/build/package.zip
cp ../www/img/* img/
