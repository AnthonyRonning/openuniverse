import { Link } from 'react-router-dom';
import { scrapeAccount } from '../api';

interface TweetTextProps {
  text: string;
  className?: string;
}

type Part = 
  | { type: 'text'; value: string }
  | { type: 'mention'; value: string }
  | { type: 'link'; url: string; display: string };

export function TweetText({ text, className = '' }: TweetTextProps) {
  // Combined regex for mentions and URLs
  const tokenRegex = /@(\w+)|(https?:\/\/[^\s]+)/g;
  const parts: Part[] = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    
    if (match[1]) {
      // It's a mention
      parts.push({ type: 'mention', value: match[1] });
    } else if (match[2]) {
      // It's a URL
      const url = match[2];
      // Clean up trailing punctuation that might have been captured
      const cleanUrl = url.replace(/[.,;:!?)]+$/, '');
      const trailingPunct = url.slice(cleanUrl.length);
      
      // Create display text (shortened)
      let display = cleanUrl;
      try {
        const parsed = new URL(cleanUrl);
        display = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
        if (display.length > 30) {
          display = display.slice(0, 30) + '...';
        }
      } catch {
        // Keep original if URL parsing fails
      }
      
      parts.push({ type: 'link', url: cleanUrl, display });
      
      // Add back trailing punctuation as text
      if (trailingPunct) {
        parts.push({ type: 'text', value: trailingPunct });
      }
      lastIndex = match.index + match[0].length;
      continue;
    }
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  const handleMentionClick = async (username: string) => {
    // Fire and forget - scrape in background if not already scraped
    try {
      await scrapeAccount(username);
    } catch (e) {
      // Ignore errors - user will see "not found" if account doesn't exist
    }
  };

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === 'mention') {
          return (
            <Link
              key={i}
              to={`/accounts/${part.value}`}
              onClick={() => handleMentionClick(part.value)}
              className="text-primary hover:underline"
            >
              @{part.value}
            </Link>
          );
        } else if (part.type === 'link') {
          return (
            <a
              key={i}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {part.display}
            </a>
          );
        } else {
          return <span key={i}>{part.value}</span>;
        }
      })}
    </span>
  );
}
