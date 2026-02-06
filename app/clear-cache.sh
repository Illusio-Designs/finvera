#!/bin/bash

# Clear Metro bundler cache and restart
echo "Clearing Metro bundler cache..."

# Remove cache directories
rm -rf node_modules/.cache
rm -rf .expo/web/cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

echo "Cache cleared!"
echo ""
echo "Now run one of these commands:"
echo "  npm start -- --reset-cache"
echo "  npx expo start -c"
echo "  npx react-native start --reset-cache"
