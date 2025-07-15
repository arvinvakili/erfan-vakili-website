const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
    }),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_FIREBASE_CONFIG': JSON.stringify(process.env.REACT_APP_FIREBASE_CONFIG),
      'process.env.REACT_APP_APP_ID': JSON.stringify(process.env.REACT_APP_APP_ID),
      'process.env.REACT_APP_INITIAL_AUTH_TOKEN': JSON.stringify(process.env.REACT_APP_INITIAL_AUTH_TOKEN),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'build'),
    },
    compress: true,
    port: 3000,
    open: true,
    historyApiFallback: true,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      "crypto": "crypto-browserify", // Changed
      "stream": "stream-browserify", // Changed
      "buffer": "buffer/",           // Changed
      "util": "util/",               // Changed
      "assert": "assert/",           // Changed
      "http": "stream-http",         // Changed
      "https": "https-browserify",   // Changed
      "os": "os-browserify/browser", // Changed
      "url": "url/",                 // Changed
      "path": "path-browserify"      // Changed
    }
  },
  node: {
    global: true
  }
};
