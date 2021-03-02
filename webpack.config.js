const slsw = require('serverless-webpack')
const nodeExternals = require('webpack-node-externals')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WebpackPoppler = require('./webpack-poppler.js')

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
    new CopyWebpackPlugin([{
      from: 'index.sh'
    },{
      from: 'poppler/bin/*',
      to: 'bin',
      transformPath: ( targetPath ) => {
        return targetPath.replace( 'poppler/bin/', '' );
      }
    },
    {
      from: 'poppler/bin/lib/**',
      to: 'lib',
      transformPath: ( targetPath ) => {
        return targetPath.replace( 'poppler/bin/lib/', '' );
      }
    },
    {
      from: 'poppler/bin/share/**',
      to: 'share',
      transformPath: ( targetPath ) => {
        return targetPath.replace( 'poppler/bin/share/', '' );
      }
    }]),
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
