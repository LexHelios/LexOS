# LexOS Frontend

A modern, military-themed dashboard interface for the LexOS system.

## Features

- Military-style radar visualization
- Real-time system status monitoring
- Dark/Light mode support
- Responsive design
- Secure authentication

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Building for Production

To create a production build:

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── contexts/       # React context providers
  ├── pages/         # Page components
  ├── styles/        # Global styles
  └── App.tsx        # Main application component
```

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- React Router 