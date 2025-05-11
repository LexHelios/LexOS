# LexCommand Shadow Autonomy

A real-time monitoring and command-and-control dashboard for autonomous systems.

## Features

- Real-time system metrics and insights
- AI-powered anomaly detection
- Service dependency visualization
- Audit logging and traceability
- Role-based access control
- Dark mode support
- Responsive design

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- React Query
- Zustand
- WebSocket
- Sentry

### Backend
- FastAPI
- Redis
- JWT Authentication
- OpenTelemetry
- Prometheus
- WebSocket

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Redis
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/lexcommand-shadow-autonomy.git
cd lexcommand-shadow-autonomy
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Frontend (.env)
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SENTRY_DSN=your-sentry-dsn
REACT_APP_ALLOWED_ORIGINS=http://localhost:3000

# Backend (.env)
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret
ALLOWED_ORIGINS=http://localhost:3000
```

### Development

1. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

3. Access the application at `http://localhost:3000`

## Testing

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Backend Tests
```bash
cd backend
pytest
pytest --cov
```

## Deployment

### Frontend
The frontend is deployed using Cloudflare Pages. The deployment is automated through GitHub Actions.

### Backend
The backend is deployed using Docker and Kubernetes. See the deployment guide for more details.

## Security

- CSRF Protection
- XSS Prevention
- Rate Limiting
- JWT Authentication
- Role-based Access Control
- Security Headers
- Input Validation
- Regular Security Scans

## Monitoring

- Sentry for error tracking
- Prometheus for metrics
- OpenTelemetry for tracing
- Performance monitoring
- User analytics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@lexcommand.ai or join our Slack channel.

## Acknowledgments

- [React](https://reactjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Sentry](https://sentry.io/)
- [OpenTelemetry](https://opentelemetry.io/) 