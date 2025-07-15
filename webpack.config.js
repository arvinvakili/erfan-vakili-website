const path = require('path');
const webpack = require('webpack'); // Import webpack
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js', // نقطه شروع برنامه React شما
  output: {
    path: path.resolve(__dirname, 'build'), // پوشه خروجی build
    filename: 'bundle.js', // نام فایل جاوااسکریپت نهایی
    publicPath: '/', // مسیر عمومی برای asset ها
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
      template: './public/index.html', // استفاده از index.html موجود
      filename: 'index.html',
    }),
    // DefinePlugin برای دسترسی به متغیرهای محیطی در کد مرورگر
    new webpack.DefinePlugin({
      'process.env.REACT_APP_FIREBASE_CONFIG': JSON.stringify(process.env.REACT_APP_FIREBASE_CONFIG),
      'process.env.REACT_APP_APP_ID': JSON.stringify(process.env.REACT_APP_APP_ID),
      'process.env.REACT_APP_INITIAL_AUTH_TOKEN': JSON.stringify(process.env.REACT_APP_INITIAL_AUTH_TOKEN),
      // می‌توانید هر متغیر محیطی دیگری که با REACT_APP_ شروع می‌شود را اینجا اضافه کنید
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'build'),
    },
    compress: true,
    port: 3000,
    open: true,
    historyApiFallback: true, // برای SPA ها و ریدایرکت 404
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "util": require.resolve("util/"),
      "assert": require.resolve("assert/"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "url": require.resolve("url/"),
      "path": require.resolve("path-browserify")
    }
  },
  node: {
    global: true
  }
};
