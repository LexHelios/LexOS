## Running the Project with Docker

This project is designed to run as a multi-service application using Docker Compose. Each service has its own Dockerfile and is orchestrated via the provided `docker-compose.yml` file. Below are the key details and instructions specific to this project.

### Project-Specific Requirements

- **Node.js Version**: All Node-based services require Node.js version `22.13.1` (as specified by `ARG NODE_VERSION=22.13.1` in Dockerfiles).
- **Python Version**: Python-based services use Python `3.10` or `3.11` (see individual Dockerfiles).
- **CUDA Support**: Several services (e.g., `ai-orchestrator`, `analytics-service`, `llm-service`, `oracle-service`, `digital-twin-service`) use `nvidia/cuda:12.1.0-runtime-ubuntu22.04` as their base image. If you plan to use GPU acceleration, ensure your host supports NVIDIA Docker.
- **GIS Service**: The GIS service requires GDAL 3.6.2 and related system libraries.

### Required Environment Variables

- **Postgres**:
  - `POSTGRES_DB=lexos_db`
  - `POSTGRES_USER=lexos_user`
  - `POSTGRES_PASSWORD=your_secure_password_here` (change for production)
- **Redis**:
  - Password is set via `--requirepass your_redis_password_here` (change for production)
- **.env Files**: Many services support an `.env` file for additional configuration. Uncomment the `env_file` lines in `docker-compose.yml` and provide the necessary `.env` files in each service directory as needed.

### Build and Run Instructions

1. **Clone the repository and ensure Docker and Docker Compose are installed.**
2. **(Optional) Prepare `.env` files** for each service if you need to override defaults or provide secrets.
3. **Build and start all services:**
   ```sh
   docker compose up --build
   ```
   This will build all images and start the containers as defined in `docker-compose.yml`.

### Special Configuration Notes

- **GPU Support**: For services based on CUDA images, you must run Docker with NVIDIA runtime. If using GPU, start Docker Compose with:
  ```sh
  docker compose up --build --gpus all
  ```
- **Persistent Data**: Postgres data is persisted in the `pgdata` Docker volume.
- **Healthchecks**: Each service has a healthcheck defined for robust orchestration.
- **Custom Nginx Config**: The frontend uses a custom `nginx.conf`.
- **Port Mapping**: Each service exposes a specific port (see below).

### Ports Exposed Per Service

| Service                        | Container Name              | Host Port | Container Port |
|------------------------------- |----------------------------|-----------|---------------|
| Python Backend                 | python-backend              | 8000      | 8000          |
| TypeScript Frontend            | typescript-frontend         | 80        | 80            |
| Agent Team Service (Python)    | python-agent-team-service   | 8001      | 8000          |
| Agent Dashboard (TypeScript)   | typescript-dashboard        | 3001      | 3000          |
| AI Orchestrator (Python)       | python-ai-orchestrator      | 8002      | 8000          |
| Analytics Service (Python)     | python-analytics-service    | 8003      | 8000          |
| Analytics Metrics (Prometheus) | python-analytics-service    | 9090      | 9090          |
| Digital Twin Service (Python)  | python-digital-twin-service | 8004      | 8000          |
| GIS Service (Python)           | python-gis-service          | 8005      | 8003          |
| LLM Service (Python)           | python-llm-service          | 8008      | 8000          |
| Oracle Service (Python)        | python-oracle-service       | 8009      | 8000          |
| Vision Service (Python)        | python-vision-service       | 8007      | 8007          |
| Voice Orchestrator (Python)    | python-voice-orchestrator   | 8006      | 8006          |
| TypeScript Src App             | typescript-src              | 3002      | 3000          |
| Postgres                       | postgres                    | 5432      | 5432          |
| Redis                          | redis                       | 6379      | 6379          |

### Additional Notes

- **Change default passwords** for Postgres and Redis before deploying to production.
- **Service Dependencies**: Most services depend on Postgres and Redis; ensure these are healthy before accessing application endpoints.
- **For development**: You may comment/uncomment services in `docker-compose.yml` as needed.

Refer to the `docker-compose.yml` and individual service directories for further customization and advanced configuration.
