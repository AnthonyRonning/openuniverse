-- OpenUniverse Database Schema
-- Generated from X API response analysis

-- ============================================================================
-- ACCOUNTS
-- ============================================================================

CREATE TABLE accounts (
    -- Twitter identifiers
    id BIGINT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    
    -- Profile info
    name VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    url TEXT,
    profile_image_url TEXT,
    pinned_tweet_id BIGINT,
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_type VARCHAR(50),
    protected BOOLEAN DEFAULT FALSE,
    
    -- Public metrics (flattened for querying)
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    tweet_count INT DEFAULT 0,
    listed_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    media_count INT DEFAULT 0,
    
    -- Entities (JSONB for complex nested data)
    entities JSONB,
    
    -- Timestamps
    twitter_created_at TIMESTAMPTZ,
    
    -- Our metadata
    is_seed BOOLEAN DEFAULT FALSE,
    scrape_status VARCHAR(20) DEFAULT 'pending',
    scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_username ON accounts(username);
CREATE INDEX idx_accounts_is_seed ON accounts(is_seed);
CREATE INDEX idx_accounts_scrape_status ON accounts(scrape_status);

-- ============================================================================
-- FOLLOWS (Graph Edges)
-- ============================================================================

CREATE TABLE follows (
    follower_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    following_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- ============================================================================
-- TWEETS
-- ============================================================================

CREATE TABLE tweets (
    -- Twitter identifiers
    id BIGINT PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Content
    text TEXT NOT NULL,
    lang VARCHAR(10),
    
    -- Conversation threading
    conversation_id BIGINT,
    in_reply_to_user_id BIGINT,
    
    -- Referenced tweets (JSONB array)
    referenced_tweets JSONB,
    
    -- Public metrics (flattened for querying)
    retweet_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    quote_count INT DEFAULT 0,
    bookmark_count INT DEFAULT 0,
    impression_count INT DEFAULT 0,
    
    -- Entities (JSONB for mentions, urls, hashtags, etc.)
    entities JSONB,
    
    -- Timestamps  
    twitter_created_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tweets_account ON tweets(account_id);
CREATE INDEX idx_tweets_conversation ON tweets(conversation_id);
CREATE INDEX idx_tweets_twitter_created ON tweets(twitter_created_at);
CREATE INDEX idx_tweets_entities ON tweets USING GIN (entities);

-- ============================================================================
-- KEYWORDS
-- ============================================================================

CREATE TABLE keywords (
    id SERIAL PRIMARY KEY,
    term VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('inclusion', 'exclusion')),
    case_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_keywords_term_type ON keywords(term, type);

-- ============================================================================
-- ACCOUNT KEYWORD MATCHES
-- ============================================================================

CREATE TABLE account_keyword_matches (
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    keyword_id INT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    match_count INT DEFAULT 0,
    last_checked_at TIMESTAMPTZ,
    PRIMARY KEY (account_id, keyword_id)
);

CREATE INDEX idx_matches_keyword ON account_keyword_matches(keyword_id);
CREATE INDEX idx_matches_count ON account_keyword_matches(match_count DESC);

-- ============================================================================
-- TWEET KEYWORD MATCHES
-- ============================================================================

CREATE TABLE tweet_keyword_matches (
    tweet_id BIGINT NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
    keyword_id INT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (tweet_id, keyword_id)
);

CREATE INDEX idx_tweet_matches_keyword ON tweet_keyword_matches(keyword_id);

-- ============================================================================
-- HELPER FUNCTION: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
