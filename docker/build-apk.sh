#!/bin/bash

set -e

echo "Starting APK build process..."
echo "Website URL: $WEBSITE_URL"
echo "App Name: $APP_NAME"
echo "Package Name: $PACKAGE_NAME"

# Create Android project directory
PROJECT_DIR="/tmp/android-project"
mkdir -p $PROJECT_DIR

# Copy Android WebView template
cp -r /app/android-template/* $PROJECT_DIR/

# Replace placeholders in template files
cd $PROJECT_DIR

# Update AndroidManifest.xml
sed -i "s|PACKAGE_NAME|$PACKAGE_NAME|g" app/src/main/AndroidManifest.xml
sed -i "s|APP_NAME|$APP_NAME|g" app/src/main/res/values/strings.xml

# Update MainActivity with website URL
sed -i "s|PACKAGE_NAME|$PACKAGE_NAME|g" app/src/main/java/MainActivity.kt
sed -i "s|WEBSITE_URL|$WEBSITE_URL|g" app/src/main/java/MainActivity.kt

# Update colors if provided
if [ ! -z "$PRIMARY_COLOR" ]; then
    sed -i "s|#6200EE|$PRIMARY_COLOR|g" app/src/main/res/values/colors.xml
fi

# Update build.gradle
sed -i "s|PACKAGE_NAME|$PACKAGE_NAME|g" app/build.gradle

# Build APK
echo "Building APK..."
./gradlew assembleRelease

# Copy APK to output
OUTPUT_DIR="/output"
mkdir -p $OUTPUT_DIR
cp app/build/outputs/apk/release/app-release.apk $OUTPUT_DIR/

echo "APK build completed successfully!"
echo "Output: $OUTPUT_DIR/app-release.apk"
