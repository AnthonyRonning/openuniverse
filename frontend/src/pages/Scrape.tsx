import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { scrapeAccount } from '../api';

export default function Scrape() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: scrapeAccount,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['seeds'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });

      if (data.account) {
        navigate(`/accounts/${data.account.username}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.replace('@', '').trim();
    if (cleanUsername) {
      mutation.mutate(cleanUsername);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Scrape Account</h1>
        <p className="text-muted-foreground mt-2">
          Add a Twitter/X account to track. This will fetch their profile, recent tweets, and network connections.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Twitter Username
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full pl-8 pr-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                disabled={mutation.isPending}
              />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending || !username.trim()}
              className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-medium transition-colors"
            >
              {mutation.isPending ? 'Scraping...' : 'Scrape'}
            </button>
          </div>
        </div>
      </form>

      {mutation.isPending && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            <div>
              <p className="text-primary font-medium">Scraping @{username.replace('@', '')}...</p>
              <p className="text-primary/60 text-sm">
                Fetching profile, tweets, followers, and following
              </p>
            </div>
          </div>
        </div>
      )}

      {mutation.isError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">Failed to scrape account. Please check the username and try again.</p>
        </div>
      )}

      {mutation.isSuccess && mutation.data && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
          <p className="text-green-400 font-medium">Scrape complete!</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-card/50 rounded p-3">
              <div className="text-2xl font-bold text-foreground">{mutation.data.stats.tweets_added}</div>
              <div className="text-muted-foreground">Tweets added</div>
            </div>
            <div className="bg-card/50 rounded p-3">
              <div className="text-2xl font-bold text-foreground">{mutation.data.stats.following_added}</div>
              <div className="text-muted-foreground">Following added</div>
            </div>
            <div className="bg-card/50 rounded p-3">
              <div className="text-2xl font-bold text-foreground">{mutation.data.stats.followers_added}</div>
              <div className="text-muted-foreground">Followers added</div>
            </div>
            <div className="bg-card/50 rounded p-3">
              <div className="text-2xl font-bold text-foreground">{mutation.data.stats.connections_scraped}</div>
              <div className="text-muted-foreground">Networks scraped</div>
            </div>
          </div>
          {mutation.data.stats.errors.length > 0 && (
            <div className="text-yellow-400 text-sm">
              Some errors occurred: {mutation.data.stats.errors.join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">What gets scraped?</h2>
        <ul className="space-y-2 text-muted-foreground text-sm">
          <li className="flex items-start gap-2">
            <span className="text-primary">+</span>
            Profile information (name, bio, location, metrics)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">+</span>
            Recent tweets (up to 5 for prototype)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">+</span>
            Following accounts (up to 3 for prototype)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">+</span>
            Follower accounts (up to 3 for prototype)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">+</span>
            Tweets from discovered accounts
          </li>
        </ul>
      </div>
    </div>
  );
}
