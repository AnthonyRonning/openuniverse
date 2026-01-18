import { Link } from 'react-router-dom';
import { Eye, Heart, Repeat } from 'lucide-react';
import { TweetText } from './TweetText';

interface TweetCardProps {
  id: number;
  text: string;
  likeCount: number;
  retweetCount: number;
  impressionCount?: number;
  author?: {
    username: string;
    name?: string;
    profileImageUrl?: string;
  };
  matchedKeywords?: string[];
  score?: number;
}

export function TweetCard({ 
  text, 
  likeCount, 
  retweetCount, 
  impressionCount,
  author,
  matchedKeywords,
  score,
}: TweetCardProps) {
  return (
    <div className="p-2 rounded bg-secondary/50 text-sm">
      <div className="flex items-start gap-2.5">
        {author && (
          <Link to={`/accounts/${author.username}`} className="flex-shrink-0">
            {author.profileImageUrl ? (
              <img src={author.profileImageUrl} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted" />
            )}
          </Link>
        )}
        <div className="flex-1 min-w-0">
          {author && (
            <div className="flex items-center gap-1.5 text-xs mb-1">
              <Link to={`/accounts/${author.username}`} className="font-medium text-foreground hover:underline">
                {author.name || author.username}
              </Link>
              <span className="text-muted-foreground">@{author.username}</span>
            </div>
          )}
          <p className="text-foreground/90 whitespace-pre-wrap">
            <TweetText text={text} />
          </p>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
            {impressionCount !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {impressionCount.toLocaleString()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {likeCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              {retweetCount.toLocaleString()}
            </span>
            {matchedKeywords && matchedKeywords.length > 0 && (
              <div className="flex gap-1">
                {matchedKeywords.map((kw) => (
                  <span key={kw} className="px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {score !== undefined && (
          <div className="text-lg font-bold text-primary flex-shrink-0">
            {score.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
}
