-- Add bio sentiment columns to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS bio_sentiment VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio_sentiment_score FLOAT,
ADD COLUMN IF NOT EXISTS bio_sentiment_analyzed_at TIMESTAMP WITH TIME ZONE;
