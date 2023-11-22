import path from 'path'
import slsw from 'serverless-webpack'
import nodeExternals from 'webpack-node-externals'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import WebpackPoppler from './webpack-poppler.js'

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  // Generate sourcemaps for proper error messages
  devtool: 'source-map',
  // Since 'aws-sdk' is not compatible with webpack,
  // we exclude all node dependencies
  externals: [nodeExternals()],
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  optimization: {
    // We do not want to minimize our code.
    minimize: false,
    concatenateModules: false
  },
  performance: {
    // Turn off size warnings for entry points
    hints: false,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'index.sh'
        },{
          from: 'poppler/bin/**/*'
        }
      ]
    }),
    new WebpackPoppler()
  ],
  // Run babel on all .js files and skip those in node_modules
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: __dirname,
        exclude: /node_modules/,
      },
    ],
  },
}
