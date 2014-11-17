#!/bin/bash
cordova run android --device
adb logcat *:V | grep -i CordovaLog
