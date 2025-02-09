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
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/popup.html",
      filename: "popup.html",
      chunks: ['popup']
    }),
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
    }),
  ]
};

// Common output path for all configurations
const outputPath = path.resolve(__dirname, "build");

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
    clean: true, // Only clean on first build
    publicPath: '/',
    globalObject: 'self',
    library: {
      type: 'module'
    },
    chunkFormat: 'module'
  }
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
  }
};

// Configuration for web-facing scripts and static assets
const webConfig = {
  ...baseConfig,
  name: 'web',
  target: 'web',
  entry: {
    popup: "./src/popup.js",
    content: "./src/content.js",
  },
  output: {
    path: outputPath,
    filename: "[name].js",
    clean: false,
    publicPath: '/',
    chunkFormat: 'array-push'
  }
};

export default [serviceWorkerConfig, webWorkerConfig, webConfig];