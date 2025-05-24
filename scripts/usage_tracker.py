import anthropic
import json
from datetime import datetime
import os
from pathlib import Path

class UsageTracker:
    def __init__(self, log_file="ai_usage.json"):
        self.client = anthropic.Anthropic()
        self.log_file = log_file
        self.ensure_log_file_exists()

    def ensure_log_file_exists(self):
        """Ensure the log file exists and has proper permissions."""
        log_path = Path(self.log_file)
        if not log_path.exists():
            log_path.parent.mkdir(parents=True, exist_ok=True)
            with open(log_path, 'w') as f:
                json.dump([], f)

    def track_usage(self, requests=1, tokens=0, cost=0.0):
        """
        Track API usage metrics.
        
        Args:
            requests (int): Number of API requests made
            tokens (int): Number of tokens used
            cost (float): Cost in USD
        """
        usage_log = {
            "timestamp": datetime.now().isoformat(),
            "requests": requests,
            "tokens": tokens,
            "cost": cost
        }
        
        try:
            # Read existing logs
            with open(self.log_file, "r") as f:
                try:
                    logs = json.load(f)
                except json.JSONDecodeError:
                    logs = []
            
            # Append new log
            logs.append(usage_log)
            
            # Write back all logs
            with open(self.log_file, "w") as f:
                json.dump(logs, f, indent=2)
                
        except Exception as e:
            print(f"Error writing to log file: {e}")
            # Fallback to append mode if JSON structure is corrupted
            with open(self.log_file, "a") as f:
                f.write(json.dumps(usage_log) + "\n")

    def get_usage_summary(self):
        """Get summary of usage metrics."""
        try:
            with open(self.log_file, "r") as f:
                logs = json.load(f)
                
            total_requests = sum(log["requests"] for log in logs)
            total_tokens = sum(log["tokens"] for log in logs)
            total_cost = sum(log["cost"] for log in logs)
            
            return {
                "total_requests": total_requests,
                "total_tokens": total_tokens,
                "total_cost": total_cost,
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error reading usage summary: {e}")
            return None

def main():
    tracker = UsageTracker()
    # Example usage
    tracker.track_usage(requests=1, tokens=100, cost=0.001)
    summary = tracker.get_usage_summary()
    if summary:
        print("Usage Summary:")
        print(f"Total Requests: {summary['total_requests']}")
        print(f"Total Tokens: {summary['total_tokens']}")
        print(f"Total Cost: ${summary['total_cost']:.4f}")
        print(f"Last Updated: {summary['last_updated']}")

if __name__ == "__main__":
    main() 