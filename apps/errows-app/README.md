# Errows App

原生移动应用项目，使用 Capacitor 将 `errows-web` 的 Web 应用打包为 Android 和 iOS 原生应用。

## 项目结构

```
errows-app/
├── android/          # Android 原生项目
├── ios/              # iOS 原生项目（待添加）
├── capacitor.config.ts
├── package.json
└── README.md
```

## 前置要求

### 通用

- Node.js 18+
- pnpm 8+

### Android 开发

- [Android Studio](https://developer.android.com/studio) (推荐 Hedgehog 或更高版本)
- Android SDK (API 24+)
- JDK 17+

### iOS 开发 (仅 macOS)

- macOS 系统
- [Xcode](https://developer.apple.com/xcode/) 15+
- CocoaPods (`sudo gem install cocoapods`)

## 快速开始

### 1. 安装依赖

```bash
# 在项目根目录
pnpm install
```

### 2. 构建并同步

```bash
# 在 errows-app 目录
cd apps/errows-app

# 构建 web 项目并同步到原生项目
pnpm app:build
```

### 3. 打开 IDE

```bash
# 打开 Android Studio
pnpm app:android

# 打开 Xcode (仅 macOS)
pnpm app:ios
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm app:build` | 构建 web 并同步到原生项目 |
| `pnpm app:android` | 构建并打开 Android Studio |
| `pnpm app:ios` | 构建并打开 Xcode |
| `pnpm cap:sync` | 仅同步 web 资源（不重新构建） |
| `pnpm cap:open:android` | 仅打开 Android Studio |
| `pnpm cap:open:ios` | 仅打开 Xcode |
| `pnpm build:apk` | 构建 Debug APK |
| `pnpm build:apk:release` | 构建 Release APK |

## Android 开发

### 首次设置

1. 运行 `pnpm app:android` 打开 Android Studio
2. 等待 Gradle 同步完成
3. 连接 Android 设备或启动模拟器
4. 点击 Run 按钮运行应用

### 调试

- 使用 Chrome DevTools 调试 WebView：`chrome://inspect`
- Android Studio Logcat 查看原生日志

### 打包 APK

#### 方式一：命令行

```bash
# Debug APK（无需签名）
pnpm build:apk
# 输出: android/app/build/outputs/apk/debug/app-debug.apk

# Release APK（需要配置签名）
pnpm build:apk:release
# 输出: android/app/build/outputs/apk/release/app-release.apk
```

#### 方式二：Android Studio

1. 菜单：`Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. 或：`Build` → `Generate Signed Bundle / APK` (带签名)

### 配置签名密钥

#### 1. 生成签名密钥

```bash
keytool -genkey -v -keystore errows.keystore -alias errows -keyalg RSA -keysize 2048 -validity 10000
```

按提示输入密码和证书信息，生成的 `errows.keystore` 文件请妥善保管。

#### 2. 配置签名信息

在 `android/` 目录创建 `keystore.properties` 文件（不要提交到 git）：

```properties
storeFile=../errows.keystore
storePassword=你的密码
keyAlias=errows
keyPassword=你的密码
```

#### 3. 修改 build.gradle

编辑 `android/app/build.gradle`，在 `android {}` 块中添加：

```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... 其他配置

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 4. 添加到 .gitignore

确保签名文件不被提交：

```
*.keystore
keystore.properties
```

## iOS 开发

### 首次设置

1. 添加 iOS 平台（如果还没有）：
   ```bash
   npx cap add ios
   ```

2. 运行 `pnpm app:ios` 打开 Xcode

3. 在 Xcode 中配置签名：
   - 选择 `App` target
   - 在 `Signing & Capabilities` 中设置 Team

4. 选择模拟器或连接真机，点击 Run

### 调试

- 使用 Safari 开发者工具调试 WebView
- Xcode Console 查看原生日志

### 发布到 App Store

1. 在 Xcode 中：`Product` → `Archive`
2. 在 Organizer 中选择 `Distribute App`
3. 按照向导完成上传

## 开发流程

```
修改 errows-web 代码
        ↓
pnpm app:build (在 errows-app 目录)
        ↓
在 Android Studio / Xcode 中运行测试
```

## 常见问题

### Gradle 同步失败

如果遇到网络问题，可以修改 `android/gradle/wrapper/gradle-wrapper.properties` 使用国内镜像：

```properties
distributionUrl=https\://mirrors.aliyun.com/macports/distfiles/gradle/gradle-8.11.1-all.zip
```

### iOS Pod 安装失败

```bash
cd ios/App
pod install --repo-update
```

### Web 资源未更新

确保先构建 web 项目：

```bash
pnpm --filter errows-web build
pnpm cap:sync
```
