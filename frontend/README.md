# Finvera Frontend - Multi-Tenant Accounting SaaS

Next.js frontend application for Finvera accounting platform with **Electron desktop app support** for macOS and Windows.

## Features

- **Public Website**: Marketing pages, pricing, features
- **Admin Panel**: Platform administration, distributor/salesman management
- **Client Portal**: Tenant accounting dashboard, invoicing, reports
- **Desktop App**: Native desktop application for macOS and Windows (via Electron)

## Web Application Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your API URL.

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Desktop Application (Electron)

### Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run electron:dev

# Build for macOS and Windows
npm run electron:build
```

### Platform-Specific Builds

```bash
npm run electron:build:mac    # macOS only
npm run electron:build:win    # Windows only
npm run electron:build:linux  # Linux only
```

### Documentation

- 📚 [Electron Quick Start Guide](ELECTRON-QUICKSTART.md) - Get started in minutes
- 📖 [Complete Electron Documentation](ELECTRON-README.md) - Detailed guide
- 🎨 [Icon Creation Guide](electron/assets/README.md) - Create app icons

### Desktop App Features

- Native desktop application for macOS and Windows
- Persistent data storage
- Platform-specific optimizations
- Auto-updates ready
- Deep linking support

## Project Structure

```
frontend/
├── electron/                # Electron desktop app
│   ├── main.js             # Main process
│   ├── preload.js          # Preload script
│   ├── builder.js          # Build configuration
│   └── assets/             # App icons
├── pages/
│   ├── index.js            # Public homepage
│   ├── admin/              # Admin routes
│   │   ├── login.js
│   │   └── dashboard.js
│   └── client/             # Client routes
│       ├── login.js
│       └── dashboard.js
├── components/             # Reusable components
│   └── ElectronInfo.jsx    # Electron info component
├── lib/                    # Utilities, API client
│   └── electron.js         # Electron utilities
├── contexts/               # React contexts
└── styles/                 # Global styles
```

## Available Scripts

### Web Application
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Desktop Application
- `npm run electron:dev` - Run Electron in development
- `npm run electron:build` - Build for all platforms
- `npm run electron:build:mac` - Build for macOS
- `npm run electron:build:win` - Build for Windows
- `npm run electron:build:linux` - Build for Linux

