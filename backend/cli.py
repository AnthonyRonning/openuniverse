#!/usr/bin/env python
"""
CLI for OpenCCP scraper.

Usage:
    python -m backend.cli scrape anthonyronning
    python -m backend.cli list
    python -m backend.cli show anthonyronning
    python -m backend.cli graph
"""

import sys
import json
from backend.db import SessionLocal
from backend.scraper import ScraperService


def cmd_scrape(username: str):
    """Scrape an account and its network."""
    db = SessionLocal()
    try:
        scraper = ScraperService(db)
        account, stats = scraper.scrape_account(username)
        
        print("\n" + "=" * 50)
        print("SCRAPE COMPLETE")
        print("=" * 50)
        
        if account:
            print(f"Account: @{account.username} ({account.name})")
            print(f"  ID: {account.id}")
            print(f"  Followers: {account.followers_count}")
            print(f"  Following: {account.following_count}")
            print(f"  Tweets: {account.tweet_count}")
        
        print(f"\nStats:")
        print(f"  Account scraped: {stats['account_scraped']}")
        print(f"  Tweets added: {stats['tweets_added']}")
        print(f"  Following added: {stats['following_added']}")
        print(f"  Followers added: {stats['followers_added']}")
        print(f"  Connections scraped: {stats['connections_scraped']}")
        
        if stats['errors']:
            print(f"  Errors: {stats['errors']}")
    finally:
        db.close()


def cmd_list(seeds_only: bool = False):
    """List all accounts in the database."""
    db = SessionLocal()
    try:
        scraper = ScraperService(db)
        accounts = scraper.get_all_accounts(seeds_only=seeds_only)
        
        print(f"\n{'SEED ' if seeds_only else ''}ACCOUNTS ({len(accounts)} total)")
        print("=" * 60)
        
        for a in accounts:
            seed_marker = "[SEED] " if a.is_seed else "       "
            print(f"{seed_marker}@{a.username:<20} {a.name or '':<25} followers:{a.followers_count}")
    finally:
        db.close()


def cmd_show(username: str):
    """Show details for an account."""
    db = SessionLocal()
    try:
        scraper = ScraperService(db)
        account = scraper.get_account(username)
        
        if not account:
            print(f"Account @{username} not found in database")
            return
        
        print(f"\n@{account.username}")
        print("=" * 50)
        print(f"Name: {account.name}")
        print(f"ID: {account.id}")
        print(f"Bio: {account.description}")
        print(f"Location: {account.location}")
        print(f"Verified: {account.verified} ({account.verified_type})")
        print(f"Is Seed: {account.is_seed}")
        print(f"\nMetrics:")
        print(f"  Followers: {account.followers_count}")
        print(f"  Following: {account.following_count}")
        print(f"  Tweets: {account.tweet_count}")
        print(f"  Likes: {account.like_count}")
        
        # Tweets
        tweets = scraper.get_account_tweets(account.id)
        print(f"\nTweets in DB ({len(tweets)}):")
        for t in tweets[:5]:
            text_preview = t.text[:60].replace('\n', ' ') + ('...' if len(t.text) > 60 else '')
            print(f"  - {text_preview}")
        
        # Following
        following = scraper.get_account_following(account.id)
        print(f"\nFollowing in DB ({len(following)}):")
        for f in following[:5]:
            print(f"  - @{f.username}")
        
        # Followers
        followers = scraper.get_account_followers(account.id)
        print(f"\nFollowers in DB ({len(followers)}):")
        for f in followers[:5]:
            print(f"  - @{f.username}")
    finally:
        db.close()


def cmd_graph():
    """Output graph data as JSON."""
    db = SessionLocal()
    try:
        scraper = ScraperService(db)
        data = scraper.get_graph_data()
        print(json.dumps(data, indent=2))
    finally:
        db.close()


def cmd_stats():
    """Show database stats."""
    db = SessionLocal()
    try:
        from backend.db.models import Account, Tweet, Follow, Keyword
        
        accounts = db.query(Account).count()
        seeds = db.query(Account).filter(Account.is_seed == True).count()
        tweets = db.query(Tweet).count()
        follows = db.query(Follow).count()
        keywords = db.query(Keyword).count()
        
        print("\nDATABASE STATS")
        print("=" * 30)
        print(f"Accounts: {accounts} ({seeds} seeds)")
        print(f"Tweets: {tweets}")
        print(f"Follow edges: {follows}")
        print(f"Keywords: {keywords}")
    finally:
        db.close()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    cmd = sys.argv[1]
    
    if cmd == "scrape":
        if len(sys.argv) < 3:
            print("Usage: python -m backend.cli scrape <username>")
            sys.exit(1)
        cmd_scrape(sys.argv[2])
    
    elif cmd == "list":
        seeds_only = "--seeds" in sys.argv
        cmd_list(seeds_only=seeds_only)
    
    elif cmd == "show":
        if len(sys.argv) < 3:
            print("Usage: python -m backend.cli show <username>")
            sys.exit(1)
        cmd_show(sys.argv[2])
    
    elif cmd == "graph":
        cmd_graph()
    
    elif cmd == "stats":
        cmd_stats()
    
    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
