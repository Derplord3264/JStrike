const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

const nodeModules = {};
fs.readdirSync('node_modules').filter(function(x) {
	return ['.bin'].indexOf(x) === -1;
}).forEach(function(mod) {
	nodeModules[mod] = 'commonjs ' + mod;
});

module.exports = {
	entry: {
		main: './src/main.js',
	},
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: '[name].bundle.js'
	},
	externals: nodeModules,
	target: 'web', // Changed from 'node' to 'web'
	module: {
		rules: [
			{
				test: /\.js$/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		]
	},
	resolve: {
		fallback: {
			"path": require.resolve("path-browserify"),
			"fs": false,
			"crypto": require.resolve("crypto-browserify"),
			"stream": require.resolve("stream-browserify"),
			"buffer": require.resolve("buffer/")
		}
	},
	stats: {
		colors: true
	},
	devtool: 'source-map',
	watch: false
};
