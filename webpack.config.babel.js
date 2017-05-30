import path from 'path';

// TODO: enable production settings when NODE_ENV is "production"

export default {
  entry: './frontend/main.js',
  output: {
    filename: 'bundle.js', // TODO: add hash to this
    path: path.resolve(__dirname, 'public', 'js'),
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
      // TODO: SASS
    ],
  },
};
