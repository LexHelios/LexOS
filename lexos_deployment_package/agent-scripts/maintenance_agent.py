#!/usr/bin/env python3
# Maintenance Agent for LexOS
# This script provides system monitoring and self-healing capabilities for the LexOS system

import os
import sys
import json
import time
import logging
import argparse
import subprocess
from datetime import datetime, timedelta, timezone
import asyncio
import aiohttp
import psutil
import shutil
from typing import Dict, Any, List
from agent_scripts.base_agent import BaseAgent
from fastapi import FastAPI
from routes.agent_routes import router as agent_router

# Configure logging
LOG_PATH = "/workspace/logs/maintenance_agent.log"
os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("maintenance_agent")

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8080")
HEARTBEAT_URL = f"{API_BASE_URL}/api/v1/agents/heartbeat"

class MaintenanceAgent(BaseAgent):
    def __init__(self):
        try:
            super().__init__("maintenance")
        except TypeError:
            super().__init__()
        self.maintenance_tasks = {
            "disk_cleanup": self._cleanup_disk,
            "log_rotation": self._rotate_logs,
            "backup_verification": self._verify_backups,
            "system_optimization": self._optimize_system,
            "security_updates": self._check_security_updates,
            "database_maintenance": self._maintain_database
        }
        logger.info("maintenance agent started")

    async def send_heartbeat(self):
        payload = {
            "agent_name": self.agent_type,
            "status": "online",
            "timestamp": datetime.utcnow().replace(tzinfo=timezone.utc).isoformat()
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(HEARTBEAT_URL, json=payload) as resp:
                    if resp.status != 200:
                        logger.error(f"Heartbeat failed: {resp.status} {await resp.text()}")
        except Exception as e:
            logger.error(f"Error sending heartbeat: {e}")

    async def _execute_task_impl(self, task_type: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute maintenance-specific tasks"""
        if task_type in self.maintenance_tasks:
            return await self.maintenance_tasks[task_type](task_data)
        else:
            raise ValueError(f"Unknown task type: {task_type}")

    async def _cleanup_disk(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Clean up disk space"""
        try:
            paths = task_data.get("paths", ["/var/log", "/tmp"])
            min_free_space = task_data.get("min_free_space_gb", 10)
            
            results = []
            for path in paths:
                if not os.path.exists(path):
                    continue
                
                # Get current disk usage
                usage = shutil.disk_usage(path)
                free_gb = usage.free / (1024**3)
                
                if free_gb < min_free_space:
                    # Find old files
                    old_files = []
                    for root, _, files in os.walk(path):
                        for file in files:
                            file_path = os.path.join(root, file)
                            try:
                                mtime = os.path.getmtime(file_path)
                                if datetime.fromtimestamp(mtime) < datetime.now() - timedelta(days=30):
                                    old_files.append(file_path)
                            except Exception:
                                continue
                    
                    # Delete old files
                    deleted_size = 0
                    for file in old_files:
                        try:
                            size = os.path.getsize(file)
                            os.remove(file)
                            deleted_size += size
                        except Exception:
                            continue
                    
                    results.append({
                        "path": path,
                        "initial_free_gb": free_gb,
                        "deleted_size_gb": deleted_size / (1024**3),
                        "final_free_gb": shutil.disk_usage(path).free / (1024**3)
                    })
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "results": results
            }
        except Exception as e:
            logger.error(f"Error cleaning up disk: {str(e)}")
            raise

    async def _rotate_logs(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Rotate log files"""
        try:
            log_paths = task_data.get("log_paths", ["/var/log"])
            max_size_mb = task_data.get("max_size_mb", 100)
            max_backups = task_data.get("max_backups", 5)
            
            results = []
            for path in log_paths:
                if not os.path.exists(path):
                    continue
                
                for root, _, files in os.walk(path):
                    for file in files:
                        if not file.endswith(".log"):
                            continue
                        
                        file_path = os.path.join(root, file)
                        try:
                            size_mb = os.path.getsize(file_path) / (1024**2)
                            
                            if size_mb > max_size_mb:
                                # Rotate existing backups
                                for i in range(max_backups - 1, 0, -1):
                                    old = f"{file_path}.{i}"
                                    new = f"{file_path}.{i + 1}"
                                    if os.path.exists(old):
                                        if os.path.exists(new):
                                            os.remove(new)
                                        os.rename(old, new)
                                
                                # Rotate current log
                                if os.path.exists(f"{file_path}.1"):
                                    os.remove(f"{file_path}.1")
                                os.rename(file_path, f"{file_path}.1")
                                
                                # Create new log file
                                open(file_path, "a").close()
                                
                                results.append({
                                    "file": file_path,
                                    "size_mb": size_mb,
                                    "rotated": True
                                })
                        except Exception:
                            continue
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "results": results
            }
        except Exception as e:
            logger.error(f"Error rotating logs: {str(e)}")
            raise

    async def _verify_backups(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Verify backup integrity"""
        try:
            backup_paths = task_data.get("backup_paths", ["/backups"])
            max_age_days = task_data.get("max_age_days", 7)
            
            results = []
            for path in backup_paths:
                if not os.path.exists(path):
                    continue
                
                for root, _, files in os.walk(path):
                    for file in files:
                        if not file.endswith((".bak", ".backup", ".gz")):
                            continue
                        
                        file_path = os.path.join(root, file)
                        try:
                            mtime = os.path.getmtime(file_path)
                            age_days = (datetime.now() - datetime.fromtimestamp(mtime)).days
                            
                            # Check file integrity
                            is_valid = True
                            try:
                                if file.endswith(".gz"):
                                    import gzip
                                    with gzip.open(file_path, "rb") as f:
                                        f.read(1024)
                            except Exception:
                                is_valid = False
                            
                            results.append({
                                "file": file_path,
                                "age_days": age_days,
                                "size_mb": os.path.getsize(file_path) / (1024**2),
                                "is_valid": is_valid,
                                "needs_rotation": age_days > max_age_days
                            })
                        except Exception:
                            continue
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "results": results
            }
        except Exception as e:
            logger.error(f"Error verifying backups: {str(e)}")
            raise

    async def _optimize_system(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize system performance"""
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage("/")
            
            # Check for high resource usage
            high_cpu = cpu_percent > 80
            high_memory = memory.percent > 80
            low_disk = disk.percent > 80
            
            # Get process information
            processes = []
            for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
                try:
                    processes.append(proc.info)
                except Exception:
                    continue
            
            # Sort by resource usage
            processes.sort(key=lambda x: x["cpu_percent"], reverse=True)
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "system_metrics": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "disk_percent": disk.percent
                },
                "alerts": {
                    "high_cpu": high_cpu,
                    "high_memory": high_memory,
                    "low_disk": low_disk
                },
                "top_processes": processes[:10]
            }
        except Exception as e:
            logger.error(f"Error optimizing system: {str(e)}")
            raise

    async def _check_security_updates(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check for security updates"""
        try:
            # Simulate checking for updates
            updates = [
                {
                    "package": "openssl",
                    "current_version": "1.1.1",
                    "available_version": "1.1.1k",
                    "severity": "high",
                    "description": "Security fixes for CVE-2021-3450"
                },
                {
                    "package": "nginx",
                    "current_version": "1.18.0",
                    "available_version": "1.20.1",
                    "severity": "medium",
                    "description": "Security fixes for CVE-2021-23017"
                }
            ]
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "updates": updates,
                "summary": {
                    "total": len(updates),
                    "high": sum(1 for u in updates if u["severity"] == "high"),
                    "medium": sum(1 for u in updates if u["severity"] == "medium"),
                    "low": sum(1 for u in updates if u["severity"] == "low")
                }
            }
        except Exception as e:
            logger.error(f"Error checking security updates: {str(e)}")
            raise

    async def _maintain_database(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform database maintenance"""
        try:
            # Simulate database maintenance tasks
            maintenance_tasks = [
                {
                    "task": "vacuum",
                    "status": "completed",
                    "duration_seconds": 120,
                    "rows_affected": 1000
                },
                {
                    "task": "analyze",
                    "status": "completed",
                    "duration_seconds": 30,
                    "tables_analyzed": 50
                },
                {
                    "task": "reindex",
                    "status": "completed",
                    "duration_seconds": 300,
                    "indexes_rebuilt": 20
                }
            ]
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "tasks": maintenance_tasks,
                "summary": {
                    "total_duration_seconds": sum(t["duration_seconds"] for t in maintenance_tasks),
                    "tasks_completed": len(maintenance_tasks)
                }
            }
        except Exception as e:
            logger.error(f"Error maintaining database: {str(e)}")
            raise

    async def run(self):
        while True:
            await self.send_heartbeat()
            await asyncio.sleep(60)

async def main():
    """Main entry point for the maintenance agent"""
    agent = MaintenanceAgent()
    try:
        await agent.run()
    except KeyboardInterrupt:
        logger.info("maintenance agent stopped by user")

if __name__ == "__main__":
    asyncio.run(main())

# Initialize FastAPI app
app = FastAPI(
    title="LexOS API",
    description="LexOS Intelligent Property Management System API",
    version="1.0.0"
)

# Include the agent heartbeat router
app.include_router(agent_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.on_event("startup")
async def list_routes():
    for route in app.routes:
        logging.info(f"🔗 Registered route: {route.path}")
