const DotenvWebpackPlugin = require("dotenv-webpack");
const path = require('path');
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    publicPath: '/',
    filename: 'main.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg|pdf)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      }
    ]
  },
  devServer: {
    historyApiFallback: {
      disableDotRule: true
    },
    compress: true,
    port: 3000,
  },
  plugins: [
    new DotenvWebpackPlugin(),
  ],
}

// use copy plugin to copy icons from cryptocurrency-icons to here.
