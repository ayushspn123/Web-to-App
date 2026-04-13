import fs from "fs-extra"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function buildApk(project: any, buildType: "debug" | "release" | "bundle" = "debug") {
    const { id, website_url, app_name, package_name, primary_color } = project
    const templateDir = path.join(process.cwd(), "android-template")
    const buildDir = path.join(process.cwd(), "builds", id)
    const outputDir = path.join(process.cwd(), "public", "builds", id)
    const keystorePath = path.join(process.cwd(), "keystore", "release.jks")
    const keystoreDir = path.dirname(keystorePath)

    console.log(`[Builder] Starting build for project ${id}`)
    console.log(`[Builder] URL: ${website_url}, App Name: ${app_name}, Package: ${package_name}`)

    try {
        // 1. Prepare directories
        await fs.remove(buildDir)
        await fs.ensureDir(buildDir)
        await fs.ensureDir(outputDir)
        await fs.ensureDir(keystoreDir)
        await fs.copy(templateDir, buildDir)

        // Generate Keystore if it doesn't exist for release builds
        if (!await fs.pathExists(keystorePath)) {
            console.log("[Builder] Generating release keystore...")
            const keytoolCmd = `keytool -genkey -v -keystore "${keystorePath}" -alias release-key -keyalg RSA -keysize 2048 -validity 10000 -storepass password123 -keypass password123 -dname "CN=WebToApp, OU=Development, O=WebToApp, L=City, S=State, C=US"`
            try {
                await execAsync(keytoolCmd)
            } catch (err) {
                console.warn("Failed to generate keystore via keytool, make sure Java is in PATH", err)
            }
        }

        // 2. Perform substitutions

        // AndroidManifest.xml
        const manifestPath = path.join(buildDir, "app/src/main/AndroidManifest.xml")
        let manifest = await fs.readFile(manifestPath, "utf-8")
        manifest = manifest.replace(/PACKAGE_NAME/g, package_name)
        await fs.writeFile(manifestPath, manifest)

        // MainActivity.kt
        const packageDir = package_name.replace(/\./g, "/")
        const oldMainActivityPath = path.join(buildDir, "app/src/main/java/MainActivity.kt")
        const newMainActivityPath = path.join(buildDir, "app/src/main/java", packageDir, "MainActivity.kt")

        let mainActivity = await fs.readFile(oldMainActivityPath, "utf-8")
        mainActivity = mainActivity.replace(/PACKAGE_NAME/g, package_name)
        mainActivity = mainActivity.replace(/WEBSITE_URL/g, website_url)

        await fs.ensureDir(path.dirname(newMainActivityPath))
        await fs.writeFile(newMainActivityPath, mainActivity)
        await fs.remove(oldMainActivityPath)

        // strings.xml
        const stringsPath = path.join(buildDir, "app/src/main/res/values/strings.xml")
        let strings = await fs.readFile(stringsPath, "utf-8")
        strings = strings.replace(/APP_NAME/g, app_name)
        await fs.writeFile(stringsPath, strings)

        // colors.xml
        const colorsPath = path.join(buildDir, "app/src/main/res/values/colors.xml")
        if (await fs.pathExists(colorsPath)) {
            let colors = await fs.readFile(colorsPath, "utf-8")
            colors = colors.replace(/#6200EE/g, primary_color || "#64D2FF")
            await fs.writeFile(colorsPath, colors)
        }

        // app/build.gradle
        const appGradlePath = path.join(buildDir, "app/build.gradle")
        let appGradle = await fs.readFile(appGradlePath, "utf-8")
        appGradle = appGradle.replace(/PACKAGE_NAME/g, package_name)
        await fs.writeFile(appGradlePath, appGradle)

        // settings.gradle
        const settingsPath = path.join(buildDir, "settings.gradle")
        if (await fs.pathExists(settingsPath)) {
            let settings = await fs.readFile(settingsPath, "utf-8")
            settings = settings.replace(/WebToApp/g, app_name.replace(/\s+/g, ""))
            await fs.writeFile(settingsPath, settings)
        }

        // 3. Build APK using Gradle
        console.log(`[Builder] Running Gradle build for ${id}...`)

        // Set Android Home for the build process
        const env = {
            ...process.env,
            ANDROID_HOME: "C:/Users/HP-5CD4371SQ6/AppData/Local/Android/Sdk",
            JAVA_HOME: process.env.JAVA_HOME || undefined // Use existing Java Home if set
        }

        try {
            // Use gradlew.bat on Windows
            const gradlewPath = path.join(buildDir, "gradlew.bat")

            let task = ":app:assembleDebug"
            let outputFileName = "app-debug.apk"
            let sourcePath = "app/build/outputs/apk/debug/app-debug.apk"

            if (buildType === "release") {
                task = ":app:assembleRelease"
                outputFileName = "app-release.apk"
                sourcePath = "app/build/outputs/apk/release/app-release.apk"
            } else if (buildType === "bundle") {
                task = ":app:bundleRelease"
                outputFileName = "app-release.aab"
                sourcePath = "app/build/outputs/bundle/release/app-release.aab"
            }

            let signingProps = ""
            if (buildType !== "debug" && await fs.pathExists(keystorePath)) {
                signingProps = `-Pconnectivity_timeout=10000 -PRELEASE_STORE_FILE="${keystorePath}" -PRELEASE_STORE_PASSWORD=password123 -PRELEASE_KEY_ALIAS=release-key -PRELEASE_KEY_PASSWORD=password123`
            }

            const gradlewCmd = `"${gradlewPath}" ${task} ${signingProps}`
            console.log(`[Builder] Executing: ${gradlewCmd}`)

            const { stdout, stderr } = await execAsync(gradlewCmd, {
                cwd: buildDir,
                env
            })

            console.log(`[Builder] Gradle stdout: ${stdout.substring(0, 500)}...`)

            const fullSourcePath = path.join(buildDir, sourcePath)
            const fullOutputPath = path.join(outputDir, outputFileName)

            if (await fs.pathExists(fullSourcePath)) {
                await fs.copy(fullSourcePath, fullOutputPath)
                console.log(`[Builder] Build completed for ${id}. Output at ${fullOutputPath}`)

                return {
                    success: true,
                    apkUrl: `/builds/${id}/${outputFileName}`,
                    fileName: outputFileName,
                    apkSize: (await fs.stat(fullOutputPath)).size,
                    logs: `Build completed successfully.\n\nSTDOUT:\n${stdout.slice(-1000)}\n\nSTDERR:\n${stderr}`
                }
            } else {
                throw new Error(`Build finished but output file not found at ${fullSourcePath}`)
            }
        } catch (gradleError: any) {
            console.error(`[Builder] Gradle build failed for ${id}:`, gradleError)
            return {
                success: false,
                error: "Gradle build failed. See logs for details.",
                logs: `Gradle build failed:\n${gradleError.message}\n\nSTDOUT:\n${gradleError.stdout}\n\nSTDERR:\n${gradleError.stderr}`
            }
        }

    } catch (error: any) {
        console.error(`[Builder] Build failed for ${id}:`, error)
        return {
            success: false,
            error: error.message,
            logs: `Build failed: ${error.message}`
        }
    }
}
