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
        <h1 className="text-3xl font-bold text-white">Scrape Account</h1>
        <p className="text-gray-400 mt-2">
          Add a Twitter/X account to track. This will fetch their profile, recent tweets, and network connections.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Twitter Username
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full pl-8 pr-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                disabled={mutation.isPending}
              />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending || !username.trim()}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {mutation.isPending ? 'Scraping...' : 'Scrape'}
            </button>
          </div>
        </div>
      </form>

      {mutation.isPending && (
        <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <div>
              <p className="text-blue-400 font-medium">Scraping @{username.replace('@', '')}...</p>
              <p className="text-blue-400/60 text-sm">
                Fetching profile, tweets, followers, and following
              </p>
            </div>
          </div>
        </div>
      )}

      {mutation.isError && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
          <p className="text-red-400">Failed to scrape account. Please check the username and try again.</p>
        </div>
      )}

      {mutation.isSuccess && mutation.data && (
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 space-y-3">
          <p className="text-green-400 font-medium">Scrape complete!</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-2xl font-bold text-white">{mutation.data.stats.tweets_added}</div>
              <div className="text-gray-400">Tweets added</div>
            </div>
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-2xl font-bold text-white">{mutation.data.stats.following_added}</div>
              <div className="text-gray-400">Following added</div>
            </div>
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-2xl font-bold text-white">{mutation.data.stats.followers_added}</div>
              <div className="text-gray-400">Followers added</div>
            </div>
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-2xl font-bold text-white">{mutation.data.stats.connections_scraped}</div>
              <div className="text-gray-400">Networks scraped</div>
            </div>
          </div>
          {mutation.data.stats.errors.length > 0 && (
            <div className="text-yellow-400 text-sm">
              Some errors occurred: {mutation.data.stats.errors.join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-3">What gets scraped?</h2>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            Profile information (name, bio, location, metrics)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            Recent tweets (up to 5 for prototype)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            Following accounts (up to 3 for prototype)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            Follower accounts (up to 3 for prototype)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            Tweets from discovered accounts
          </li>
        </ul>
      </div>
    </div>
  );
}
