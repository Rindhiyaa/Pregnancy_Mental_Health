"""
Test script to check reset password endpoint
"""
import requests
import json

# Test data
test_email = "test@example.com"
test_password = "newpassword123"

# Test reset password
url = "http://127.0.0.1:8000/api/reset-password"
payload = {
    "email": test_email,
    "new_password": test_password
}

print(f"Testing reset password with payload: {payload}")

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 400:
        print("\n400 Error - This usually means:")
        print("1. User doesn't exist in database")
        print("2. Email format is invalid")
        print("3. Password doesn't meet requirements")
        
except Exception as e:
    print(f"Error: {e}")