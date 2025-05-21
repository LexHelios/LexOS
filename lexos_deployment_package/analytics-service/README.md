# LexOS Analytics Service

The Analytics Service is a core component of the LexOS system, providing advanced data analysis, machine learning, and visualization capabilities.

## Features

- **Data Processing**
  - Support for multiple data formats (CSV, JSON, Parquet, Excel)
  - Efficient data preprocessing and feature engineering
  - Distributed data processing capabilities

- **Machine Learning**
  - Support for various ML algorithms (Random Forest, Gradient Boosting, SVM)
  - Deep learning capabilities with PyTorch and TensorFlow
  - Model training, evaluation, and deployment
  - Automated model versioning and management

- **Analytics**
  - Statistical analysis and hypothesis testing
  - Time series analysis and forecasting
  - Real-time data processing and analysis
  - Custom analytics pipelines

- **Visualization**
  - Interactive data visualization with Plotly
  - Model performance visualization
  - Customizable plot styles and themes
  - Export capabilities for various formats

- **Monitoring**
  - Real-time system metrics monitoring
  - Model performance tracking
  - Resource utilization monitoring
  - Automated alerting system

## Architecture

The service is built using:
- FastAPI for the REST API
- PostgreSQL for data storage
- Redis for caching and message queuing
- Prometheus for metrics collection
- Docker for containerization

## Prerequisites

- Python 3.10+
- CUDA-compatible GPU (for deep learning)
- Docker and Docker Compose
- PostgreSQL 13+
- Redis 6+

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/lexos.git
cd lexos/analytics-service
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Start the service:
```bash
docker-compose up -d
```

## Configuration

The service is configured through `config/analytics_config.yaml`. Key configuration sections include:

- Service Information
- Database Configuration
- Redis Configuration
- Data Processing Settings
- Model Management
- Analytics Operations
- Monitoring
- Security
- Resource Management
- Alerting
- Visualization

## API Endpoints

### Data Processing
- `POST /api/v1/data/upload` - Upload data for analysis
- `POST /api/v1/data/process` - Process uploaded data
- `GET /api/v1/data/list` - List available datasets

### Analytics
- `POST /api/v1/analytics/analyze` - Perform data analysis
- `GET /api/v1/analytics/results/{id}` - Get analysis results
- `POST /api/v1/analytics/visualize` - Create visualizations

### Machine Learning
- `POST /api/v1/models/train` - Train a new model
- `POST /api/v1/models/predict` - Make predictions
- `GET /api/v1/models/list` - List available models
- `GET /api/v1/models/{id}` - Get model details

### Monitoring
- `GET /api/v1/monitoring/metrics` - Get system metrics
- `GET /api/v1/monitoring/alerts` - Get active alerts
- `GET /api/v1/monitoring/health` - Check service health

## Development

### Running Tests
```bash
pytest tests/
```

### Code Style
```bash
black src/
flake8 src/
mypy src/
```

### Documentation
```bash
mkdocs serve
```

## Monitoring

The service exposes metrics at `/metrics` for Prometheus scraping. Key metrics include:

- System metrics (CPU, memory, disk usage)
- Model performance metrics
- API endpoint metrics
- Data processing metrics

## Alerting

The service supports multiple alerting channels:

- Email notifications
- Slack integration
- Custom webhook support

Alerts are triggered based on configurable thresholds for:
- System resource usage
- Model performance
- Error rates
- Response times

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue if needed

## Authors

- LexOS Team

## Acknowledgments

- Thanks to all contributors
- Special thanks to the open-source community 