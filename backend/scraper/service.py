"""
Scraper service - orchestrates fetching and storing X data.
"""

from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from backend.db.models import Account, Follow, Tweet
from backend.scraper.client import XClient, UserData, TweetData
from backend import config


class ScraperService:
    """
    Main scraping service.
    
    Usage:
        scraper = ScraperService(db_session)
        account, stats = scraper.scrape_account("anthonyronning")
    """

    def __init__(self, db: Session, client: Optional[XClient] = None):
        self.db = db
        self.client = client or XClient()

    def _upsert_account(self, user_data: UserData, is_seed: bool = False) -> Account:
        """Insert or update an account."""
        stmt = insert(Account).values(
            id=user_data.id,
            username=user_data.username,
            name=user_data.name,
            description=user_data.description,
            location=user_data.location,
            url=user_data.url,
            profile_image_url=user_data.profile_image_url,
            pinned_tweet_id=user_data.pinned_tweet_id,
            verified=user_data.verified,
            verified_type=user_data.verified_type,
            protected=user_data.protected,
            followers_count=user_data.followers_count,
            following_count=user_data.following_count,
            tweet_count=user_data.tweet_count,
            listed_count=user_data.listed_count,
            like_count=user_data.like_count,
            media_count=user_data.media_count,
            entities=user_data.entities,
            twitter_created_at=user_data.twitter_created_at,
            is_seed=is_seed,
            scrape_status="scraped",
            scraped_at=datetime.utcnow(),
        )
        
        # On conflict, update everything except is_seed (don't demote seeds)
        stmt = stmt.on_conflict_do_update(
            index_elements=["id"],
            set_={
                "username": user_data.username,
                "name": user_data.name,
                "description": user_data.description,
                "location": user_data.location,
                "url": user_data.url,
                "profile_image_url": user_data.profile_image_url,
                "pinned_tweet_id": user_data.pinned_tweet_id,
                "verified": user_data.verified,
                "verified_type": user_data.verified_type,
                "protected": user_data.protected,
                "followers_count": user_data.followers_count,
                "following_count": user_data.following_count,
                "tweet_count": user_data.tweet_count,
                "listed_count": user_data.listed_count,
                "like_count": user_data.like_count,
                "media_count": user_data.media_count,
                "entities": user_data.entities,
                "twitter_created_at": user_data.twitter_created_at,
                "scrape_status": "scraped",
                "scraped_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                # Only upgrade to seed, never downgrade
                "is_seed": Account.is_seed | is_seed,
            }
        )
        
        self.db.execute(stmt)
        self.db.commit()
        
        return self.db.query(Account).filter(Account.id == user_data.id).first()

    def _upsert_tweet(self, tweet_data: TweetData) -> Tweet:
        """Insert or update a tweet."""
        stmt = insert(Tweet).values(
            id=tweet_data.id,
            account_id=tweet_data.account_id,
            text=tweet_data.text,
            lang=tweet_data.lang,
            conversation_id=tweet_data.conversation_id,
            in_reply_to_user_id=tweet_data.in_reply_to_user_id,
            referenced_tweets=tweet_data.referenced_tweets,
            retweet_count=tweet_data.retweet_count,
            reply_count=tweet_data.reply_count,
            like_count=tweet_data.like_count,
            quote_count=tweet_data.quote_count,
            bookmark_count=tweet_data.bookmark_count,
            impression_count=tweet_data.impression_count,
            entities=tweet_data.entities,
            twitter_created_at=tweet_data.twitter_created_at,
        )
        
        stmt = stmt.on_conflict_do_update(
            index_elements=["id"],
            set_={
                "text": tweet_data.text,
                "retweet_count": tweet_data.retweet_count,
                "reply_count": tweet_data.reply_count,
                "like_count": tweet_data.like_count,
                "quote_count": tweet_data.quote_count,
                "bookmark_count": tweet_data.bookmark_count,
                "impression_count": tweet_data.impression_count,
                "entities": tweet_data.entities,
                "scraped_at": datetime.utcnow(),
            }
        )
        
        self.db.execute(stmt)
        return tweet_data

    def _upsert_follow(self, follower_id: int, following_id: int) -> None:
        """Insert a follow relationship (ignore if exists)."""
        stmt = insert(Follow).values(
            follower_id=follower_id,
            following_id=following_id,
        ).on_conflict_do_nothing()
        
        self.db.execute(stmt)

    def scrape_account(
        self,
        username: str,
        include_tweets: bool = True,
        include_following: bool = True,
        include_followers: bool = True,
        depth: int = 1,  # How deep to go (1 = just immediate connections)
    ) -> Tuple[Optional[Account], dict]:
        """
        Scrape an account and optionally its network.
        
        Returns:
            Tuple of (Account or None, stats dict)
        """
        stats = {
            "account_scraped": False,
            "tweets_added": 0,
            "following_added": 0,
            "followers_added": 0,
            "connections_scraped": 0,
            "errors": [],
        }

        # 1. Fetch the main account
        print(f"Fetching @{username}...")
        user_data = self.client.get_user_by_username(username)
        if not user_data:
            stats["errors"].append(f"Could not fetch user @{username}")
            return None, stats

        # 2. Save as seed account
        account = self._upsert_account(user_data, is_seed=True)
        stats["account_scraped"] = True
        print(f"  Saved account: {account}")

        # 3. Fetch tweets
        if include_tweets:
            print(f"  Fetching tweets (max {config.MAX_TWEETS_PER_ACCOUNT})...")
            tweets = self.client.get_user_tweets(
                user_data.id, 
                max_results=config.MAX_TWEETS_PER_ACCOUNT
            )
            for tweet in tweets:
                self._upsert_tweet(tweet)
                stats["tweets_added"] += 1
            self.db.commit()
            print(f"  Saved {stats['tweets_added']} tweets")

        # 4. Fetch following (accounts this user follows)
        if include_following and depth > 0:
            print(f"  Fetching following (max {config.MAX_FOLLOWING_TO_FETCH})...")
            following = self.client.get_following(
                user_data.id,
                max_results=config.MAX_FOLLOWING_TO_FETCH
            )
            for followed_user in following:
                # Save the followed account (not as seed)
                self._upsert_account(followed_user, is_seed=False)
                # Create the follow edge
                self._upsert_follow(user_data.id, followed_user.id)
                stats["following_added"] += 1
            self.db.commit()
            print(f"  Saved {stats['following_added']} following")

        # 5. Fetch followers (accounts that follow this user)
        if include_followers and depth > 0:
            print(f"  Fetching followers (max {config.MAX_FOLLOWERS_TO_FETCH})...")
            followers = self.client.get_followers(
                user_data.id,
                max_results=config.MAX_FOLLOWERS_TO_FETCH
            )
            for follower_user in followers:
                # Save the follower account (not as seed)
                self._upsert_account(follower_user, is_seed=False)
                # Create the follow edge
                self._upsert_follow(follower_user.id, user_data.id)
                stats["followers_added"] += 1
            self.db.commit()
            print(f"  Saved {stats['followers_added']} followers")

        # 6. Optionally scrape tweets for discovered accounts
        if depth > 0 and include_tweets:
            # Get all accounts we just discovered that haven't had tweets scraped
            discovered_ids = []
            
            if include_following:
                following = self.client.get_following(
                    user_data.id,
                    max_results=config.MAX_FOLLOWING_TO_FETCH
                )
                discovered_ids.extend([u.id for u in following])
            
            if include_followers:
                followers = self.client.get_followers(
                    user_data.id,
                    max_results=config.MAX_FOLLOWERS_TO_FETCH
                )
                discovered_ids.extend([u.id for u in followers])
            
            # Remove duplicates
            discovered_ids = list(set(discovered_ids))
            
            print(f"  Fetching tweets for {len(discovered_ids)} discovered accounts...")
            for disc_id in discovered_ids:
                disc_account = self.db.query(Account).filter(Account.id == disc_id).first()
                if disc_account:
                    tweets = self.client.get_user_tweets(
                        disc_id,
                        max_results=config.MAX_TWEETS_PER_ACCOUNT
                    )
                    for tweet in tweets:
                        self._upsert_tweet(tweet)
                    stats["connections_scraped"] += 1
            
            self.db.commit()
            print(f"  Scraped tweets for {stats['connections_scraped']} connections")

        return account, stats

    def scrape_by_id(self, user_id: int) -> Tuple[Optional[Account], dict]:
        """Scrape an account by Twitter ID."""
        user_data = self.client.get_user_by_id(user_id)
        if not user_data:
            return None, {"errors": [f"Could not fetch user {user_id}"]}
        return self.scrape_account(user_data.username)

    def get_account(self, username: str) -> Optional[Account]:
        """Get an account from the database by username."""
        return self.db.query(Account).filter(Account.username == username).first()

    def get_all_accounts(self, seeds_only: bool = False) -> List[Account]:
        """Get all accounts, optionally filtering to seeds only."""
        query = self.db.query(Account)
        if seeds_only:
            query = query.filter(Account.is_seed == True)
        return query.all()

    def get_account_tweets(self, account_id: int) -> List[Tweet]:
        """Get all tweets for an account."""
        return self.db.query(Tweet).filter(Tweet.account_id == account_id).all()

    def get_account_following(self, account_id: int) -> List[Account]:
        """Get accounts that this account follows."""
        follows = self.db.query(Follow).filter(Follow.follower_id == account_id).all()
        following_ids = [f.following_id for f in follows]
        return self.db.query(Account).filter(Account.id.in_(following_ids)).all()

    def get_account_followers(self, account_id: int) -> List[Account]:
        """Get accounts that follow this account."""
        follows = self.db.query(Follow).filter(Follow.following_id == account_id).all()
        follower_ids = [f.follower_id for f in follows]
        return self.db.query(Account).filter(Account.id.in_(follower_ids)).all()

    def get_graph_data(self) -> dict:
        """Get all nodes and edges for graph visualization."""
        accounts = self.db.query(Account).all()
        follows = self.db.query(Follow).all()
        
        nodes = [
            {
                "id": str(a.id),
                "username": a.username,
                "name": a.name,
                "is_seed": a.is_seed,
                "followers_count": a.followers_count,
                "following_count": a.following_count,
                "profile_image_url": a.profile_image_url,
            }
            for a in accounts
        ]
        
        edges = [
            {
                "source": str(f.follower_id),
                "target": str(f.following_id),
            }
            for f in follows
        ]
        
        return {"nodes": nodes, "edges": edges}
