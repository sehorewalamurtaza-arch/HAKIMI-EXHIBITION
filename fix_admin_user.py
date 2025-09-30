#!/usr/bin/env python3
"""
Fix Super Admin User Password Hash
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import hashlib
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def get_password_hash(password: str) -> str:
    """Hash password using SHA-256 with salt for security"""
    salt = "badshah_hakimi_pos_salt_2024"
    return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()

async def fix_admin_user():
    print("🔧 Fixing Super Admin user password hash...")
    
    # Delete existing user
    result = await db.users.delete_one({"username": "Murtaza Taher"})
    if result.deleted_count > 0:
        print("✅ Deleted existing Super Admin user")
    else:
        print("ℹ️ No existing Super Admin user found")
    
    # Create new user with correct password hash
    password_hash = get_password_hash("Hakimi@786")
    
    super_admin = {
        "id": "super-admin-001",
        "username": "Murtaza Taher",
        "full_name": "Murtaza Taher - Super Administrator",
        "role": "super_admin",
        "phone": "+971-ADMIN-MAIN",
        "permissions": [
            "dashboard", "products", "categories", "exhibitions", 
            "pos", "expenses", "leads", "reports", "day_end_close", 
            "exhibition_closure", "user_management"
        ],
        "password_hash": password_hash,
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
        "is_active": True,
        "last_login": None
    }
    
    await db.users.insert_one(super_admin)
    print("✅ Created Super Admin user with correct password hash")
    
    # Verify the user
    user = await db.users.find_one({"username": "Murtaza Taher"})
    if user:
        print(f"✅ Verified: User {user['username']} exists with role {user['role']}")
        print(f"   Permissions: {user['permissions']}")
    else:
        print("❌ Failed to create user")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_admin_user())