"""
Topic search and side analysis using xAI (Grok) with x_search tool.
"""

import os
import re
import json
from typing import List, Optional

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import x_search


def extract_tweet_ids_from_urls(urls: List[str]) -> List[int]:
    """Extract tweet IDs from X/Twitter URLs."""
    tweet_ids = []
    pattern = r'(?:x\.com|twitter\.com)/\w+/status/(\d+)'
    
    for url in urls:
        match = re.search(pattern, url)
        if match:
            try:
                tweet_ids.append(int(match.group(1)))
            except ValueError:
                continue
    
    return tweet_ids


class TopicService:
    """Service for topic search and side analysis using xAI."""

    def __init__(self):
        api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise ValueError("XAI_API_KEY environment variable not set")
        self.client = Client(api_key=api_key)

    def search_topic_with_replies(self, query: str, limit: int = 10) -> dict:
        """Search for top tweets about a topic AND their top replies in one call."""
        
        prompt = f"""Find the top {limit} most popular/viral tweets about: "{query}"

For EACH tweet, also find its top/most popular reply.

Return the results as JSON with this exact format:
{{
  "tweets": [
    {{
      "url": "https://x.com/username/status/123...",
      "top_reply_url": "https://x.com/username/status/456..." or null if no notable reply
    }}
  ]
}}

Focus on tweets with high engagement (likes, retweets, replies). Use x_search to find them and their top replies."""

        chat = self.client.chat.create(
            model="grok-4-1-fast",
            tools=[x_search()],
        )
        chat.append(user(prompt))
        response = chat.sample()
        
        content = response.content if hasattr(response, 'content') else str(response)
        
        # Parse JSON from response
        json_str = content
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_str = content.split("```")[1].split("```")[0].strip()
        
        try:
            result = json.loads(json_str)
        except json.JSONDecodeError:
            result = {"tweets": [], "raw_response": content}
        
        return result

    def analyze_sides(
        self,
        tweets_data: List[dict],
        side_a_name: str,
        side_b_name: str,
        prompt: str,
    ) -> List[dict]:
        """Analyze tweets and classify them into sides.
        
        Args:
            tweets_data: List of {"id": int, "text": str}
            side_a_name: Name for side A
            side_b_name: Name for side B  
            prompt: User's prompt to help classify
        
        Returns:
            List of {"tweet_id": int, "side": "a"|"b"|"ambiguous", "reason": str}
        """
        
        tweets_text = "\n\n".join([
            f"Tweet ID {t['id']}:\n{t['text']}"
            for t in tweets_data
        ])
        
        analysis_prompt = f"""You must classify each tweet into EXACTLY one of two sides. Only use "ambiguous" if the tweet is completely unrelated to the topic or truly impossible to classify.

The two sides are:
- Side A = "{side_a_name}"
- Side B = "{side_b_name}"

How to decide which side:
{prompt}

IMPORTANT: Most tweets should be classifiable into side A or side B. Be decisive. Look for any indication of position, tone, or sentiment. Even subtle hints count.

Here are the tweets to classify:

{tweets_text}

Return JSON with a classification for EVERY tweet ID listed above:
{{
  "classifications": [
    {{"tweet_id": 123, "side": "a", "reason": "brief reason"}},
    {{"tweet_id": 456, "side": "b", "reason": "brief reason"}}
  ]
}}

Valid values for "side": "a", "b", or "ambiguous" (use sparingly)"""

        chat = self.client.chat.create(
            model="grok-4-1-fast",
            tools=[x_search()],
        )
        chat.append(user(analysis_prompt))
        response = chat.sample()
        
        content = response.content if hasattr(response, 'content') else str(response)
        
        # Parse JSON
        json_str = content
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_str = content.split("```")[1].split("```")[0].strip()
        
        try:
            result = json.loads(json_str)
            return result.get("classifications", [])
        except json.JSONDecodeError:
            return []
