import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import * as url from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper function to get package dist path
async function getPackageDistPath(packageName) {
  const packagePath = await import.meta.resolve(packageName);
  return path.dirname(fileURLToPath(packagePath));
}

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
    assetModuleFilename: '[name][ext]',
    publicPath: '/'
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
      chunks: ['popup']
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
        }
      ],
    }),
  ],
};

export default config;
