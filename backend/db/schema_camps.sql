-- Camps/Categories Schema Extension
-- Adds support for grouping accounts by content-based analysis

-- Camps are categories like "AI Enthusiast" or "AI Skeptic"
CREATE TABLE camps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add camp_id to keywords (a keyword belongs to one camp)
ALTER TABLE keywords ADD COLUMN camp_id INT REFERENCES camps(id) ON DELETE CASCADE;
ALTER TABLE keywords ADD COLUMN weight FLOAT DEFAULT 1.0;

-- Drop the old type constraint and add new one
ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_type_check;
ALTER TABLE keywords ADD CONSTRAINT keywords_type_check
    CHECK (type IN ('inclusion', 'exclusion', 'signal'));

-- Account scores per camp (the main analysis result)
CREATE TABLE account_camp_scores (
    account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
    camp_id INT REFERENCES camps(id) ON DELETE CASCADE,
    score FLOAT DEFAULT 0,
    bio_score FLOAT DEFAULT 0,
    tweet_score FLOAT DEFAULT 0,
    match_details JSONB,  -- {"bio_matches": [...], "tweet_matches": [...]}
    analyzed_at TIMESTAMPTZ,
    PRIMARY KEY (account_id, camp_id)
);

CREATE INDEX idx_account_camp_scores_score ON account_camp_scores(camp_id, score DESC);
CREATE INDEX idx_account_camp_scores_account ON account_camp_scores(account_id);
