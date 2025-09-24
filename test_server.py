#!/usr/bin/env python3
"""
Test script to verify the server is working properly
"""
import requests
import time
import json

def test_server():
    base_url = "http://localhost:5000"
    
    print("Testing Zomato Analytics Server...")
    print("=" * 50)
    
    # Wait a moment for server to be ready
    time.sleep(2)
    
    try:
        # Test health endpoint
        print("1. Testing health endpoint...")
        response = requests.get(f"{base_url}/api/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            print(f"   ✓ Health check passed")
            print(f"   - Server running: {health_data.get('server_running', False)}")
            print(f"   - Data loaded: {health_data.get('data_loaded', False)}")
            print(f"   - CSV exists: {health_data.get('csv_file_exists', False)}")
            print(f"   - Restaurant count: {health_data.get('restaurant_count', 0)}")
        else:
            print(f"   ✗ Health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ✗ Connection error: {e}")
        return False
    
    try:
        # Test data endpoint
        print("\n2. Testing data endpoint...")
        response = requests.get(f"{base_url}/api/data", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Data endpoint working - {len(data)} restaurants returned")
        else:
            print(f"   ✗ Data endpoint failed: {response.status_code}")
            if response.headers.get('content-type', '').startswith('application/json'):
                error_data = response.json()
                print(f"   Error: {error_data}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ✗ Data endpoint error: {e}")
        return False
    
    try:
        # Test stats endpoint
        print("\n3. Testing stats endpoint...")
        response = requests.get(f"{base_url}/api/stats", timeout=10)
        if response.status_code == 200:
            stats = response.json()
            print(f"   ✓ Stats endpoint working")
            print(f"   - Total restaurants: {stats.get('total_restaurants', 0)}")
            print(f"   - Average rating: {stats.get('avg_rating', 0)}")
            print(f"   - Unique cities: {stats.get('unique_cities', 0)}")
        else:
            print(f"   ✗ Stats endpoint failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ✗ Stats endpoint error: {e}")
        return False
    
    print("\n✓ All tests passed! Server is working correctly.")
    return True

if __name__ == "__main__":
    success = test_server()
    if not success:
        print("\n✗ Server tests failed. Check the server logs for more details.")
        exit(1)
