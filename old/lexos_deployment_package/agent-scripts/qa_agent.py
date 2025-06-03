#!/usr/bin/env python3
# QA Agent for LexOS
# This script provides automated testing and validation for the LexOS system

import os
import sys
import json
import logging
import asyncio
import aiohttp
import pytest
from typing import Dict, Any, List
from datetime import datetime
from base_agent import BaseAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("/app/qa_agent.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class QAAgent(BaseAgent):
    def __init__(self):
        super().__init__("qa")
        self.test_results = {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "skipped": 0
        }

    async def _execute_task_impl(self, task_type: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute QA-specific tasks"""
        if task_type == "run_tests":
            return await self._run_tests(task_data)
        elif task_type == "analyze_coverage":
            return await self._analyze_coverage(task_data)
        elif task_type == "performance_test":
            return await self._run_performance_test(task_data)
        elif task_type == "security_scan":
            return await self._run_security_scan(task_data)
        elif task_type == "load_test":
            return await self._run_load_test(task_data)
        else:
            raise ValueError(f"Unknown task type: {task_type}")

    async def _run_tests(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run automated tests"""
        try:
            test_path = task_data.get("test_path", "tests")
            test_type = task_data.get("test_type", "all")
            
            # Configure pytest arguments
            pytest_args = [
                test_path,
                "-v",
                "--json-report",
                "--json-report-file=none"
            ]
            
            if test_type == "unit":
                pytest_args.append("-m unit")
            elif test_type == "integration":
                pytest_args.append("-m integration")
            elif test_type == "e2e":
                pytest_args.append("-m e2e")
            
            # Run tests
            result = pytest.main(pytest_args)
            
            # Parse results
            with open(".report.json") as f:
                report = json.load(f)
            
            test_results = {
                "status": "success" if result == 0 else "failure",
                "timestamp": datetime.utcnow().isoformat(),
                "summary": {
                    "total": report["summary"]["total"],
                    "passed": report["summary"]["passed"],
                    "failed": report["summary"]["failed"],
                    "skipped": report["summary"]["skipped"]
                },
                "duration": report["summary"]["duration"],
                "tests": report["tests"]
            }
            
            # Update metrics
            self.test_results = test_results["summary"]
            
            return test_results
        except Exception as e:
            logger.error(f"Error running tests: {str(e)}")
            raise

    async def _analyze_coverage(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze code coverage"""
        try:
            test_path = task_data.get("test_path", "tests")
            source_path = task_data.get("source_path", "src")
            
            # Run coverage analysis
            pytest_args = [
                test_path,
                f"--cov={source_path}",
                "--cov-report=json",
                "--cov-report=term-missing"
            ]
            
            result = pytest.main(pytest_args)
            
            # Parse coverage report
            with open("coverage.json") as f:
                coverage = json.load(f)
            
            return {
                "status": "success" if result == 0 else "failure",
                "timestamp": datetime.utcnow().isoformat(),
                "coverage": {
                    "total": coverage["totals"]["percent_covered"],
                    "missing_lines": coverage["totals"]["missing_lines"],
                    "files": {
                        file: data["summary"]["percent_covered"]
                        for file, data in coverage["files"].items()
                    }
                }
            }
        except Exception as e:
            logger.error(f"Error analyzing coverage: {str(e)}")
            raise

    async def _run_performance_test(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run performance tests"""
        try:
            endpoint = task_data["endpoint"]
            duration = task_data.get("duration", 60)
            concurrency = task_data.get("concurrency", 10)
            
            async def make_request():
                async with self.session.get(endpoint) as response:
                    return {
                        "status": response.status,
                        "duration": response.elapsed.total_seconds()
                    }
            
            # Run concurrent requests
            start_time = datetime.utcnow()
            results = []
            
            while (datetime.utcnow() - start_time).total_seconds() < duration:
                tasks = [make_request() for _ in range(concurrency)]
                batch_results = await asyncio.gather(*tasks)
                results.extend(batch_results)
            
            # Analyze results
            durations = [r["duration"] for r in results]
            status_codes = [r["status"] for r in results]
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "summary": {
                    "total_requests": len(results),
                    "successful_requests": sum(1 for s in status_codes if 200 <= s < 300),
                    "failed_requests": sum(1 for s in status_codes if s >= 400),
                    "avg_response_time": sum(durations) / len(durations),
                    "min_response_time": min(durations),
                    "max_response_time": max(durations),
                    "p95_response_time": sorted(durations)[int(len(durations) * 0.95)]
                }
            }
        except Exception as e:
            logger.error(f"Error running performance test: {str(e)}")
            raise

    async def _run_security_scan(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run security vulnerability scan"""
        try:
            target = task_data["target"]
            scan_type = task_data.get("scan_type", "full")
            
            # Simulate security scan
            vulnerabilities = [
                {
                    "severity": "high",
                    "type": "SQL Injection",
                    "location": "api/users.py:45",
                    "description": "Potential SQL injection vulnerability in user input"
                },
                {
                    "severity": "medium",
                    "type": "XSS",
                    "location": "web/templates/user.html:12",
                    "description": "Unescaped user input in template"
                }
            ]
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "scan_type": scan_type,
                "target": target,
                "vulnerabilities": vulnerabilities,
                "summary": {
                    "total": len(vulnerabilities),
                    "high": sum(1 for v in vulnerabilities if v["severity"] == "high"),
                    "medium": sum(1 for v in vulnerabilities if v["severity"] == "medium"),
                    "low": sum(1 for v in vulnerabilities if v["severity"] == "low")
                }
            }
        except Exception as e:
            logger.error(f"Error running security scan: {str(e)}")
            raise

    async def _run_load_test(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run load testing"""
        try:
            endpoint = task_data["endpoint"]
            users = task_data.get("users", 100)
            ramp_up_time = task_data.get("ramp_up_time", 60)
            duration = task_data.get("duration", 300)
            
            async def simulate_user(user_id: int):
                start_time = datetime.utcnow()
                requests = 0
                errors = 0
                total_duration = 0
                
                while (datetime.utcnow() - start_time).total_seconds() < duration:
                    try:
                        async with self.session.get(endpoint) as response:
                            requests += 1
                            total_duration += response.elapsed.total_seconds()
                            if response.status >= 400:
                                errors += 1
                    except Exception:
                        errors += 1
                    
                    await asyncio.sleep(1)  # Simulate user think time
                
                return {
                    "requests": requests,
                    "errors": errors,
                    "avg_duration": total_duration / requests if requests > 0 else 0
                }
            
            # Ramp up users gradually
            user_results = []
            for i in range(users):
                user_results.append(await simulate_user(i))
                await asyncio.sleep(ramp_up_time / users)
            
            # Aggregate results
            total_requests = sum(r["requests"] for r in user_results)
            total_errors = sum(r["errors"] for r in user_results)
            avg_duration = sum(r["avg_duration"] for r in user_results) / len(user_results)
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "summary": {
                    "total_users": users,
                    "total_requests": total_requests,
                    "total_errors": total_errors,
                    "error_rate": total_errors / total_requests if total_requests > 0 else 0,
                    "avg_response_time": avg_duration,
                    "requests_per_second": total_requests / duration
                }
            }
        except Exception as e:
            logger.error(f"Error running load test: {str(e)}")
            raise

async def main():
    """Main entry point for the QA agent"""
    agent = QAAgent()
    try:
        await agent.start()
        
        # Keep the agent running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down QA agent...")
    finally:
        await agent.stop()

if __name__ == "__main__":
    asyncio.run(main())
