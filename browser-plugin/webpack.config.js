import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('webpack').Configuration} */
const config = {
  mode: "development",
  devtool: "source-map", // Changed from inline-source-map for better security
  target: 'web',
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
    },
    extensions: ['.js', '.mjs', '.cjs'],
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js",
    clean: true,
    publicPath: '/',
    assetModuleFilename: 'assets/[hash][ext][query]',
    webassemblyModuleFilename: 'wasm/[hash].wasm'
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        },
        type: 'javascript/auto',
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
            compact: true,
            minified: true
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.wasm$/,
        type: "asset/resource",
        generator: {
          filename: 'wasm/[name][ext]'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/popup.html",
      filename: "popup.html",
      chunks: ['popup'],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true
      }
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
        {
          from: "node_modules/onnxruntime-web/dist/*.wasm",
          to: "wasm/[name][ext]"
        },
        {
          from: "node_modules/@huggingface/transformers/dist/*.wasm",
          to: "wasm/[name][ext]"
        }
      ],
    }),
  ],
  optimization: {
    minimize: true,
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name: 'vendors'
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  }
};

export default config;
