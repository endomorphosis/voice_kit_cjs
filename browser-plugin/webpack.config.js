import path from "path";
import { fileURLToPath } from "url";

import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('webpack').Configuration} */
const config = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    background: "./src/background.js",
    popup: "./src/popup.js",
    content: "./src/content.js",
    "asr-worker": "./src/asr-worker.js",
  },
  resolve: {
    alias: {
      "@huggingface/transformers": path.resolve(
        __dirname,
        "node_modules/@huggingface/transformers",
      ),
    },
    fallback: {
      fs: false,
      path: false,
      crypto: false
    }
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js",
    chunkLoading: false,
    assetModuleFilename: '[name][ext]'
  },
  experiments: {
    asyncWebAssembly: true,
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
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "public",
          to: ".",
        },
        {
          from: "src/popup.css",
          to: "popup.css",
        },
        // Copy ONNX WASM files from local node_modules
        {
          from: path.resolve(__dirname, 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm'),
          to: 'ort-wasm-simd-threaded.jsep.wasm'
        },
        {
          from: path.resolve(__dirname, 'node_modules/onnxruntime-web/dist/ort-wasm-simd.wasm'),
          to: 'ort-wasm-simd.wasm'
        },
        {
          from: path.resolve(__dirname, 'node_modules/onnxruntime-web/dist/ort-wasm-threaded.wasm'),
          to: 'ort-wasm-threaded.wasm'
        },
        {
          from: path.resolve(__dirname, 'node_modules/onnxruntime-web/dist/ort-wasm.wasm'),
          to: 'ort-wasm.wasm'
        },
        {
          from: path.resolve(__dirname, 'node_modules/@huggingface/transformers/dist/transformers.bundle.min.js'),
          to: 'transformers.bundle.min.js'
        },
        {
          from: path.resolve(__dirname, 'node_modules/onnxruntime-web/dist/ort.bundle.min.js'),
          to: 'ort.bundle.min.js'
        }
      ],
    }),
  ],
};

export default config;
