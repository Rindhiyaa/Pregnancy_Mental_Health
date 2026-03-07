# backend/app/rate_limiter.py
from fastapi import Request, HTTPException, status
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from typing import Dict, Tuple
import asyncio

# ⚠️ WARNING: In-memory rate limiting only works with single-worker deployments.
# For multi-worker production (gunicorn -w 4), use Redis-based rate limiting.
# This implementation will NOT share state across multiple workers!

class RateLimiter:
    """
    Simple in-memory rate limiter
    For production, use Redis-based rate limiting
    """
    def __init__(self):
        # Store: {ip: [(timestamp, endpoint), ...]}
        self.requests: Dict[str, list] = defaultdict(list)
        self.lock = asyncio.Lock()
        
        # Rate limits: (max_requests, time_window_seconds)
        self.limits = {
            "/api/login": (5, 300),  # 5 attempts per 5 minutes
            "/api/signup": (3, 3600),  # 3 signups per hour
            "/api/forgot-password": (3, 3600),  # 3 attempts per hour
            "/api/reset-password": (3, 3600),  # 3 resets per hour
            "default": (100, 60),  # 100 requests per minute for other endpoints
        }
    
    async def check_rate_limit(self, request: Request):
        """
        Check if request exceeds rate limit
        Raises HTTPException if limit exceeded
        """
        client_ip = request.client.host
        endpoint = request.url.path
        
        # Get rate limit for this endpoint
        max_requests, window_seconds = self.limits.get(endpoint, self.limits["default"])
        
        async with self.lock:
            now = datetime.now(timezone.utc)
            cutoff = now - timedelta(seconds=window_seconds)
            
            # Clean old requests
            self.requests[client_ip] = [
                (ts, ep) for ts, ep in self.requests[client_ip]
                if ts > cutoff
            ]
            
            # Count requests to this endpoint in time window
            endpoint_requests = [
                ts for ts, ep in self.requests[client_ip]
                if ep == endpoint
            ]
            
            if len(endpoint_requests) >= max_requests:
                retry_after = int((endpoint_requests[0] - cutoff).total_seconds())
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)}
                )
            
            # Add current request
            self.requests[client_ip].append((now, endpoint))
    
    async def cleanup_old_entries(self):
        """
        Periodic cleanup of old entries (run as background task)
        """
        while True:
            await asyncio.sleep(3600)  # Clean every hour
            async with self.lock:
                now = datetime.now(timezone.utc)
                cutoff = now - timedelta(hours=2)
                
                # Remove IPs with no recent requests
                ips_to_remove = []
                for ip, requests in self.requests.items():
                    self.requests[ip] = [(ts, ep) for ts, ep in requests if ts > cutoff]
                    if not self.requests[ip]:
                        ips_to_remove.append(ip)
                
                for ip in ips_to_remove:
                    del self.requests[ip]


# Global rate limiter instance
rate_limiter = RateLimiter()
