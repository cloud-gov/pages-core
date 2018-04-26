import path from 'path';

import webpack from 'webpack';
import autoprefixer from 'autoprefixer';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import ManifestPlugin from 'webpack-manifest-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const extractStyles = new ExtractTextPlugin({
  filename: 'styles/styles.[contenthash].css',
  allChunks: true,
});

const manifestPlugin = new ManifestPlugin({
  fileName: '../webpack-manifest.json',
});

const fileLoaderConfig = 'file-loader?name=/styles/webpackAssets/[hash].[ext]';

export default {
  entry: {
    main: './frontend/main.jsx',
    glossary: './frontend/glossary.js',
  },
  devtool: 'source-map',
  output: {
    filename: 'js/bundle.[name].[hash].js',
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
        test: /\.(gif|png|jpe?g|ttf|woff2?|eot)$/i,
        loader: fileLoaderConfig,
      },
      {
        test: /\.svg$/i,
        oneOf: [
          {
            // For .svg files in public/images/icons/, use the react-svg loader
            // so that they can be loaded as React components
            include: path.resolve(__dirname, 'public/images/icons'),
            use: [
              'babel-loader',
              'react-svg-loader',
            ],
          },
          {
            // For all other .svg files, fallback to the file-loader
            loader: fileLoaderConfig,
          },
        ],
      },
    ],
  },
  plugins: [
    extractStyles,
    manifestPlugin,
    // When webpack bundles moment, it includes all of its locale files,
    // which we don't need, so we'll use this plugin to keep them out of the
    // bundle
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    // Generate a webpack-bundle-analyzer stats file (in public/stats.json)
    // It can be viewed by running `yarn analyze-webpack`
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',
      openAnalyzer: false,
      generateStatsFile: true,
    }),
  ],
};
