import path from 'path';

import autoprefixer from 'autoprefixer';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import ManifestPlugin from 'webpack-manifest-plugin';

const extractStyles = new ExtractTextPlugin({
  filename: 'styles/styles.[contenthash].css',
  allChunks: true,
});

const manifestPlugin = new ManifestPlugin({
  fileName: '../webpack-manifest.json',
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
        use: extractStyles.extract([
          'css-loader?sourceMap',
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              plugins: [autoprefixer],
            },
          },
          'sass-loader?sourceMap',
        ]),
      },
      {
        test: /\.(gif|png|jpe?g|svg|ttf|woff2?|eot)$/i,
        use: [{
          loader: 'file-loader',
          options: {
            outputPath: './webpackAssets/',
          },
        }],
      },
    ],
  },
  plugins: [extractStyles, manifestPlugin],
};
