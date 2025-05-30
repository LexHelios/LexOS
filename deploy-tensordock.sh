#!/bin/bash

# Check if TensorDock credentials are provided
if [ -z "$TENSORDOCK_USERNAME" ] || [ -z "$TENSORDOCK_API_KEY" ]; then
    echo "Please set TENSORDOCK_USERNAME and TENSORDOCK_API_KEY environment variables"
    exit 1
fi

# Login to TensorDock
echo "Logging in to TensorDock..."
docker login tensordock.com -u $TENSORDOCK_USERNAME -p $TENSORDOCK_API_KEY

# Build the Docker image
echo "Building Docker image..."
docker build -t tensordock.com/$TENSORDOCK_USERNAME/lexos:latest .

# Push the image to TensorDock
echo "Pushing image to TensorDock..."
docker push tensordock.com/$TENSORDOCK_USERNAME/lexos:latest

# Deploy using TensorDock CLI
echo "Deploying to TensorDock..."
tensordock deploy \
    --image tensordock.com/$TENSORDOCK_USERNAME/lexos:latest \
    --gpu-type "RTX A6000" \
    --gpu-count 1 \
    --memory 16 \
    --disk 100 \
    --ports 8000-8009 \
    --name "lexos-deployment"

echo "Deployment completed! Check your TensorDock dashboard for the instance status." 