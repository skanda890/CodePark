import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { DefinePlugin } from 'webpack';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  entry: './src/index.js',
  output: {
    path: path.resolve('dist'),
    filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    publicPath: '/'
  },
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource'
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      minify: isProduction
    }),
    new MiniCssExtractPlugin({
      filename: isProduction ? '[name].[contenthash].css' : '[name].css'
    }),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ],
  devServer: {
    contentBase: path.resolve('dist'),
    compress: true,
    port: 9000,
    historyApiFallback: true,
    open: true
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    },
    runtimeChunk: 'single'
  }
};
