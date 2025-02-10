import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Base configuration shared between all targets
const baseConfig = {
  mode: "development",
  devtool: "inline-source-map",
  resolve: {
    alias: {
      "@huggingface/transformers": path.resolve(
        __dirname,
        "node_modules/@huggingface/transformers",
      ),
    },
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false,
      "worker_threads": false,
      "perf_hooks": false
    }
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]'
        }
      }
    ]
  }
};

// Common output path and plugins for all configurations
const outputPath = path.resolve(__dirname, "build");
const commonPlugins = [
  new CopyPlugin({
    patterns: [
      {
        from: "public",
        to: ".",
        globOptions: {
          ignore: ["**/README.md"]
        }
      },
      {
        from: "src/popup.css",
        to: "popup.css",
      },
      {
        from: "src/popup.html",
        to: "popup.html",
      },
      {
        from: "src/content.js",
        to: "content.js",
      },
      {
        from: "node_modules/@huggingface/transformers/node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
        to: "ort-wasm-simd-threaded.wasm"
      },
      {
        from: "node_modules/@huggingface/transformers/node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm",
        to: "ort-wasm-simd-threaded.jsep.wasm"
      },
      {
        from: "node_modules/@huggingface/transformers/node_modules/onnxruntime-web/dist/ort.bundle.min.mjs",
        to: "ort.bundle.min.mjs"
      }
    ],
  })
];

// Configuration for service worker (background script)
const serviceWorkerConfig = {
  ...baseConfig,
  name: 'service-worker',
  target: 'webworker',
  entry: {
    background: "./src/background.js"
  },
  experiments: {
    outputModule: true
  },
  output: {
    path: outputPath,
    filename: "[name].js",
    clean: false,
    publicPath: '/',
    globalObject: 'self',
    library: {
      type: 'module'
    },
    chunkFormat: 'module'
  },
  plugins: [...commonPlugins]
};

// Configuration for web worker (ASR worker)
const webWorkerConfig = {
  ...baseConfig,
  name: 'web-worker',
  target: 'webworker',
  entry: {
    "asr-worker": "./src/asr-worker.js"
  },
  experiments: {
    outputModule: true
  },
  output: {
    path: outputPath,
    filename: "[name].js",
    clean: false,
    publicPath: '/',
    globalObject: 'self',
    library: {
      type: 'module'
    },
    chunkFormat: 'module'
  },
  plugins: [...commonPlugins]
};

// Configuration for content script
const contentConfig = {
  ...baseConfig,
  name: 'content',
  target: 'web',
  entry: {
    content: "./src/content.js"
  },
  output: {
    path: outputPath,
    filename: "[name].js",
    clean: false,
    iife: true
  },
  optimization: {
    minimize: false
  },
  plugins: [...commonPlugins]
};

// Configuration for popup script
const popupConfig = {
  ...baseConfig,
  name: 'popup',
  target: 'web',
  entry: {
    popup: "./src/popup.js"
  },
  output: {
    path: outputPath,
    filename: "[name].js",
    clean: false,
    publicPath: '/'
  },
  plugins: [
    ...commonPlugins,
    new HtmlWebpackPlugin({
      template: "./src/popup.html",
      filename: "popup.html",
      chunks: ['popup']
    })
  ]
};

export default [serviceWorkerConfig, webWorkerConfig, contentConfig, popupConfig];