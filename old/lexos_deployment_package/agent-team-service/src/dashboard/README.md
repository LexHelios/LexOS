# LexOS Agent Dashboard

A cyberpunk-themed dashboard for monitoring and managing LexOS agent team operations.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
REACT_APP_API_BASE_URL=your_api_url
```

## Development

To start the development server:
```bash
npm start
```

The dashboard will be available at `http://localhost:3000`.

## Production Build

To create a production build:
```bash
npm run build
```

The build output will be in the `build` directory.

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the contents of the `build` directory to your web server.

3. Configure your web server to:
   - Serve `index.html` for all routes (for client-side routing)
   - Enable CORS if needed
   - Use HTTPS in production
   - Set appropriate security headers

## Environment Variables

- `REACT_APP_API_BASE_URL`: Base URL for the API
- `REACT_APP_ENV`: Environment (development/production)

## Features

- Real-time agent monitoring
- Performance metrics visualization
- Task history tracking
- System status monitoring
- WebSocket integration for live updates
- Responsive design
- Cyberpunk theme

## Security Considerations

- All API calls are made over HTTPS in production
- WebSocket connections are secured in production
- Environment variables are used for sensitive configuration
- CORS is properly configured
- Security headers are set appropriately

## Performance Optimizations

- Production builds are minified and optimized
- Source maps are disabled in production
- Assets are properly cached
- Code splitting is implemented
- Lazy loading is used where appropriate

## Troubleshooting

If you encounter build issues:
1. Clear the build cache: `npm run clean`
2. Delete `node_modules` and reinstall: `npm install`
3. Ensure all environment variables are set correctly
4. Check the console for specific error messages 