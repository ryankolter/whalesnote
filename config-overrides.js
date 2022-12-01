const { override } = require('customize-cra');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const WebpackObfuscator = require('webpack-obfuscator');
const path = require('path');

const ignoreWarnings = (value) => (config) => {
    config.ignoreWarnings = value;
    return config;
};

const publicPathPlugin = (value) => (config) => {
    config.output = {
        ...config.output,
        path: path.join(__dirname, 'app/build'),
    };
    return config;
};

const bundleAnalyzerPlugin = (value) => (config, env) => {
    config.plugins = [
        ...config.plugins,
        new BundleAnalyzerPlugin({
            analyzerMode: process.env.STATS || 'disabled',
        }),
    ];
    return config;
};

const WebpackObfuscatorPlugin = (value) => (config, env) => {
    if (process.env.NODE_ENV === 'production') {
        config.plugins = [
            ...config.plugins,
            new WebpackObfuscator({
                rotateStringArray: true,
            }),
        ];
    }

    return config;
};

module.exports = override(
    ignoreWarnings([/Failed to parse source map/]),
    publicPathPlugin(),
    bundleAnalyzerPlugin(),
    WebpackObfuscatorPlugin()
);
