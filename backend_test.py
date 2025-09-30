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
    
    def test_user_management_apis(self):
        """Test User Management APIs - Super Admin Only"""
        print("\n👥 PHASE 2: Testing User Management APIs...")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.super_admin_token}"
        }
        
        results = {
            "get_users": False,
            "create_user": False,
            "update_permissions": False,
            "delete_user": False
        }
        
        # Test GET /users
        print("\n📋 Testing GET /users (Super Admin only)...")
        try:
            response = requests.get(f"{self.base_url}/users", headers=headers)
            print(f"GET /users Status: {response.status_code}")
            
            if response.status_code == 200:
                users = response.json()
                print(f"✅ GET /users working - Found {len(users)} users")
                for user in users:
                    print(f"   - {user['username']} ({user['role']}) - Permissions: {user.get('permissions', [])}")
                results["get_users"] = True
            else:
                print(f"❌ GET /users failed: {response.text}")
                
        except Exception as e:
            print(f"❌ GET /users error: {str(e)}")
        
        # Test POST /users - Create new user
        print("\n➕ Testing POST /users (Create User)...")
        test_user_data = {
            "username": "cashier1",
            "full_name": "Cashier User",
            "password": "test123",
            "role": "cashier",
            "permissions": ["pos", "dashboard"]
        }
        
        try:
            response = requests.post(f"{self.base_url}/users", json=test_user_data, headers=headers)
            print(f"POST /users Status: {response.status_code}")
            
            if response.status_code == 200:
                user = response.json()
                print(f"✅ POST /users working - Created user: {user['username']}")
                print(f"   Role: {user['role']}, Permissions: {user['permissions']}")
                self.created_test_users.append(user['id'])
                results["create_user"] = True
                
                # Store user credentials for later testing
                self.test_user_tokens["cashier1"] = {
                    "username": "cashier1",
                    "password": "test123",
                    "permissions": ["pos", "dashboard"],
                    "user_id": user['id']
                }
            else:
                print(f"❌ POST /users failed: {response.text}")
                
        except Exception as e:
            print(f"❌ POST /users error: {str(e)}")
        
        # Test PUT /users/{user_id}/permissions - Update permissions
        if self.created_test_users:
            print("\n✏️ Testing PUT /users/{user_id}/permissions...")
            user_id = self.created_test_users[0]
            new_permissions = ["pos", "dashboard", "products"]
            
            try:
                response = requests.put(
                    f"{self.base_url}/users/{user_id}/permissions",
                    json=new_permissions,
                    headers=headers
                )
                print(f"PUT /users permissions Status: {response.status_code}")
                
                if response.status_code == 200:
                    print("✅ PUT /users permissions working - Updated user permissions")
                    results["update_permissions"] = True
                else:
                    print(f"❌ PUT /users permissions failed: {response.text}")
                    
            except Exception as e:
                print(f"❌ PUT /users permissions error: {str(e)}")
        
        return results
    
    def create_test_users_with_limited_permissions(self):
        """Create test users with specific limited permissions"""
        print("\n👤 PHASE 3: Creating Test Users with Limited Permissions...")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.super_admin_token}"
        }
        
        test_users = [
            {
                "username": "pos_only_user",
                "full_name": "POS Only User",
                "password": "pos123",
                "role": "cashier",
                "permissions": ["pos"]
            },
            {
                "username": "inventory_user",
                "full_name": "Inventory Manager",
                "password": "inv123",
                "role": "inventory",
                "permissions": ["products", "categories"]
            },
            {
                "username": "limited_admin",
                "full_name": "Limited Admin",
                "password": "admin123",
                "role": "admin",
                "permissions": ["dashboard", "pos", "products", "reports"]
            }
        ]
        
        created_users = []
        
        for user_data in test_users:
            try:
                response = requests.post(f"{self.base_url}/users", json=user_data, headers=headers)
                print(f"Creating {user_data['username']}: Status {response.status_code}")
                
                if response.status_code == 200:
                    user = response.json()
                    print(f"✅ Created {user['username']} with permissions: {user['permissions']}")
                    
                    # Store for later testing
                    self.test_user_tokens[user_data['username']] = {
                        "username": user_data['username'],
                        "password": user_data['password'],
                        "permissions": user_data['permissions'],
                        "user_id": user['id']
                    }
                    self.created_test_users.append(user['id'])
                    created_users.append(user)
                else:
                    print(f"❌ Failed to create {user_data['username']}: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error creating {user_data['username']}: {str(e)}")
        
        return created_users
    
    def authenticate_test_user(self, username, password):
        """Authenticate a test user and return token"""
        login_data = {
            "username": username,
            "password": password
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                return data["access_token"], data["user"]
            else:
                return None, None
        except Exception as e:
            print(f"❌ Error authenticating {username}: {str(e)}")
            return None, None
    
    def test_permission_enforcement(self):
        """Test that users can only access endpoints matching their permissions"""
        print("\n🔒 PHASE 4: Testing Permission Enforcement...")
        
        results = {
            "pos_only_forbidden": False,
            "inventory_user_access": False,
            "limited_admin_forbidden": False
        }
        
        # Test POS-only user trying to access /users (should get 403)
        print("\n🚫 Testing POS-only user accessing /users (should be forbidden)...")
        if "pos_only_user" in self.test_user_tokens:
            token, user = self.authenticate_test_user("pos_only_user", "pos123")
            if token:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
                
                try:
                    response = requests.get(f"{self.base_url}/users", headers=headers)
                    print(f"POS user accessing /users: Status {response.status_code}")
                    
                    if response.status_code == 403:
                        print("✅ POS-only user properly forbidden from /users")
                        results["pos_only_forbidden"] = True
                    else:
                        print(f"❌ POS-only user should be forbidden: {response.text}")
                except Exception as e:
                    print(f"❌ Error testing POS user permissions: {str(e)}")
        
        # Test inventory user accessing products (should work)
        print("\n✅ Testing inventory user accessing /products (should work)...")
        if "inventory_user" in self.test_user_tokens:
            token, user = self.authenticate_test_user("inventory_user", "inv123")
            if token:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
                
                try:
                    response = requests.get(f"{self.base_url}/products", headers=headers)
                    print(f"Inventory user accessing /products: Status {response.status_code}")
                    
                    if response.status_code == 200:
                        print("✅ Inventory user can access /products")
                        results["inventory_user_access"] = True
                    else:
                        print(f"❌ Inventory user should access products: {response.text}")
                except Exception as e:
                    print(f"❌ Error testing inventory user permissions: {str(e)}")
        
        # Test limited admin trying to access /users (should get 403)
        print("\n🚫 Testing limited admin accessing /users (should be forbidden)...")
        if "limited_admin" in self.test_user_tokens:
            token, user = self.authenticate_test_user("limited_admin", "admin123")
            if token:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
                
                try:
                    response = requests.get(f"{self.base_url}/users", headers=headers)
                    print(f"Limited admin accessing /users: Status {response.status_code}")
                    
                    if response.status_code == 403:
                        print("✅ Limited admin properly forbidden from /users")
                        results["limited_admin_forbidden"] = True
                    else:
                        print(f"❌ Limited admin should be forbidden: {response.text}")
                except Exception as e:
                    print(f"❌ Error testing limited admin permissions: {str(e)}")
        
        return results
    
    def test_jwt_token_validation(self):
        """Test JWT token validation and user info"""
        print("\n🎫 PHASE 5: Testing JWT Token System...")
        
        results = {
            "token_contains_user_info": False,
            "token_validation": False,
            "role_based_middleware": False
        }
        
        # Test Super Admin token contains proper user info
        if self.super_admin_token:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.super_admin_token}"
            }
            
            try:
                response = requests.get(f"{self.base_url}/auth/me", headers=headers)
                print(f"GET /auth/me Status: {response.status_code}")
                
                if response.status_code == 200:
                    user_info = response.json()
                    print(f"✅ JWT token validation working")
                    print(f"   Username: {user_info['username']}")
                    print(f"   Role: {user_info['role']}")
                    print(f"   Permissions: {user_info.get('permissions', [])}")
                    
                    if user_info['role'] == 'super_admin' and user_info['username'] == SUPER_ADMIN_USERNAME:
                        results["token_contains_user_info"] = True
                        results["token_validation"] = True
                        print("✅ JWT contains proper user info and permissions")
                    
                else:
                    print(f"❌ JWT token validation failed: {response.text}")
                    
            except Exception as e:
                print(f"❌ JWT token validation error: {str(e)}")
        
        # Test role-based middleware with different users
        print("\n🛡️ Testing Role-Based Authentication Middleware...")
        for username, user_data in self.test_user_tokens.items():
            token, user = self.authenticate_test_user(username, user_data['password'])
            if token:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
                
                try:
                    response = requests.get(f"{self.base_url}/auth/me", headers=headers)
                    if response.status_code == 200:
                        user_info = response.json()
                        print(f"✅ {username} token validated - Role: {user_info['role']}")
                        results["role_based_middleware"] = True
                    else:
                        print(f"❌ {username} token validation failed")
                        
                except Exception as e:
                    print(f"❌ Error validating {username} token: {str(e)}")
        
        return results
    
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