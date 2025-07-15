const path = require('path');
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
  },
};
