#!/bin/bash

# Check if Docker Hub credentials are provided
if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
    echo "Please set DOCKER_USERNAME and DOCKER_PASSWORD environment variables"
    exit 1
fi

# Login to Docker Hub
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

# Install Bazel
wget https://github.com/bazelbuild/bazelisk/releases/download/v1.20.0/bazelisk-linux-amd64
chmod +x bazelisk-linux-amd64
sudo cp ./bazelisk-linux-amd64 /usr/local/bin/bazel

# Build and push the Docker image
bazel run //:push_lexos_image

# Install RunPod CLI if not already installed
if ! command -v runpod &> /dev/null; then
    curl -s https://raw.githubusercontent.com/runpod/runpod-cli/main/install.sh | bash
fi

# Deploy to RunPod
runpod deploy \
    --template template.json \
    --gpu-type "NVIDIA RTX A4000" \
    --gpu-count 1 \
    --volume-size 50 \
    --name "lexos-deployment"

echo "Deployment completed! Check your RunPod dashboard for the pod status." 