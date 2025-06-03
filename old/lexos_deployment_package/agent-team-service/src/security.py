import torch
import torch.nn as nn
from typing import Dict, List, Optional, Tuple
import numpy as np
from datetime import datetime
import hashlib
import json
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import jwt
from passlib.context import CryptContext

class SecurityFramework:
    """Enhanced security and ethics framework."""
    def __init__(self, config: Dict):
        self.config = config
        self.encryption_key = self._generate_encryption_key()
        self.fernet = Fernet(self.encryption_key)
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.security_policies = self._load_security_policies()
        self.ethics_guidelines = self._load_ethics_guidelines()
        self.audit_log = []
        self.threat_detector = self._initialize_threat_detector()
        self.privacy_guard = self._initialize_privacy_guard()
        self.compliance_checker = self._initialize_compliance_checker()
        
    def _generate_encryption_key(self) -> bytes:
        """Generate encryption key."""
        salt = b'lexos_salt'  # In production, use a secure random salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.config["secret_key"].encode()))
        return key
        
    def _load_security_policies(self) -> Dict:
        """Load security policies."""
        return {
            "data_encryption": {
                "required": True,
                "algorithm": "AES-256-GCM",
                "key_rotation": "30d"
            },
            "access_control": {
                "required": True,
                "authentication": "JWT",
                "authorization": "RBAC"
            },
            "audit_logging": {
                "required": True,
                "retention": "365d",
                "fields": ["timestamp", "action", "user", "resource", "status"]
            },
            "threat_detection": {
                "required": True,
                "anomaly_detection": True,
                "rate_limiting": True
            }
        }
        
    def _load_ethics_guidelines(self) -> Dict:
        """Load ethics guidelines."""
        return {
            "privacy": {
                "data_minimization": True,
                "consent_required": True,
                "right_to_forget": True
            },
            "fairness": {
                "bias_detection": True,
                "equal_treatment": True,
                "transparency": True
            },
            "safety": {
                "harm_prevention": True,
                "risk_assessment": True,
                "safety_checks": True
            },
            "transparency": {
                "explainability": True,
                "auditability": True,
                "documentation": True
            }
        }
        
    def _initialize_threat_detector(self) -> nn.Module:
        """Initialize threat detection model."""
        class ThreatDetector(nn.Module):
            def __init__(self):
                super().__init__()
                self.encoder = nn.Sequential(
                    nn.Linear(100, 64),
                    nn.ReLU(),
                    nn.Linear(64, 32),
                    nn.ReLU()
                )
                self.classifier = nn.Sequential(
                    nn.Linear(32, 16),
                    nn.ReLU(),
                    nn.Linear(16, 1),
                    nn.Sigmoid()
                )
                
            def forward(self, x):
                x = self.encoder(x)
                return self.classifier(x)
                
        return ThreatDetector()
        
    def _initialize_privacy_guard(self) -> nn.Module:
        """Initialize privacy protection model."""
        class PrivacyGuard(nn.Module):
            def __init__(self):
                super().__init__()
                self.encoder = nn.Sequential(
                    nn.Linear(100, 64),
                    nn.ReLU(),
                    nn.Linear(64, 32),
                    nn.ReLU()
                )
                self.classifier = nn.Sequential(
                    nn.Linear(32, 16),
                    nn.ReLU(),
                    nn.Linear(16, 1),
                    nn.Sigmoid()
                )
                
            def forward(self, x):
                x = self.encoder(x)
                return self.classifier(x)
                
        return PrivacyGuard()
        
    def _initialize_compliance_checker(self) -> nn.Module:
        """Initialize compliance checking model."""
        class ComplianceChecker(nn.Module):
            def __init__(self):
                super().__init__()
                self.encoder = nn.Sequential(
                    nn.Linear(100, 64),
                    nn.ReLU(),
                    nn.Linear(64, 32),
                    nn.ReLU()
                )
                self.classifier = nn.Sequential(
                    nn.Linear(32, 16),
                    nn.ReLU(),
                    nn.Linear(16, 1),
                    nn.Sigmoid()
                )
                
            def forward(self, x):
                x = self.encoder(x)
                return self.classifier(x)
                
        return ComplianceChecker()
        
    async def validate_action(self, action: Dict) -> Dict:
        """Validate an action against security and ethics guidelines."""
        validation_result = {
            "is_valid": True,
            "security_checks": {},
            "ethics_checks": {},
            "recommendations": []
        }
        
        # Perform security checks
        security_checks = await self._perform_security_checks(action)
        validation_result["security_checks"] = security_checks
        if not security_checks["passed"]:
            validation_result["is_valid"] = False
            validation_result["recommendations"].extend(security_checks["recommendations"])
            
        # Perform ethics checks
        ethics_checks = await self._perform_ethics_checks(action)
        validation_result["ethics_checks"] = ethics_checks
        if not ethics_checks["passed"]:
            validation_result["is_valid"] = False
            validation_result["recommendations"].extend(ethics_checks["recommendations"])
            
        # Log validation result
        self._log_validation(validation_result)
        
        return validation_result
        
    async def _perform_security_checks(self, action: Dict) -> Dict:
        """Perform security checks on an action."""
        checks = {
            "passed": True,
            "threat_detection": False,
            "access_control": False,
            "data_protection": False,
            "recommendations": []
        }
        
        # Check for threats
        threat_score = await self._detect_threats(action)
        checks["threat_detection"] = threat_score < 0.5
        if not checks["threat_detection"]:
            checks["passed"] = False
            checks["recommendations"].append("Action may pose security threats")
            
        # Check access control
        access_control = await self._check_access_control(action)
        checks["access_control"] = access_control["allowed"]
        if not checks["access_control"]:
            checks["passed"] = False
            checks["recommendations"].append(access_control["reason"])
            
        # Check data protection
        data_protection = await self._check_data_protection(action)
        checks["data_protection"] = data_protection["protected"]
        if not checks["data_protection"]:
            checks["passed"] = False
            checks["recommendations"].append(data_protection["reason"])
            
        return checks
        
    async def _perform_ethics_checks(self, action: Dict) -> Dict:
        """Perform ethics checks on an action."""
        checks = {
            "passed": True,
            "privacy": False,
            "fairness": False,
            "safety": False,
            "transparency": False,
            "recommendations": []
        }
        
        # Check privacy
        privacy_check = await self._check_privacy(action)
        checks["privacy"] = privacy_check["compliant"]
        if not checks["privacy"]:
            checks["passed"] = False
            checks["recommendations"].append(privacy_check["reason"])
            
        # Check fairness
        fairness_check = await self._check_fairness(action)
        checks["fairness"] = fairness_check["fair"]
        if not checks["fairness"]:
            checks["passed"] = False
            checks["recommendations"].append(fairness_check["reason"])
            
        # Check safety
        safety_check = await self._check_safety(action)
        checks["safety"] = safety_check["safe"]
        if not checks["safety"]:
            checks["passed"] = False
            checks["recommendations"].append(safety_check["reason"])
            
        # Check transparency
        transparency_check = await self._check_transparency(action)
        checks["transparency"] = transparency_check["transparent"]
        if not checks["transparency"]:
            checks["passed"] = False
            checks["recommendations"].append(transparency_check["reason"])
            
        return checks
        
    async def _detect_threats(self, action: Dict) -> float:
        """Detect potential threats in an action."""
        # Convert action to feature vector
        features = self._action_to_features(action)
        
        # Get threat score
        with torch.no_grad():
            threat_score = self.threat_detector(features)
            
        return threat_score.item()
        
    async def _check_access_control(self, action: Dict) -> Dict:
        """Check if action is allowed by access control policies."""
        # Verify JWT token
        try:
            token = action.get("token")
            if not token:
                return {"allowed": False, "reason": "No authentication token provided"}
                
            payload = jwt.decode(
                token,
                self.config["jwt_secret"],
                algorithms=["HS256"]
            )
            
            # Check role-based access
            required_role = action.get("required_role")
            if required_role and required_role not in payload.get("roles", []):
                return {"allowed": False, "reason": "Insufficient permissions"}
                
            return {"allowed": True}
            
        except jwt.InvalidTokenError:
            return {"allowed": False, "reason": "Invalid authentication token"}
            
    async def _check_data_protection(self, action: Dict) -> Dict:
        """Check if data is properly protected."""
        # Check if sensitive data is encrypted
        sensitive_data = action.get("sensitive_data")
        if sensitive_data and not self._is_encrypted(sensitive_data):
            return {
                "protected": False,
                "reason": "Sensitive data must be encrypted"
            }
            
        # Check if data retention policies are followed
        if not self._check_retention_policies(action):
            return {
                "protected": False,
                "reason": "Data retention policies not followed"
            }
            
        return {"protected": True}
        
    async def _check_privacy(self, action: Dict) -> Dict:
        """Check if action complies with privacy guidelines."""
        # Check data minimization
        if not self._check_data_minimization(action):
            return {
                "compliant": False,
                "reason": "Data minimization principle not followed"
            }
            
        # Check consent
        if not self._check_consent(action):
            return {
                "compliant": False,
                "reason": "Required consent not obtained"
            }
            
        return {"compliant": True}
        
    async def _check_fairness(self, action: Dict) -> Dict:
        """Check if action is fair and unbiased."""
        # Check for bias
        bias_score = await self._detect_bias(action)
        if bias_score > 0.7:
            return {
                "fair": False,
                "reason": "Action may be biased"
            }
            
        # Check equal treatment
        if not self._check_equal_treatment(action):
            return {
                "fair": False,
                "reason": "Equal treatment principle not followed"
            }
            
        return {"fair": True}
        
    async def _check_safety(self, action: Dict) -> Dict:
        """Check if action is safe."""
        # Check for potential harm
        harm_score = await self._assess_potential_harm(action)
        if harm_score > 0.7:
            return {
                "safe": False,
                "reason": "Action may cause harm"
            }
            
        # Check risk level
        if not self._check_risk_level(action):
            return {
                "safe": False,
                "reason": "Risk level too high"
            }
            
        return {"safe": True}
        
    async def _check_transparency(self, action: Dict) -> Dict:
        """Check if action is transparent."""
        # Check explainability
        if not self._check_explainability(action):
            return {
                "transparent": False,
                "reason": "Action not explainable"
            }
            
        # Check auditability
        if not self._check_auditability(action):
            return {
                "transparent": False,
                "reason": "Action not auditable"
            }
            
        return {"transparent": True}
        
    def _action_to_features(self, action: Dict) -> torch.Tensor:
        """Convert action to feature vector."""
        # Extract relevant features
        features = []
        
        # Add action type
        features.extend(self._one_hot_encode(action.get("type", ""), self.config["action_types"]))
        
        # Add user role
        features.extend(self._one_hot_encode(action.get("user_role", ""), self.config["user_roles"]))
        
        # Add resource type
        features.extend(self._one_hot_encode(action.get("resource_type", ""), self.config["resource_types"]))
        
        # Add time features
        features.extend(self._extract_time_features(action.get("timestamp", datetime.now())))
        
        # Add other relevant features
        features.extend(self._extract_other_features(action))
        
        return torch.tensor(features, dtype=torch.float32)
        
    def _one_hot_encode(self, value: str, categories: List[str]) -> List[float]:
        """One-hot encode a categorical value."""
        encoding = [0.0] * len(categories)
        if value in categories:
            encoding[categories.index(value)] = 1.0
        return encoding
        
    def _extract_time_features(self, timestamp: datetime) -> List[float]:
        """Extract time-based features."""
        return [
            timestamp.hour / 24.0,  # Hour of day
            timestamp.weekday() / 6.0,  # Day of week
            timestamp.month / 12.0,  # Month
            timestamp.day / 31.0  # Day of month
        ]
        
    def _extract_other_features(self, action: Dict) -> List[float]:
        """Extract other relevant features."""
        features = []
        
        # Add feature for sensitive data presence
        features.append(1.0 if action.get("sensitive_data") else 0.0)
        
        # Add feature for authentication method
        features.append(1.0 if action.get("token") else 0.0)
        
        # Add feature for action complexity
        features.append(len(str(action)) / 1000.0)  # Normalized by 1000
        
        return features
        
    def _is_encrypted(self, data: str) -> bool:
        """Check if data is encrypted."""
        try:
            # Try to decrypt
            self.fernet.decrypt(data.encode())
            return True
        except:
            return False
            
    def _check_retention_policies(self, action: Dict) -> bool:
        """Check if data retention policies are followed."""
        # Get retention period
        retention_period = self.security_policies["audit_logging"]["retention"]
        
        # Parse retention period
        days = int(retention_period[:-1])
        
        # Check if data is within retention period
        timestamp = action.get("timestamp", datetime.now())
        age = (datetime.now() - timestamp).days
        
        return age <= days
        
    def _check_data_minimization(self, action: Dict) -> bool:
        """Check if data minimization principle is followed."""
        # Get required data fields
        required_fields = self.ethics_guidelines["privacy"]["required_fields"]
        
        # Check if only required fields are present
        data_fields = set(action.get("data", {}).keys())
        return data_fields.issubset(required_fields)
        
    def _check_consent(self, action: Dict) -> bool:
        """Check if required consent is obtained."""
        # Get consent requirements
        consent_required = self.ethics_guidelines["privacy"]["consent_required"]
        
        if not consent_required:
            return True
            
        # Check if consent is present
        return bool(action.get("consent"))
        
    async def _detect_bias(self, action: Dict) -> float:
        """Detect bias in an action."""
        # Convert action to feature vector
        features = self._action_to_features(action)
        
        # Get bias score
        with torch.no_grad():
            bias_score = self.privacy_guard(features)
            
        return bias_score.item()
        
    def _check_equal_treatment(self, action: Dict) -> bool:
        """Check if equal treatment principle is followed."""
        # Get protected attributes
        protected_attributes = self.ethics_guidelines["fairness"]["protected_attributes"]
        
        # Check if protected attributes are used in decision making
        decision_factors = action.get("decision_factors", [])
        return not any(attr in decision_factors for attr in protected_attributes)
        
    async def _assess_potential_harm(self, action: Dict) -> float:
        """Assess potential harm from an action."""
        # Convert action to feature vector
        features = self._action_to_features(action)
        
        # Get harm score
        with torch.no_grad():
            harm_score = self.compliance_checker(features)
            
        return harm_score.item()
        
    def _check_risk_level(self, action: Dict) -> bool:
        """Check if risk level is acceptable."""
        # Get risk threshold
        risk_threshold = self.ethics_guidelines["safety"]["risk_threshold"]
        
        # Calculate risk level
        risk_level = self._calculate_risk_level(action)
        
        return risk_level <= risk_threshold
        
    def _calculate_risk_level(self, action: Dict) -> float:
        """Calculate risk level of an action."""
        # Get risk factors
        risk_factors = self.ethics_guidelines["safety"]["risk_factors"]
        
        # Calculate risk score
        risk_score = 0.0
        for factor, weight in risk_factors.items():
            if factor in action:
                risk_score += weight
                
        return risk_score
        
    def _check_explainability(self, action: Dict) -> bool:
        """Check if action is explainable."""
        # Check if explanation is provided
        if not action.get("explanation"):
            return False
            
        # Check if explanation is sufficient
        explanation_length = len(action["explanation"])
        return explanation_length >= self.ethics_guidelines["transparency"]["min_explanation_length"]
        
    def _check_auditability(self, action: Dict) -> bool:
        """Check if action is auditable."""
        # Check if audit trail is maintained
        if not action.get("audit_trail"):
            return False
            
        # Check if audit trail is complete
        required_fields = self.ethics_guidelines["transparency"]["audit_fields"]
        audit_fields = set(action["audit_trail"].keys())
        
        return audit_fields.issuperset(required_fields)
        
    def _log_validation(self, validation_result: Dict):
        """Log validation result."""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "validation_result": validation_result
        }
        
        self.audit_log.append(log_entry)
        
        # Trim audit log if needed
        max_log_size = self.security_policies["audit_logging"]["max_size"]
        if len(self.audit_log) > max_log_size:
            self.audit_log = self.audit_log[-max_log_size:] 