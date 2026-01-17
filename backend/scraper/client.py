"""
X API client wrapper using xdk.
Handles authentication and provides typed responses.
"""

import os
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
from xdk import Client
from dotenv import load_dotenv

load_dotenv()


@dataclass
class UserData:
    """Parsed user data from X API."""
    id: int
    username: str
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    url: Optional[str] = None
    profile_image_url: Optional[str] = None
    pinned_tweet_id: Optional[int] = None
    verified: bool = False
    verified_type: Optional[str] = None
    protected: bool = False
    followers_count: int = 0
    following_count: int = 0
    tweet_count: int = 0
    listed_count: int = 0
    like_count: int = 0
    media_count: int = 0
    entities: Optional[Dict] = None
    twitter_created_at: Optional[datetime] = None


@dataclass
class TweetData:
    """Parsed tweet data from X API."""
    id: int
    account_id: int
    text: str
    lang: Optional[str] = None
    conversation_id: Optional[int] = None
    in_reply_to_user_id: Optional[int] = None
    referenced_tweets: Optional[List[Dict]] = None
    retweet_count: int = 0
    reply_count: int = 0
    like_count: int = 0
    quote_count: int = 0
    bookmark_count: int = 0
    impression_count: int = 0
    entities: Optional[Dict] = None
    twitter_created_at: Optional[datetime] = None


class XClient:
    """Wrapper around xdk Client with parsing helpers."""

    # Fields to request from X API
    USER_FIELDS = [
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
    ]

    TWEET_FIELDS = [
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
    ]

    def __init__(self, bearer_token: Optional[str] = None):
        self.bearer_token = bearer_token or os.getenv("X_BEARER_TOKEN")
        if not self.bearer_token:
            raise ValueError("X_BEARER_TOKEN is required")
        self.client = Client(bearer_token=self.bearer_token)

    def _parse_datetime(self, dt_str: Optional[str]) -> Optional[datetime]:
        """Parse X API datetime string."""
        if not dt_str:
            return None
        try:
            return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return None

    def _parse_user(self, data: Dict[str, Any]) -> UserData:
        """Parse raw user data into UserData."""
        metrics = data.get("public_metrics", {})
        return UserData(
            id=int(data["id"]),
            username=data["username"],
            name=data.get("name"),
            description=data.get("description"),
            location=data.get("location"),
            url=data.get("url"),
            profile_image_url=data.get("profile_image_url"),
            pinned_tweet_id=int(data["pinned_tweet_id"]) if data.get("pinned_tweet_id") else None,
            verified=data.get("verified", False),
            verified_type=data.get("verified_type"),
            protected=data.get("protected", False),
            followers_count=metrics.get("followers_count", 0),
            following_count=metrics.get("following_count", 0),
            tweet_count=metrics.get("tweet_count", 0),
            listed_count=metrics.get("listed_count", 0),
            like_count=metrics.get("like_count", 0),
            media_count=metrics.get("media_count", 0),
            entities=data.get("entities"),
            twitter_created_at=self._parse_datetime(data.get("created_at")),
        )

    def _parse_tweet(self, data: Dict[str, Any]) -> TweetData:
        """Parse raw tweet data into TweetData."""
        metrics = data.get("public_metrics", {})
        return TweetData(
            id=int(data["id"]),
            account_id=int(data["author_id"]),
            text=data["text"],
            lang=data.get("lang"),
            conversation_id=int(data["conversation_id"]) if data.get("conversation_id") else None,
            in_reply_to_user_id=int(data["in_reply_to_user_id"]) if data.get("in_reply_to_user_id") else None,
            referenced_tweets=data.get("referenced_tweets"),
            retweet_count=metrics.get("retweet_count", 0),
            reply_count=metrics.get("reply_count", 0),
            like_count=metrics.get("like_count", 0),
            quote_count=metrics.get("quote_count", 0),
            bookmark_count=metrics.get("bookmark_count", 0),
            impression_count=metrics.get("impression_count", 0),
            entities=data.get("entities"),
            twitter_created_at=self._parse_datetime(data.get("created_at")),
        )

    def get_user_by_username(self, username: str) -> Optional[UserData]:
        """Fetch a user by username."""
        try:
            response = self.client.users.get_by_username(
                username=username,
                user_fields=self.USER_FIELDS,
            )
            if response and response.data:
                return self._parse_user(response.data)
            return None
        except Exception as e:
            print(f"Error fetching user @{username}: {e}")
            return None

    def get_user_by_id(self, user_id: int) -> Optional[UserData]:
        """Fetch a user by ID."""
        try:
            response = self.client.users.get_by_id(
                id=str(user_id),
                user_fields=self.USER_FIELDS,
            )
            if response and response.data:
                return self._parse_user(response.data)
            return None
        except Exception as e:
            print(f"Error fetching user {user_id}: {e}")
            return None

    def get_user_tweets(self, user_id: int, max_results: int = 5) -> List[TweetData]:
        """Fetch recent tweets for a user."""
        tweets = []
        try:
            # X API min is 5, max is 100
            fetch_count = max(5, min(max_results, 100))
            response = self.client.users.get_posts(
                id=str(user_id),
                max_results=fetch_count,
                tweet_fields=self.TWEET_FIELDS,
            )
            # get_posts returns a generator, get first page
            for page in response:
                if page and page.data:
                    for tweet_data in page.data[:max_results]:
                        tweets.append(self._parse_tweet(tweet_data))
                break  # Only first page
        except Exception as e:
            print(f"Error fetching tweets for user {user_id}: {e}")
        return tweets

    def get_following(self, user_id: int, max_results: int = 3) -> List[UserData]:
        """Fetch accounts that user is following."""
        users = []
        try:
            # X API min is 1, max is 1000
            fetch_count = max(1, min(max_results, 1000))
            response = self.client.users.get_following(
                id=str(user_id),
                max_results=fetch_count,
                user_fields=self.USER_FIELDS,
            )
            # Generator, get first page
            for page in response:
                if page and page.data:
                    for user_data in page.data[:max_results]:
                        users.append(self._parse_user(user_data))
                break
        except Exception as e:
            print(f"Error fetching following for user {user_id}: {e}")
        return users

    def get_followers(self, user_id: int, max_results: int = 3) -> List[UserData]:
        """Fetch accounts that follow user."""
        users = []
        try:
            fetch_count = max(1, min(max_results, 1000))
            response = self.client.users.get_followers(
                id=str(user_id),
                max_results=fetch_count,
                user_fields=self.USER_FIELDS,
            )
            for page in response:
                if page and page.data:
                    for user_data in page.data[:max_results]:
                        users.append(self._parse_user(user_data))
                break
        except Exception as e:
            print(f"Error fetching followers for user {user_id}: {e}")
        return users
