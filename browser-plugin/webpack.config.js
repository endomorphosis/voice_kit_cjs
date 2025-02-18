import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('webpack').Configuration} */
const config = {
  mode: "production",
  entry: {
    popup: "./src/popup.js",
    background: "./src/background.js",
    content: "./src/content.js",
    'asr-worker': "./src/asr-worker.js"
  },
  target: ['web', 'es2020'],
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true
  },
  resolve: {
    extensions: ['.js'],
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
    globalObject: 'self',
    webassemblyModuleFilename: "wasm/[hash].wasm"
  },
  module: {
    rules: [
      { 
        test: /\.m?js$/,
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
      },
      {
        test: /\.wasm$/,
        type: "asset/resource",
        generator: {
          filename: "wasm/[hash][ext][query]"
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
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
          from: "src/manifest.json",
          to: "manifest.json",
          transform(content) {
            const manifestStr = typeof content === 'string' ? content : content.toString();
            const manifest = JSON.parse(manifestStr);
            manifest.content_security_policy = {
              extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; worker-src 'self'"
            };
            return JSON.stringify(manifest, null, 2);
          }
        },
        { from: "public/icons", to: "icons" },
        { from: "src/mic-icon.svg", to: "mic-icon.svg" },
        { 
          from: 'node_modules/onnxruntime-web/dist/*.wasm',
          to: 'wasm/[name][ext]'
        },
        {
          from: 'node_modules/@xenova/transformers/dist/tokenizer.wasm',
          to: 'wasm/tokenizer.wasm',
          noErrorOnMissing: true
        }
      ]
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          reuseExistingChunk: true
        }
      }
    }
  }
};

export default config;
