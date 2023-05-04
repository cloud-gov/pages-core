const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const { getFeatureFlags } = require('./webpack-utils');

const RESOURCE_GENERATOR = {
  filename: 'images/[contenthash][ext]',
  publicPath: '/',
};

module.exports = {
  mode: 'development',
  entry: './frontend/main.jsx',
  devtool: 'inline-source-map',
  stats: 'minimal',
  output: {
    filename: 'js/bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components|public\/)/,
        loader: 'babel-loader',
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: url => !url.includes('images'),
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              postcssOptions: {
                plugins: [autoprefixer],
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                quietDeps: true,
                loadPath: path.resolve(__dirname, 'node_modules/uswds/src/stylesheets/'),
              },
            },
          },
        ],
      },
      {
        test: /\.(gif|png|jpe?g|ttf|woff2?|eot)$/i,
        type: 'asset/resource',
        generator: RESOURCE_GENERATOR,
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
              {
                loader: 'react-svg-loader',
                options: {
                  svgo: {
                    plugins: [{ removeViewBox: false }],
                  },
                },
              },
            ],
          },
          {
            // For all other .svg files, fallback to asset/resource
            type: 'asset/resource',
            generator: RESOURCE_GENERATOR,
          },
        ],
      },
    ],
  },
  plugins: [
    // Make sure this is the first plugin!!!
    new MiniCssExtractPlugin({ filename: 'styles/styles.css' }),
    // When webpack bundles moment, it includes all of its locale files,
    // which we don't need, so we'll use this plugin to keep them out of the
    // bundle
    new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/}),
    new webpack.EnvironmentPlugin([
      ...getFeatureFlags(process.env),
      'APP_HOSTNAME',
      'PRODUCT',
    ]),
    new WebpackManifestPlugin({
      fileName: '../webpack-manifest.json',
      publicPath: '',
    }),
  ],
};
