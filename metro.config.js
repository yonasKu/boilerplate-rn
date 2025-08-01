const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('@expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// This is the key change: it ensures that the bundler looks for the 'react-native' 
// specific entry points in packages, which is what Firebase needs.
config.resolver.resolverMainFields = [
    'react-native',
    'browser',
    'main',
];

// This is also required for Firebase to work correctly.
config.resolver.sourceExts.push('mjs');

// Firebase compatibility fixes for Expo SDK 53
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
