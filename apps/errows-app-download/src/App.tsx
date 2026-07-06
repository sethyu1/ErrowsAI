import { QRCodeSVG } from 'qrcode.react'
import { Smartphone, Apple, Download } from 'lucide-react'

// 配置下载链接
const DOWNLOAD_CONFIG = {
  android: {
    url: 'https://example.com/app-release.apk', // APK 文件放在 public 目录
    name: 'Android',
    icon: Smartphone,
    color: 'from-green-500 to-green-600',
    buttonColor: 'bg-green-500 hover:bg-green-600',
  },
  ios: {
    url: 'https://apps.apple.com/app/errows/id123456789', // 替换为实际的 App Store 链接
    name: 'iOS',
    icon: Apple,
    color: 'from-gray-700 to-gray-900',
    buttonColor: 'bg-gray-800 hover:bg-gray-900',
  },
}

interface DownloadCardProps {
  platform: 'android' | 'ios'
}

function DownloadCard({ platform }: DownloadCardProps) {
  const config = DOWNLOAD_CONFIG[platform]
  const Icon = config.icon

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6 w-full max-w-sm">
      {/* 平台图标和名称 */}
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">{config.name} 版本</h2>

      {/* 二维码 */}
      <div className="p-4 bg-white border-2 border-gray-100 rounded-xl">
        <QRCodeSVG
          value={config.url}
          size={180}
          level="H"
          includeMargin={false}
        />
      </div>

      <p className="text-gray-500 text-sm text-center">
        扫描二维码下载 {config.name} 版本
      </p>

      {/* 直接下载按钮 */}
      <a
        href={config.url}
        className={`w-full py-3 px-6 ${config.buttonColor} text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors`}
      >
        <Download className="w-5 h-5" />
        直接下载
      </a>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* 头部 */}
      <header className="pt-16 pb-8 text-center">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Errows" className="w-20 h-20 rounded-3xl shadow-lg" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Errows</h1>
        <p className="text-gray-600 text-lg max-w-md mx-auto px-4">
          下载 Errows 应用，开启全新体验
        </p>
      </header>

      {/* 下载卡片 */}
      <main className="px-4 pb-16">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 justify-center items-center md:items-stretch">
          <DownloadCard platform="android" />
          <DownloadCard platform="ios" />
        </div>
      </main>

      {/* 底部 */}
      <footer className="text-center pb-8 text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Errows. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
