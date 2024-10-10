const path = require('path');
const rspack = require('@rspack/core');
const { RspackManifestPlugin } = require('rspack-manifest-plugin');
const autoprefixer = require('autoprefixer');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
// const CopyPlugin = require('copy-webpack-plugin');
const { getFeatureFlags } = require('./webpack-utils');

const { NODE_ENV } = process.env;
const isDev = NODE_ENV === 'development';
const prod = NODE_ENV === 'production';
const outputPath = isDev ? 'dist' : 'public';
const jsDirectory = isDev ? '' : 'js/';
const resourceFilename = isDev
  ? 'images/[name][ext]'
  : 'images/[name].[contenthash][ext]';
const mode = isDev ? NODE_ENV : 'production';
const devtool = isDev ? 'inline-source-map' : undefined;
const stats = isDev ? 'minimal' : 'none';
const devServer = isDev
  ? {
    static: {
      directory: path.join(__dirname, 'dist'),
      publicPath: '/',
    },
  }
  : {};

// Decide on how to use this later.
// const bundleAnalyzer = isDev && new BundleAnalyzerPlugin({
//   analyzerHost: '0.0.0.0',
//   analyzerPort: '8888',
// });

const uswdsDist = './node_modules/@uswds/uswds/dist';

const uswdsIncludePaths = [
  './node_modules/@uswds/uswds',
  './node_modules/@uswds/uswds/src/stylesheets',
  './node_modules/@uswds/uswds/packages',
  './frontend/sass',
  './public',
];

const RESOURCE_GENERATOR = {
  filename: resourceFilename,
};

const FONT_GENERATOR = {
  filename: './fonts/[name][ext]',
};

const svgoConfig = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
  ],
};

const plugins = [
  // Make sure this is the first plugin!!!
  new rspack.CssExtractRspackPlugin({ filename: 'styles.css' }),
  new rspack.CopyRspackPlugin({
    patterns: [
      { from: `${uswdsDist}/img`, to: 'img' },
      { from: `${uswdsDist}/js`, to: 'js' },
    ],
  }),
  // When webpack bundles moment, it includes all of its locale files,
  // which we don't need, so we'll use this plugin to keep them out of the
  // bundle
  new rspack.IgnorePlugin({
    resourceRegExp: /^\.\/locale$/,
    contextRegExp: /moment$/,
  }),
  new rspack.EnvironmentPlugin([
    ...getFeatureFlags(process.env),
    'APP_HOSTNAME',
    'PRODUCT',
    'PROXY_DOMAIN',
  ]),
];

if (!isDev) {
  plugins.push(
    new RspackManifestPlugin({
      fileName: '../webpack-manifest.json',
      publicPath: '',
    })
  );
}

module.exports = {
  mode,
  entry: {
    bundle: './frontend/main.jsx',
    report: './frontend/mainReport.jsx',
  },
  devtool,
  devServer,
  stats,
  output: {
    filename: `${jsDirectory}[name].js`,
    path: path.resolve(__dirname, outputPath),
    publicPath: '/',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: true,
              },
            },
            transform: {
              react: {
                runtime: 'automatic',
                development: !prod,
                refresh: !prod,
              },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.js$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: true,
              },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.scss$/,
        use: [
          rspack.CssExtractRspackPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: {
                filter: url => !(url.includes('img') || url.includes('images')),
              },
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
                includePaths: uswdsIncludePaths,
              },
            },
          },
        ],
      },
      {
        test: /\.svg$/i,
        oneOf: [
          {
            // For .svg files in public/images/icons/, use the @svgr/webpack loader
            // so that they can be loaded as React components
            include: path.resolve(__dirname, 'public/images/icons'),
            use: [{ loader: '@svgr/webpack', options: { svgoConfig } }],
          },
          {
            // For all other .svg files, fallback to asset/resource
            type: 'asset/resource',
            generator: RESOURCE_GENERATOR,
          },
        ],
      },
      {
        test: /\.(gif|png|jpe?g)$/i,
        type: 'asset/resource',
        generator: RESOURCE_GENERATOR,
      },
      {
        test: /\.(ttf|woff2?|eot)$/i,
        type: 'asset/resource',
        generator: FONT_GENERATOR,
      },
    ],
  },
  plugins,
};
