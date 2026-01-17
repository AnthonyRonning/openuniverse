-- Add sentiment columns to tweets table
ALTER TABLE tweets 
ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20),
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT,
ADD COLUMN IF NOT EXISTS sentiment_analyzed_at TIMESTAMP WITH TIME ZONE;

-- Create index for finding unanalyzed tweets
CREATE INDEX IF NOT EXISTS idx_tweets_sentiment ON tweets(sentiment) WHERE sentiment IS NULL;

-- Sentiment can be: 'positive', 'negative', 'neutral', 'mixed'
-- sentiment_score is confidence: 0.0 to 1.0
