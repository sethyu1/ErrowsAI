import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

const envPrefix = ["VITE_"];

// https://vite.dev/config/

export default defineConfig(({ mode }) => {
  const { VITE_API_HOST } = loadEnv(mode, __dirname, envPrefix);

  return {
    plugins: [
      svgr(),
      react(),
      tsconfigPaths(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["logo.png", "**/*.{png,jpg,jpeg,svg,ico}"],
        manifest: {
          name: "Errows",
          short_name: "Errows",
          description: "Errows - AI Character Platform",
          theme_color: "#D9D9D9",
          background_color: "#0E0F17",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: "/",
          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icon-192-mask.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/icon-512-mask.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          categories: ["entertainment", "social"],
          lang: "en-US",
          dir: "ltr",
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
          // 可选：排除特定大文件
          // globIgnores: ["**/girl4*.png"],
          runtimeCaching: [
            // JS 文件缓存策略
            {
              urlPattern: /\.js$/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "js-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 24 * 30, // 1 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // CSS 文件缓存策略
            {
              urlPattern: /\.css$/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "css-cache",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 24 * 30, // 1 days
                },
                cacheableResponse: {  
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/at\.alicdn\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "alicdn-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/api\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
              handler: "CacheFirst",
              options: {
                cacheName: "images-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
    ],
    server: {
      port: 8888,
      host: true,
      proxy: {
        "/api": {
          target: VITE_API_HOST,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@errows/icons": path.resolve(
          __dirname,
          "../../forntend-libs/errows-icons/src"
        ),
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom"
        // "@errows/icons"
      ],
    },
  };
});
