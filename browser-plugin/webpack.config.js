import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('webpack').Configuration} */
const config = {
  mode: "development",
  devtool: 'source-map',
  entry: {
    popup: "./src/popup.js",
    'asr-worker': { 
      import: "./src/asr-worker.js",
      filename: "asr-worker.js",
      library: {
        type: "module"
      }
    },
    background: "./src/background.js",
    content: "./src/content.js"
  },
  target: ['web', 'es2020'],
  experiments: {
    asyncWebAssembly: true,
    outputModule: true,
    topLevelAwait: true
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
    clean: true,
    publicPath: '',
    filename: '[name].js',
    environment: {
      dynamicImport: true,
      module: true
    },
    webassemblyModuleFilename: "wasm/[hash].wasm",
    wasmLoading: 'fetch',
    chunkFormat: 'module'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  chrome: "113"
                },
                modules: false
              }]
            ],
            plugins: [
              "@babel/plugin-syntax-top-level-await"
            ]
          }
        }
      },
      {
        test: /\.wasm$/,
        type: "asset/resource",
        generator: {
          filename: "wasm/[hash][ext]"
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
        { from: "public" },
        { from: "src/popup.css", to: "popup.css" },
        { 
          from: "node_modules/@huggingface/transformers/node_modules/onnxruntime-web/dist/*.wasm",
          to: "wasm/[name][ext]"
        },
        { from: './src/manifest.json', to: 'manifest.json' },
        { from: './public/icons', to: 'icons' },
        { from: './public/mic-icon.svg', to: 'mic-icon.svg' },
        { 
          from: '../node_modules/@xenova/transformers/dist/wasm',
          to: 'wasm',
          noErrorOnMissing: true
        }
      ]
    })
  ],
  optimization: {
    minimize: false,
    splitChunks: false
  }
};

export default config;
