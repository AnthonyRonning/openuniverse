import os
from dotenv import load_dotenv
from xdk import Client

load_dotenv()

client = Client(bearer_token=os.getenv("X_BEARER_TOKEN"))

# Test with a public user lookup (works with app-only auth)
user = client.users.get_by_username(username="elonmusk")
print(f"Found user: @{user.data['username']} ({user.data['name']})")
