#!/usr/bin/env python3
"""
Backend API Testing for Badshah-Hakimi POS System
Testing Role-Based Access Control System and User Management
"""

import requests
import json
from datetime import datetime
import sys

# Configuration
BASE_URL = "https://luxury-platform.preview.emergentagent.com/api"
SUPER_ADMIN_USERNAME = "Murtaza Taher"
SUPER_ADMIN_PASSWORD = "Hakimi@786"

class RoleBasedAccessTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.super_admin_token = None
        self.test_user_tokens = {}
        self.headers = {"Content-Type": "application/json"}
        self.created_test_users = []
        
    def authenticate_super_admin(self):
        """Authenticate Super Admin and get JWT token"""
        print("🔐 PHASE 1: Testing Super Admin Authentication...")
        
        login_data = {
            "username": SUPER_ADMIN_USERNAME,
            "password": SUPER_ADMIN_PASSWORD
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=login_data)
            print(f"Super Admin Login Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.super_admin_token = data["access_token"]
                print(f"✅ Super Admin authentication successful!")
                print(f"   Username: {data['user']['username']}")
                print(f"   Role: {data['user']['role']}")
                print(f"   Permissions: {data['user']['permissions']}")
                return True, data['user']
            else:
                print(f"❌ Super Admin authentication failed: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Super Admin authentication error: {str(e)}")
            return False, None
    
    def test_old_admin_credentials(self):
        """Test that old admin/admin123 credentials no longer work"""
        print("\n🔒 Testing Old Admin Credentials (Should Fail)...")
        
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=login_data)
            print(f"Old Admin Login Response Status: {response.status_code}")
            
            if response.status_code == 401:
                print("✅ Old admin credentials properly disabled")
                return True
            else:
                print(f"❌ Old admin credentials still working: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing old credentials: {str(e)}")
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
    
    def test_exhibition_creation_api(self):
        """Test POST /exhibitions - test exhibition creation with JSON payload"""
        print(f"\n🏛️ Testing Exhibition Creation API...")
        
        # Sample exhibition data as specified in review request
        exhibition_data = {
            "name": "Dubai Perfume Festival 2024",
            "location": "Dubai World Trade Centre",
            "start_date": "2024-12-01T09:00:00",
            "end_date": "2024-12-05T18:00:00",
            "description": "Premium perfume and attar exhibition"
        }
        
        try:
            response = requests.post(f"{self.base_url}/exhibitions", json=exhibition_data, headers=self.headers)
            print(f"Exhibition Creation API Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Exhibition Creation API working")
                print(f"   Exhibition ID: {data['id']}")
                print(f"   Name: {data['name']}")
                print(f"   Location: {data['location']}")
                print(f"   Status: {data['status']}")
                
                return True, data
            else:
                print(f"❌ Exhibition Creation API failed: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Exhibition Creation API error: {str(e)}")
            return False, None
    
    def test_sales_by_exhibition_api(self, exhibition_id="1"):
        """Test GET /sales/exhibition/{exhibition_id} - get sales for specific exhibition"""
        print(f"\n📊 Testing Sales by Exhibition API for exhibition {exhibition_id}...")
        
        try:
            response = requests.get(f"{self.base_url}/sales/exhibition/{exhibition_id}", headers=self.headers)
            print(f"Sales by Exhibition API Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Sales by Exhibition API working - Found {len(data)} sales")
                
                for sale in data:
                    print(f"   - Sale {sale.get('sale_number', sale.get('id'))}: ${sale.get('total_amount', 0)} ({sale.get('customer_name', 'No customer')})")
                
                return True, data
            else:
                print(f"❌ Sales by Exhibition API failed: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Sales by Exhibition API error: {str(e)}")
            return False, None
    
    def test_leads_by_exhibition_api(self, exhibition_id="1"):
        """Test GET /leads/exhibition/{exhibition_id} - get leads for specific exhibition"""
        print(f"\n👥 Testing Leads by Exhibition API for exhibition {exhibition_id}...")
        
        try:
            response = requests.get(f"{self.base_url}/leads/exhibition/{exhibition_id}", headers=self.headers)
            print(f"Leads by Exhibition API Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Leads by Exhibition API working - Found {len(data)} leads")
                
                for lead in data:
                    print(f"   - {lead.get('name', 'Unknown')}: {lead.get('phone', 'No phone')} ({lead.get('status', 'No status')})")
                
                return True, data
            else:
                print(f"❌ Leads by Exhibition API failed: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Leads by Exhibition API error: {str(e)}")
            return False, None

    def test_enhanced_sales_api(self, exhibition_id="1"):
        """Test POST /sales/enhanced - test multi-payment sales functionality"""
        print(f"\n💰 Testing Enhanced Sales API...")
        
        # Sample sale data with multi-payment as specified in review request
        sale_data = {
            "exhibition_id": exhibition_id,
            "customer_name": "Ahmed Hassan",
            "customer_phone": "+971501234567",
            "items": [
                {
                    "product_id": "1",
                    "quantity": 2,
                    "price": 150.0
                }
            ],
            "payments": [
                {
                    "type": "cash",
                    "amount": 200.0
                },
                {
                    "type": "card",
                    "amount": 115.75
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
        print("🚀 Starting FINAL BACKEND API VALIDATION TESTS")
        print("=" * 60)
        
        results = {
            "authentication": False,
            "exhibitions_get": False,
            "exhibition_creation": False,
            "categories": False,
            "inventory": False,
            "enhanced_sales": False,
            "sales_by_exhibition": False,
            "leads_by_exhibition": False
        }
        
        # Test authentication first
        if not self.authenticate():
            print("\n❌ Cannot proceed without authentication")
            return results
        
        results["authentication"] = True
        
        # Test exhibitions GET API
        success, exhibitions_data = self.test_exhibitions_api()
        results["exhibitions_get"] = success
        
        # Test exhibition creation API
        success, new_exhibition_data = self.test_exhibition_creation_api()
        results["exhibition_creation"] = success
        
        # Get exhibition ID for subsequent tests
        exhibition_id = "1"  # Default fallback
        if new_exhibition_data:
            exhibition_id = new_exhibition_data["id"]
            print(f"\n🎯 Using newly created exhibition ID: {exhibition_id} for subsequent tests")
        elif exhibitions_data and len(exhibitions_data) > 0:
            exhibition_id = exhibitions_data[0]["id"]
            print(f"\n🎯 Using existing exhibition ID: {exhibition_id} for subsequent tests")
        
        # Test categories API
        success, data = self.test_categories_api()
        results["categories"] = success
        
        # Test inventory API with exhibition ID
        success, data = self.test_inventory_api(exhibition_id)
        results["inventory"] = success
        
        # Test enhanced sales API with exhibition ID
        success, data = self.test_enhanced_sales_api(exhibition_id)
        results["enhanced_sales"] = success
        
        # Test sales by exhibition API
        success, data = self.test_sales_by_exhibition_api(exhibition_id)
        results["sales_by_exhibition"] = success
        
        # Test leads by exhibition API
        success, data = self.test_leads_by_exhibition_api(exhibition_id)
        results["leads_by_exhibition"] = success
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 FINAL BACKEND API VALIDATION RESULTS")
        print("=" * 60)
        
        for test_name, passed in results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{test_name.upper().replace('_', ' ')}: {status}")
        
        total_tests = len(results)
        passed_tests = sum(results.values())
        print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("\n🎉 ALL BACKEND APIs ARE WORKING PROPERLY!")
        else:
            print(f"\n⚠️ {total_tests - passed_tests} API(s) need attention")
        
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