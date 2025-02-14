import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('webpack').Configuration} */
const config = {
  mode: "development",
  devtool: false,
  target: 'web',
  entry: {
    popup: "./src/popup.js",
    'asr-worker': "./src/asr-worker.js",
    background: "./src/background.js",
    content: "./src/content.js"
  },
  experiments: {
    outputModule: true
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
    clean: true,
    publicPath: '',
    module: true,
    environment: {
      module: true,
      dynamicImport: true
    }
  },
  module: {
    parser: {
      javascript: {
        importMeta: false
      }
    },
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
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/popup.html",
      filename: "popup.html",
      chunks: ['popup'],
      inject: 'head',
      scriptLoading: 'module',
      minify: false
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "public",
          to: ".",
          transform(content, path) {
            if (path.endsWith('manifest.json')) {
              const manifest = JSON.parse(content);
              manifest.content_security_policy = {
                extension_pages: "script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; child-src 'self'"
              };
              return JSON.stringify(manifest, null, 2);
            }
            return content;
          }
        },
        {
          from: "src/popup.css",
          to: "popup.css",
        },
        {
          from: "node_modules/onnxruntime-web/dist/*.wasm",
          to: "wasm/[name][ext]",
          noErrorOnMissing: true
        },
        {
          from: "node_modules/@huggingface/transformers/dist/*.wasm",
          to: "wasm/[name][ext]",
          noErrorOnMissing: true
        }
      ],
    })
  ],
  optimization: {
    minimize: false,
    splitChunks: false,
    runtimeChunk: false
  }
};

export default config;
