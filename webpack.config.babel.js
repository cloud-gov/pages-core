import path from 'path';

import ExtractTextPlugin from 'extract-text-webpack-plugin';
import AssetsPlugin from 'assets-webpack-plugin';

const extractSass = new ExtractTextPlugin({
  filename: 'styles/styles.[contenthash].css',
});

export default {
  entry: './frontend/main.jsx',
  devtool: 'source-map',
  output: {
    filename: 'js/bundle.[hash].js',
    path: path.resolve(__dirname, 'public'),
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components|public\/)/,
        loader: 'babel-loader',
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      {
        test: /\.scss$/,
        use: extractSass.extract(['css-loader?sourceMap', 'postcss-loader?sourceMap', 'sass-loader?sourceMap']),
      },
    ],
  },
  plugins: [extractSass, new AssetsPlugin()],
};
