#!/usr/bin/env python3
# DevOps Agent for LexOS
# This script provides DevOps automation capabilities for the LexOS system

import os
import sys
import json
import logging
import asyncio
import docker
from typing import Dict, Any, List
from datetime import datetime
from base_agent import BaseAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/app/devops_agent.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class DevOpsAgent(BaseAgent):
    def __init__(self):
        super().__init__("devops")
        self.docker_client = docker.from_env()
        self.container_metrics = {
            "running": 0,
            "stopped": 0,
            "total": 0
        }

    async def _execute_task_impl(self, task_type: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute DevOps-specific tasks"""
        if task_type == "container_health_check":
            return await self._check_container_health()
        elif task_type == "deploy_service":
            return await self._deploy_service(task_data)
        elif task_type == "rollback_service":
            return await self._rollback_service(task_data)
        elif task_type == "scale_service":
            return await self._scale_service(task_data)
        elif task_type == "cleanup_resources":
            return await self._cleanup_resources()
        else:
            raise ValueError(f"Unknown task type: {task_type}")

    async def _check_container_health(self) -> Dict[str, Any]:
        """Check health of all containers"""
        try:
            containers = self.docker_client.containers.list(all=True)
            health_status = {
                "timestamp": datetime.utcnow().isoformat(),
                "containers": [],
                "summary": {
                    "total": len(containers),
                    "running": 0,
                    "stopped": 0,
                    "unhealthy": 0
                }
            }

            for container in containers:
                container_info = {
                    "id": container.id,
                    "name": container.name,
                    "status": container.status,
                    "health": "unknown"
                }

                if container.status == "running":
                    health_status["summary"]["running"] += 1
                    try:
                        health = container.attrs.get("State", {}).get("Health", {})
                        if health:
                            container_info["health"] = health.get("Status", "unknown")
                            if health.get("Status") == "unhealthy":
                                health_status["summary"]["unhealthy"] += 1
                    except:
                        pass
                else:
                    health_status["summary"]["stopped"] += 1

                health_status["containers"].append(container_info)

            return health_status
        except Exception as e:
            logger.error(f"Error checking container health: {str(e)}")
            raise

    async def _deploy_service(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy a new service or update existing one"""
        try:
            service_name = task_data["service_name"]
            image = task_data["image"]
            config = task_data.get("config", {})

            # Pull latest image
            self.docker_client.images.pull(image)

            # Create or update service
            try:
                service = self.docker_client.services.get(service_name)
                service.update(
                    image=image,
                    **config
                )
                action = "updated"
            except docker.errors.NotFound:
                self.docker_client.services.create(
                    image=image,
                    name=service_name,
                    **config
                )
                action = "created"

            return {
                "status": "success",
                "action": action,
                "service": service_name,
                "image": image,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error deploying service: {str(e)}")
            raise

    async def _rollback_service(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Rollback a service to a previous version"""
        try:
            service_name = task_data["service_name"]
            version = task_data["version"]

            service = self.docker_client.services.get(service_name)
            service.rollback(version)

            return {
                "status": "success",
                "service": service_name,
                "version": version,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error rolling back service: {str(e)}")
            raise

    async def _scale_service(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Scale a service up or down"""
        try:
            service_name = task_data["service_name"]
            replicas = task_data["replicas"]

            service = self.docker_client.services.get(service_name)
            service.scale(replicas)

            return {
                "status": "success",
                "service": service_name,
                "replicas": replicas,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error scaling service: {str(e)}")
            raise

    async def _cleanup_resources(self) -> Dict[str, Any]:
        """Clean up unused Docker resources"""
        try:
            # Remove stopped containers
            stopped_containers = self.docker_client.containers.prune()
            
            # Remove unused images
            unused_images = self.docker_client.images.prune()
            
            # Remove unused volumes
            unused_volumes = self.docker_client.volumes.prune()
            
            # Remove unused networks
            unused_networks = self.docker_client.networks.prune()

            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "cleaned": {
                    "containers": stopped_containers,
                    "images": unused_images,
                    "volumes": unused_volumes,
                    "networks": unused_networks
                }
            }
        except Exception as e:
            logger.error(f"Error cleaning up resources: {str(e)}")
            raise

async def main():
    """Main entry point for the DevOps agent"""
    agent = DevOpsAgent()
    try:
        await agent.start()
        
        # Keep the agent running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down DevOps agent...")
    finally:
        await agent.stop()

if __name__ == "__main__":
    asyncio.run(main())
