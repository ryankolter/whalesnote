const { override } = require("customize-cra");

const ignoreWarnings = (value) => (config) => {
  config.ignoreWarnings = value;
  return config;
};

const addFallback = (value) => (config) => {
  let loaders = config.resolve;
  loaders.fallback = {
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    util: require.resolve("util/"),
    buffer: require.resolve("buffer/"),
  };
  return config;
};

module.exports = override(
  ignoreWarnings([/Failed to parse source map/]),
  addFallback()
);
