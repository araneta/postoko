#!/bin/bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node.js v22.14.0
nvm use 22.14.0

# Add node to PATH
export PATH="$NVM_DIR/versions/node/v22.14.0/bin:$PATH"

# Run the build

export JAVA_HOME=/media/araneta/49909430-d2bd-4bcf-be1d-3c425a4013bf/apps/jdk-17.0.11
export PATH=$PATH:$HOME/bin:$JAVA_HOME/bin

#Android SDK Platform 35
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
cd android && ./gradlew assembleRelease --stacktrace 