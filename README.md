# Apps Portal

A modern Angular monorepo featuring a multi-app portal with electoral simulators, utilities, and tools.

## Features

- 🌍 **Multi-language Support** - Full i18n integration with English and French
- 🎨 **Theme Switching** - Light/dark mode support
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **Multiple Apps** - Portal dashboard hosting multiple standalone applications
- 🚀 **Modern Angular** - Built with Angular 21

## Available Apps

- **Portal** - Main dashboard and navigation hub
- **Simulator** - Electoral vote distribution simulator (simulateur-reports-voix)
- **Elections** - Election analytics (coming soon)
- **Pomodoro** - Productivity timer
- **Palette** - Color palette utility
- **Markdown** - Markdown editor

## Prerequisites

- Node.js 18+
- npm 11.10.1+

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd apps-portal

# Install dependencies
npm install
```

## Development

```bash
# Start all apps concurrently
npm run dev

# Or start a specific app
npm start                # Portal
npm run start:simulator  # Simulator
npm run start:pomodoro   # Pomodoro
npm run start:palette    # Palette
npm run start:markdown   # Markdown
npm run start:elections  # Elections
```

Apps will be available at:
- Portal: `http://localhost:4200`
- Other apps: different ports (see terminal output)

## Building

```bash
# Build all apps
npm run build

# Or build a specific app
npm run build:portal
npm run build:simulator
npm run build:pomodoro
npm run build:palette
npm run build:markdown
npm run build:elections
```

## Testing

```bash
npm test
```

## Project Structure

```
apps-portal/
├── apps/
│   ├── portal/              # Main portal app
│   ├── simulator/           # Electoral simulator
│   ├── elections/           # Elections analytics
│   ├── pomodoro/            # Pomodoro timer
│   ├── palette/             # Color palette tool
│   └── markdown/            # Markdown editor
├── libs/
│   └── shared/              # Shared components, services, and utilities
│       ├── core/
│       │   └── i18n/        # Internationalization (en.json, fr.json)
│       ├── components/
│       └── services/
├── package.json
├── angular.json
└── tsconfig.json
```

## Technologies

- **Framework**: Angular 21
- **Language**: TypeScript 5.9
- **Styling**: CSS3
- **Testing**: Vitest
- **Build**: Angular CLI with Webpack
- **Server**: Express 5
- **Rendering**: Angular SSR

## Code Quality

Configured with Prettier for code formatting:
- Print width: 100 characters
- Single quotes
- Angular HTML parser for template files

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

## Support

For issues and questions, please create an issue on the GitHub repository.
