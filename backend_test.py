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
    
    def test_error_responses(self):
        """Test that proper error responses are returned"""
        print("\n⚠️ Testing Error Response Handling...")
        
        results = {
            "forbidden_403": False,
            "not_found_404": False,
            "unauthorized_401": False
        }
        
        # Test 403 Forbidden
        if "pos_only_user" in self.test_user_tokens:
            token, user = self.authenticate_test_user("pos_only_user", "pos123")
            if token:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
                
                try:
                    response = requests.get(f"{self.base_url}/users", headers=headers)
                    if response.status_code == 403:
                        print("✅ 403 Forbidden response working correctly")
                        results["forbidden_403"] = True
                except Exception as e:
                    print(f"❌ Error testing 403 response: {str(e)}")
        
        # Test 404 Not Found
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.super_admin_token}"
        }
        
        try:
            response = requests.get(f"{self.base_url}/users/nonexistent-user-id", headers=headers)
            print(f"404 test response: {response.status_code}")
            if response.status_code == 404:
                print("✅ 404 Not Found response working correctly")
                results["not_found_404"] = True
            else:
                print(f"❌ Expected 404, got {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ Error testing 404 response: {str(e)}")
        
        # Test 401/403 Unauthorized (no token) - FastAPI returns 403 for missing auth
        try:
            response = requests.get(f"{self.base_url}/users")
            print(f"Unauthorized test response: {response.status_code}")
            if response.status_code in [401, 403]:  # Both are valid for missing auth
                print("✅ Unauthorized response working correctly")
                results["unauthorized_401"] = True
            else:
                print(f"❌ Expected 401 or 403, got {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ Error testing unauthorized response: {str(e)}")
        
        return results
    
    def cleanup_test_users(self):
        """Clean up created test users"""
        print("\n🧹 Cleaning up test users...")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.super_admin_token}"
        }
        
        for user_id in self.created_test_users:
            try:
                response = requests.delete(f"{self.base_url}/users/{user_id}", headers=headers)
                if response.status_code == 200:
                    print(f"✅ Deleted test user {user_id}")
                else:
                    print(f"⚠️ Could not delete test user {user_id}: {response.text}")
            except Exception as e:
                print(f"❌ Error deleting test user {user_id}: {str(e)}")
    
    def test_self_deletion_prevention(self):
        """Test that users cannot delete themselves"""
        print("\n🚫 Testing Self-Deletion Prevention...")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.super_admin_token}"
        }
        
        # Get current user info
        try:
            response = requests.get(f"{self.base_url}/auth/me", headers=headers)
            if response.status_code == 200:
                user_info = response.json()
                user_id = user_info['id']
                
                # Try to delete self
                response = requests.delete(f"{self.base_url}/users/{user_id}", headers=headers)
                if response.status_code == 400:
                    print("✅ Self-deletion properly prevented")
                    return True
                else:
                    print(f"❌ Self-deletion should be prevented: {response.text}")
                    return False
            else:
                print("❌ Could not get current user info")
                return False
                
        except Exception as e:
            print(f"❌ Error testing self-deletion prevention: {str(e)}")
            return False

    def run_comprehensive_rbac_tests(self):
        """Run comprehensive role-based access control tests"""
        print("🚀 STARTING ROLE-BASED ACCESS CONTROL SYSTEM TESTING")
        print("=" * 70)
        
        results = {
            "super_admin_login": False,
            "old_credentials_disabled": False,
            "user_management_apis": {},
            "test_users_created": False,
            "permission_enforcement": {},
            "jwt_validation": {},
            "error_responses": {},
            "self_deletion_prevention": False
        }
        
        # PHASE 1: Super Admin Login
        success, user_info = self.authenticate_super_admin()
        results["super_admin_login"] = success
        
        if not success:
            print("\n❌ Cannot proceed without Super Admin authentication")
            return results
        
        # Test old credentials are disabled
        results["old_credentials_disabled"] = self.test_old_admin_credentials()
        
        # PHASE 2: User Management APIs
        results["user_management_apis"] = self.test_user_management_apis()
        
        # PHASE 3: Create test users with limited permissions
        created_users = self.create_test_users_with_limited_permissions()
        results["test_users_created"] = len(created_users) > 0
        
        # PHASE 4: Test permission enforcement
        results["permission_enforcement"] = self.test_permission_enforcement()
        
        # PHASE 5: JWT token validation
        results["jwt_validation"] = self.test_jwt_token_validation()
        
        # Test error responses
        results["error_responses"] = self.test_error_responses()
        
        # Test self-deletion prevention
        results["self_deletion_prevention"] = self.test_self_deletion_prevention()
        
        # Clean up test users
        self.cleanup_test_users()
        
        return results
    
    def print_test_summary(self, results):
        """Print comprehensive test summary"""
        print("\n" + "=" * 70)
        print("📊 ROLE-BASED ACCESS CONTROL SYSTEM TEST RESULTS")
        print("=" * 70)
        
        # Phase 1 Results
        print("\n🔐 PHASE 1: Super Admin Authentication")
        print(f"   Super Admin Login (Murtaza Taher): {'✅ PASS' if results['super_admin_login'] else '❌ FAIL'}")
        print(f"   Old Credentials Disabled: {'✅ PASS' if results['old_credentials_disabled'] else '❌ FAIL'}")
        
        # Phase 2 Results
        print("\n👥 PHASE 2: User Management APIs")
        user_mgmt = results['user_management_apis']
        print(f"   GET /users: {'✅ PASS' if user_mgmt.get('get_users', False) else '❌ FAIL'}")
        print(f"   POST /users: {'✅ PASS' if user_mgmt.get('create_user', False) else '❌ FAIL'}")
        print(f"   PUT /users/permissions: {'✅ PASS' if user_mgmt.get('update_permissions', False) else '❌ FAIL'}")
        
        # Phase 3 Results
        print("\n👤 PHASE 3: Test User Creation")
        print(f"   Limited Permission Users Created: {'✅ PASS' if results['test_users_created'] else '❌ FAIL'}")
        
        # Phase 4 Results
        print("\n🔒 PHASE 4: Permission Enforcement")
        perm_enforcement = results['permission_enforcement']
        print(f"   POS-only User Forbidden from /users: {'✅ PASS' if perm_enforcement.get('pos_only_forbidden', False) else '❌ FAIL'}")
        print(f"   Inventory User Can Access Products: {'✅ PASS' if perm_enforcement.get('inventory_user_access', False) else '❌ FAIL'}")
        print(f"   Limited Admin Forbidden from /users: {'✅ PASS' if perm_enforcement.get('limited_admin_forbidden', False) else '❌ FAIL'}")
        
        # Phase 5 Results
        print("\n🎫 PHASE 5: JWT Token Validation")
        jwt_validation = results['jwt_validation']
        print(f"   Token Contains User Info: {'✅ PASS' if jwt_validation.get('token_contains_user_info', False) else '❌ FAIL'}")
        print(f"   Token Validation Working: {'✅ PASS' if jwt_validation.get('token_validation', False) else '❌ FAIL'}")
        print(f"   Role-Based Middleware: {'✅ PASS' if jwt_validation.get('role_based_middleware', False) else '❌ FAIL'}")
        
        # Error Response Results
        print("\n⚠️ ERROR RESPONSE HANDLING")
        error_responses = results['error_responses']
        print(f"   403 Forbidden Responses: {'✅ PASS' if error_responses.get('forbidden_403', False) else '❌ FAIL'}")
        print(f"   404 Not Found Responses: {'✅ PASS' if error_responses.get('not_found_404', False) else '❌ FAIL'}")
        print(f"   401/403 Unauthorized Responses: {'✅ PASS' if error_responses.get('unauthorized_401', False) else '❌ FAIL'}")
        
        # Security Features
        print("\n🛡️ SECURITY FEATURES")
        print(f"   Self-Deletion Prevention: {'✅ PASS' if results['self_deletion_prevention'] else '❌ FAIL'}")
        
        # Calculate overall success
        all_tests = []
        all_tests.append(results['super_admin_login'])
        all_tests.append(results['old_credentials_disabled'])
        all_tests.extend(user_mgmt.values())
        all_tests.append(results['test_users_created'])
        all_tests.extend(perm_enforcement.values())
        all_tests.extend(jwt_validation.values())
        all_tests.extend(error_responses.values())
        all_tests.append(results['self_deletion_prevention'])
        
        total_tests = len(all_tests)
        passed_tests = sum(all_tests)
        
        print(f"\n📈 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("\n🎉 ALL ROLE-BASED ACCESS CONTROL TESTS PASSED!")
            print("✅ Super Admin can manage all users and has full access")
            print("✅ Regular users can only access features they have permissions for")
            print("✅ Security is properly implemented with no unauthorized access")
            print("✅ All user management operations work correctly")
            print("✅ System maintains security while being user-friendly")
        else:
            print(f"\n⚠️ {total_tests - passed_tests} test(s) failed - system needs attention")
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = RoleBasedAccessTester()
    results = tester.run_comprehensive_rbac_tests()
    
    # Print comprehensive summary
    all_passed = tester.print_test_summary(results)
    
    # Exit with appropriate code
    if all_passed:
        print("\n🎉 All role-based access control tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed - check the results above")
        sys.exit(1)