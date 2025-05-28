# LexOS Frontend

A modern, immersive command interface for the LexOS real-time multi-agent AGI system.

## Features

- Real-time agent communication and collaboration
- Interactive workflow visualization
- System telemetry monitoring
- Voice command support
- Responsive and modern UI

## Tech Stack

- React 19 with Vite
- TypeScript
- Tailwind CSS
- Zustand for state management
- React Flow for workflow visualization
- Tremor for telemetry dashboards
- WebSocket for real-time communication

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
VITE_WS_URL=ws://localhost:8000
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=LexOS
VITE_APP_VERSION=1.0.0
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── agents/         # Agent-related components
│   ├── console/        # Command console components
│   ├── layout/         # Layout components
│   ├── telemetry/      # Telemetry components
│   ├── ui/            # Reusable UI components
│   └── workflow/      # Workflow visualization components
├── hooks/             # Custom React hooks
├── lib/              # Utility functions
├── services/         # API and WebSocket services
├── stores/           # Zustand stores
└── types/            # TypeScript type definitions
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
