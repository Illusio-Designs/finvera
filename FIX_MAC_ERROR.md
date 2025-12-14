# Fix ERR_INVALID_PACKAGE_CONFIG on Mac

This error occurs when Node.js can't parse the package.json file. Follow these steps:

## Step 1: Clean npm cache and node_modules
```bash
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
```

## Step 2: Reinstall dependencies
```bash
npm install
```

## Step 3: If still failing, check Node version
```bash
node --version
# Should be v18+ or v20+ (LTS recommended)
# If not, update Node.js
```

## Step 4: Fix line endings (if needed)
```bash
# Install dos2unix if not already installed
brew install dos2unix

# Convert line endings
dos2unix package.json
```

## Step 5: Verify package.json is valid JSON
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('package.json', 'utf8')))"
```

## Step 6: Try running again
```bash
npm run dev
```

## Alternative: Use Yarn instead of npm
```bash
# Install yarn
npm install -g yarn

# Install dependencies
yarn install

# Run dev server
yarn dev
```

If the error persists, delete the entire backend folder and re-clone from git.
