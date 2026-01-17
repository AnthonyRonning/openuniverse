"""
Exploration script to see what data we get from the X API.
Run this to understand the schema before building the database.
"""

import os
import json
from dotenv import load_dotenv
from xdk import Client

load_dotenv()

client = Client(bearer_token=os.getenv("X_BEARER_TOKEN"))

def pp(data):
    """Pretty print JSON data"""
    if hasattr(data, 'model_dump'):
        data = data.model_dump()
    print(json.dumps(data, indent=2, default=str))

# === ACCOUNT DATA ===
print("=" * 60)
print("ACCOUNT DATA: @anthonyronning")
print("=" * 60)

# Fetch with all available user fields
user = client.users.get_by_username(
    username="anthonyronning",
    user_fields=[
        "created_at",
        "description", 
        "entities",
        "id",
        "location",
        "name",
        "pinned_tweet_id",
        "profile_image_url",
        "protected",
        "public_metrics",
        "url",
        "username",
        "verified",
        "verified_type",
        "withheld",
    ],
)
print("\nUser object:")
pp(user)

# === TWEETS DATA ===
print("\n" + "=" * 60)
print("TWEETS DATA (last 3)")
print("=" * 60)

# Get user ID for tweet lookup
user_id = user.data["id"]
print(f"\nUser ID: {user_id}")

# Fetch recent tweets (via users client, not posts)
tweets = client.users.get_posts(
    id=user_id,
    max_results=5,  # min is 5
    tweet_fields=[
        "author_id",
        "conversation_id",
        "created_at",
        "entities",
        "id",
        "in_reply_to_user_id",
        "lang",
        "public_metrics",
        "referenced_tweets",
        "text",
    ],
)
print("\nTweets response:")
for page in tweets:
    pp(page)
    break  # Just first page

# === FOLLOWING DATA ===
print("\n" + "=" * 60)
print("FOLLOWING DATA (3 accounts)")
print("=" * 60)

following = client.users.get_following(
    id=user_id,
    max_results=3,
    user_fields=[
        "created_at",
        "description",
        "id",
        "location", 
        "name",
        "profile_image_url",
        "public_metrics",
        "url",
        "username",
        "verified",
    ],
)
print("\nFollowing response:")
for page in following:
    pp(page)
    break  # Just first page

# === FOLLOWERS DATA ===
print("\n" + "=" * 60)
print("FOLLOWERS DATA (3 accounts)")
print("=" * 60)

followers = client.users.get_followers(
    id=user_id,
    max_results=3,
    user_fields=[
        "created_at",
        "description",
        "id",
        "location",
        "name", 
        "profile_image_url",
        "public_metrics",
        "url",
        "username",
        "verified",
    ],
)
print("\nFollowers response:")
for page in followers:
    pp(page)
    break  # Just first page

print("\n" + "=" * 60)
print("EXPLORATION COMPLETE")
print("=" * 60)
