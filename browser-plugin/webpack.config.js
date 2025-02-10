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

    // Otherwise we get `Uncaught ReferenceError: document is not defined`
    chunkLoading: false,
    webassemblyModuleFilename: "[hash].wasm"
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: "asset/resource"
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
          to: ".", // Copies to build folder
        },
        {
          from: "src/popup.css",
          to: "popup.css",
        },
        {
          from: "node_modules/onnxruntime-web/dist/*.wasm",
          to: "[name][ext]"
        },
        {
          from: "node_modules/@huggingface/transformers/dist/*.wasm",
          to: "[name][ext]"
        }
      ],
    }),
  ],
};

export default config;
