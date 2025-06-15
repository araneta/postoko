# Building APK for React Native POS

## Prerequisites

1. **Android Studio** installed with Android SDK
2. **Java Development Kit (JDK)** 11 or higher
3. **Android SDK** with required build tools
4. **React Native CLI** installed globally

## Environment Setup

### 1. Install Android Studio
- Download from https://developer.android.com/studio
- Install Android SDK (API level 33 or higher)
- Set up Android Virtual Device (AVD) for testing

### 2. Set Environment Variables
Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 3. Install Dependencies
```bash
npm install
```

## Building APK

### Option 1: Debug APK (Quick Testing)
```bash
# Navigate to android directory
cd android

# Build debug APK
./gradlew assembleDebug

# APK will be generated at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 2: Release APK (Production)

#### Step 1: Generate Signing Key
```bash
# Generate a private signing key
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Move keystore to android/app directory
mv my-upload-key.keystore android/app/
```

#### Step 2: Setup Gradle Variables
Create `android/gradle.properties` (if not exists) and add:

```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
```

#### Step 3: Build Release APK
```bash
cd android
./gradlew assembleRelease

# APK will be generated at:
# android/app/build/outputs/apk/release/app-release.apk
```

### Option 3: Using React Native CLI
```bash
# Build debug APK
npx react-native build-android --mode=debug

# Build release APK
npx react-native build-android --mode=release
```

### Option 4: Using npm scripts
Add these scripts to package.json:

```json
{
  "scripts": {
    "build:android:debug": "cd android && ./gradlew assembleDebug",
    "build:android:release": "cd android && ./gradlew assembleRelease",
    "build:android:clean": "cd android && ./gradlew clean"
  }
}
```

Then run:
```bash
npm run build:android:debug
# or
npm run build:android:release
```

## APK Optimization

### 1. Enable Proguard (Minification)
In `android/app/build.gradle`:
```gradle
def enableProguardInReleaseBuilds = true
```

### 2. Enable Separate APKs per Architecture
```gradle
def enableSeparateBuildPerCPUArchitecture = true
```

### 3. Bundle Size Analysis
```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android-bundle.js --assets-dest android-assets
```

## Testing APK

### Install on Device/Emulator
```bash
# Install debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Install release APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Uninstall Previous Version
```bash
adb uninstall com.reactnativepos
```

## Troubleshooting

### Common Issues:

1. **Build Tools Version**
   - Ensure you have the correct Android SDK Build Tools version
   - Update in `android/build.gradle`

2. **Memory Issues**
   - Increase heap size in `android/gradle.properties`:
   ```properties
   org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
   ```

3. **Clean Build**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native start --reset-cache
   ```

4. **Permission Issues**
   ```bash
   chmod +x android/gradlew
   ```

## APK Size Optimization

1. **Enable Hermes** (already enabled in gradle.properties)
2. **Use Proguard** for release builds
3. **Remove unused resources**
4. **Optimize images** and assets
5. **Use APK Analyzer** in Android Studio

## Distribution

### Google Play Store
1. Generate signed AAB (Android App Bundle):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. Upload the AAB file to Google Play Console

### Direct Distribution
- Share the APK file directly
- Host on your website
- Use Firebase App Distribution

## Security Notes

- Never commit keystore files to version control
- Store keystore passwords securely
- Use different keys for debug and release
- Keep backup of your release keystore
