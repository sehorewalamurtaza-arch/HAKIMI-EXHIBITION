#!/usr/bin/env python3
"""
Backend API Testing for Badshah-Hakimi POS System
Testing the updated backend APIs for POS system validation
"""

import requests
import json
from datetime import datetime
import sys

# Configuration
BASE_URL = "https://luxury-platform.preview.emergentagent.com/api"
TEST_USERNAME = "admin"
TEST_PASSWORD = "admin123"

class POSAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.headers = {"Content-Type": "application/json"}
        
    def authenticate(self):
        """Authenticate and get JWT token"""
        print("🔐 Testing Authentication...")
        
        login_data = {
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=login_data)
            print(f"Login Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.headers["Authorization"] = f"Bearer {self.token}"
                print(f"✅ Authentication successful for user: {data['user']['username']}")
                print(f"   Role: {data['user']['role']}")
                return True
            else:
                print(f"❌ Authentication failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False
    
    def test_exhibitions_api(self):
        """Test GET /exhibitions - should return sample active exhibitions"""
        print("\n🏛️ Testing Exhibitions API...")
        
        try:
            response = requests.get(f"{self.base_url}/exhibitions", headers=self.headers)
            print(f"Exhibitions API Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Exhibitions API working - Found {len(data)} exhibitions")
                
                for exhibition in data:
                    print(f"   - {exhibition['name']} ({exhibition['status']}) at {exhibition['location']}")
                    
                # Check if we have active exhibitions
                active_exhibitions = [ex for ex in data if ex['status'] == 'active']
                if active_exhibitions:
                    print(f"✅ Found {len(active_exhibitions)} active exhibitions")
                    return True, data
                else:
                    print("⚠️ No active exhibitions found")
                    return True, data
                    
            else:
                print(f"❌ Exhibitions API failed: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Exhibitions API error: {str(e)}")
            return False, None
    
    def test_categories_api(self):
        """Test GET /categories - should return sample product categories"""
        print("\n📂 Testing Categories API...")
        
        try:
            response = requests.get(f"{self.base_url}/categories", headers=self.headers)
            print(f"Categories API Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Categories API working - Found {len(data)} categories")
                
                for category in data:
                    print(f"   - {category['name']}: {category.get('description', 'No description')}")
                    
                return True, data
            else:
                print(f"❌ Categories API failed: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Categories API error: {str(e)}")
            return False, None
    
    def test_inventory_api(self, exhibition_id="1"):
        """Test GET /inventory/exhibition/{id} - should return sample inventory items"""
        print(f"\n📦 Testing Inventory API for exhibition {exhibition_id}...")
        
        try:
            response = requests.get(f"{self.base_url}/inventory/exhibition/{exhibition_id}", headers=self.headers)
            print(f"Inventory API Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Inventory API working - Found {len(data)} inventory items")
                
                available_items = 0
                for item in data:
                    remaining = item['remaining_quantity']
                    print(f"   - {item['product_name']}: ${item['product_price']} (Remaining: {remaining})")
                    if remaining > 0:
                        available_items += 1
                
                print(f"✅ Found {available_items} items with remaining_quantity > 0")
                return True, data
            else:
                print(f"❌ Inventory API failed: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Inventory API error: {str(e)}")
            return False, None
    
    def test_enhanced_sales_api(self, exhibition_id="1"):
        """Test POST /sales/enhanced - test multi-payment sales functionality"""
        print(f"\n💰 Testing Enhanced Sales API...")
        
        # Sample sale data with multi-payment
        sale_data = {
            "exhibition_id": exhibition_id,
            "customer_name": "Ahmed Al-Rashid",
            "customer_phone": "+971501234567",
            "customer_email": "ahmed@example.com",
            "items": [
                {
                    "product_id": "1",
                    "quantity": 2,
                    "price": 150.0
                },
                {
                    "product_id": "2", 
                    "quantity": 1,
                    "price": 85.0
                }
            ],
            "payments": [
                {
                    "type": "cash",
                    "amount": 200.0
                },
                {
                    "type": "card",
                    "amount": 185.0
                }
            ]
        }
        
        try:
            response = requests.post(f"{self.base_url}/sales/enhanced", json=sale_data, headers=self.headers)
            print(f"Enhanced Sales API Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Enhanced Sales API working")
                print(f"   Sale Number: {data['sale_number']}")
                print(f"   Total Amount: ${data['total_amount']}")
                print(f"   Change Given: ${data['change_given']}")
                print(f"   Sale ID: {data['id']}")
                
                # Verify multi-payment support
                total_payment = sum(p['amount'] for p in sale_data['payments'])
                print(f"   Multi-payment total: ${total_payment}")
                
                return True, data
            else:
                print(f"❌ Enhanced Sales API failed: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Enhanced Sales API error: {str(e)}")
            return False, None
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting POS System API Tests")
        print("=" * 50)
        
        results = {
            "authentication": False,
            "exhibitions": False,
            "categories": False,
            "inventory": False,
            "enhanced_sales": False
        }
        
        # Test authentication first
        if not self.authenticate():
            print("\n❌ Cannot proceed without authentication")
            return results
        
        results["authentication"] = True
        
        # Test exhibitions API
        success, data = self.test_exhibitions_api()
        results["exhibitions"] = success
        
        # Test categories API
        success, data = self.test_categories_api()
        results["categories"] = success
        
        # Test inventory API
        success, data = self.test_inventory_api()
        results["inventory"] = success
        
        # Test enhanced sales API
        success, data = self.test_enhanced_sales_api()
        results["enhanced_sales"] = success
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 50)
        
        for test_name, passed in results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{test_name.upper()}: {status}")
        
        total_tests = len(results)
        passed_tests = sum(results.values())
        print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
        
        return results

if __name__ == "__main__":
    tester = POSAPITester()
    results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    if not all(results.values()):
        sys.exit(1)
    else:
        print("\n🎉 All tests passed!")
        sys.exit(0)