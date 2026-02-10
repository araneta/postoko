#nvm    v22.14.0
#Gradle: 8.10.2

export ANDROID_SDK_ROOT=/media/araneta/49909430-d2bd-4bcf-be1d-3c425a4013bf/apps/Android/Sdk 
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/tools 
cd android 
./gradlew assembleRelease --no-daemon --max-workers=2
