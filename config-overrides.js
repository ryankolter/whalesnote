const { override } = require('customize-cra');
const path = require('path');

const ignoreWarnings = (value) => (config) => {
    config.ignoreWarnings = value;
    return config;
};

const addFallback = (value) => (config) => {
    let loaders = config.resolve;
    loaders.fallback = {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
    };
    return config;
};

const publicPathPlugin = (value) => (config) => {
    config.output = {
        ...config.output,
        path: path.join(__dirname, 'app/build'),
    };
    return config;
};

module.exports = override(
    ignoreWarnings([/Failed to parse source map/]),
    addFallback(),
    publicPathPlugin()
);
