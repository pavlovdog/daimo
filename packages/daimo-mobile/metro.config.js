// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

// eslint-disable-next-line no-undef
const config = getDefaultConfig(__dirname);

config.resolver = { ...config.resolver, unstable_enablePackageExports: true };

module.exports = config;
