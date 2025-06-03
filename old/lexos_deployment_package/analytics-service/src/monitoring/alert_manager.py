import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from typing import Dict, List, Optional
import structlog
from datetime import datetime
import json

logger = structlog.get_logger()

class AlertManager:
    def __init__(self, config: Dict):
        self.config = config
        self.alert_history = []
        self.alert_thresholds = config.get('alerting', {}).get('thresholds', {})
        self.email_config = config.get('alerting', {}).get('email', {})
        self.slack_config = config.get('alerting', {}).get('slack', {})
        
    async def check_metrics(self, metrics: Dict) -> List[Dict]:
        """
        Check metrics against thresholds and generate alerts if needed.
        
        Args:
            metrics: Dictionary containing system and model metrics
            
        Returns:
            List of generated alerts
        """
        try:
            alerts = []
            
            # Check system metrics
            if 'system' in metrics:
                system_alerts = await self._check_system_metrics(metrics['system'])
                alerts.extend(system_alerts)
                
            # Check model metrics
            if 'models' in metrics:
                model_alerts = await self._check_model_metrics(metrics['models'])
                alerts.extend(model_alerts)
                
            # Process and send alerts
            if alerts:
                await self._process_alerts(alerts)
                
            return alerts
            
        except Exception as e:
            logger.error("metrics_check_error", error=str(e))
            raise
            
    async def _check_system_metrics(self, system_metrics: Dict) -> List[Dict]:
        """Check system metrics against thresholds."""
        alerts = []
        
        # Check CPU usage
        if system_metrics['cpu']['usage_percent'] > self.alert_thresholds.get('cpu_usage', 90):
            alerts.append({
                'type': 'system',
                'severity': 'high',
                'message': f"High CPU usage: {system_metrics['cpu']['usage_percent']}%",
                'timestamp': datetime.now().isoformat()
            })
            
        # Check memory usage
        if system_metrics['memory']['percent'] > self.alert_thresholds.get('memory_usage', 85):
            alerts.append({
                'type': 'system',
                'severity': 'high',
                'message': f"High memory usage: {system_metrics['memory']['percent']}%",
                'timestamp': datetime.now().isoformat()
            })
            
        # Check disk usage
        if system_metrics['disk']['percent'] > self.alert_thresholds.get('disk_usage', 90):
            alerts.append({
                'type': 'system',
                'severity': 'high',
                'message': f"High disk usage: {system_metrics['disk']['percent']}%",
                'timestamp': datetime.now().isoformat()
            })
            
        # Check GPU metrics if available
        if 'gpu' in system_metrics:
            for gpu in system_metrics['gpu']:
                if gpu['load'] > self.alert_thresholds.get('gpu_usage', 95):
                    alerts.append({
                        'type': 'system',
                        'severity': 'high',
                        'message': f"High GPU usage on {gpu['name']}: {gpu['load']}%",
                        'timestamp': datetime.now().isoformat()
                    })
                    
                if gpu['temperature'] > self.alert_thresholds.get('gpu_temperature', 85):
                    alerts.append({
                        'type': 'system',
                        'severity': 'critical',
                        'message': f"High GPU temperature on {gpu['name']}: {gpu['temperature']}°C",
                        'timestamp': datetime.now().isoformat()
                    })
                    
        return alerts
        
    async def _check_model_metrics(self, model_metrics: Dict) -> List[Dict]:
        """Check model metrics against thresholds."""
        alerts = []
        
        for model_id, metrics in model_metrics.items():
            # Check model accuracy
            if metrics.get('accuracy', 1.0) < self.alert_thresholds.get('model_accuracy', 0.7):
                alerts.append({
                    'type': 'model',
                    'severity': 'medium',
                    'message': f"Low model accuracy for {model_id}: {metrics['accuracy']}",
                    'timestamp': datetime.now().isoformat()
                })
                
            # Check prediction latency
            if metrics.get('latency', 0) > self.alert_thresholds.get('prediction_latency', 1.0):
                alerts.append({
                    'type': 'model',
                    'severity': 'medium',
                    'message': f"High prediction latency for {model_id}: {metrics['latency']}s",
                    'timestamp': datetime.now().isoformat()
                })
                
        return alerts
        
    async def _process_alerts(self, alerts: List[Dict]) -> None:
        """Process and send alerts through configured channels."""
        try:
            for alert in alerts:
                # Add to alert history
                self.alert_history.append(alert)
                
                # Send email alert
                if self.email_config:
                    await self._send_email_alert(alert)
                    
                # Send Slack alert
                if self.slack_config:
                    await self._send_slack_alert(alert)
                    
                # Log alert
                logger.warning("alert_generated",
                             alert_type=alert['type'],
                             severity=alert['severity'],
                             message=alert['message'])
                             
        except Exception as e:
            logger.error("alert_processing_error", error=str(e))
            raise
            
    async def _send_email_alert(self, alert: Dict) -> None:
        """Send alert via email."""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_config['from']
            msg['To'] = self.email_config['to']
            msg['Subject'] = f"LexOS Alert: {alert['type']} - {alert['severity']}"
            
            body = f"""
            Alert Type: {alert['type']}
            Severity: {alert['severity']}
            Message: {alert['message']}
            Timestamp: {alert['timestamp']}
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(self.email_config['smtp_server'],
                            self.email_config['smtp_port']) as server:
                server.starttls()
                server.login(self.email_config['username'],
                           self.email_config['password'])
                server.send_message(msg)
                
        except Exception as e:
            logger.error("email_alert_error", error=str(e))
            raise
            
    async def _send_slack_alert(self, alert: Dict) -> None:
        """Send alert via Slack."""
        try:
            message = {
                'text': f"*LexOS Alert*\n"
                       f"Type: {alert['type']}\n"
                       f"Severity: {alert['severity']}\n"
                       f"Message: {alert['message']}\n"
                       f"Timestamp: {alert['timestamp']}"
            }
            
            response = requests.post(
                self.slack_config['webhook_url'],
                json=message
            )
            response.raise_for_status()
            
        except Exception as e:
            logger.error("slack_alert_error", error=str(e))
            raise
            
    async def get_alert_history(self,
                              alert_type: Optional[str] = None,
                              severity: Optional[str] = None,
                              limit: int = 100) -> List[Dict]:
        """
        Get alert history with optional filtering.
        
        Args:
            alert_type: Filter by alert type
            severity: Filter by severity level
            limit: Maximum number of alerts to return
            
        Returns:
            List of filtered alerts
        """
        try:
            filtered_alerts = self.alert_history
            
            if alert_type:
                filtered_alerts = [a for a in filtered_alerts if a['type'] == alert_type]
                
            if severity:
                filtered_alerts = [a for a in filtered_alerts if a['severity'] == severity]
                
            return filtered_alerts[-limit:]
            
        except Exception as e:
            logger.error("alert_history_error", error=str(e))
            raise 