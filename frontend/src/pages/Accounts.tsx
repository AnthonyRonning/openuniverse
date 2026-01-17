import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { fetchAccounts } from '../api';

export default function Accounts() {
  const [seedsOnly, setSeedsOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', seedsOnly],
    queryFn: () => fetchAccounts(seedsOnly),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Accounts</h1>
          <p className="text-gray-400 mt-1">
            {data?.total || 0} accounts in database
          </p>
        </div>
        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={seedsOnly}
            onChange={(e) => setSeedsOnly(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          Seeds only
        </label>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {data?.accounts.map((account) => (
            <Link
              key={account.id}
              to={`/accounts/${account.username}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              {account.profile_image_url ? (
                <img
                  src={account.profile_image_url}
                  alt={account.username}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                  ?
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">
                    {account.name || account.username}
                  </span>
                  {account.is_seed && (
                    <span className="px-2 py-0.5 text-xs rounded bg-purple-600 text-white">
                      SEED
                    </span>
                  )}
                  {account.verified && (
                    <span className="text-blue-400">✓</span>
                  )}
                </div>
                <div className="text-sm text-gray-400">@{account.username}</div>
                {account.description && (
                  <div className="text-sm text-gray-500 truncate mt-1">
                    {account.description}
                  </div>
                )}
              </div>
              <div className="text-right text-sm">
                <div className="text-white">{account.followers_count.toLocaleString()}</div>
                <div className="text-gray-500">followers</div>
              </div>
              <div className="text-right text-sm">
                <div className="text-white">{account.following_count.toLocaleString()}</div>
                <div className="text-gray-500">following</div>
              </div>
              <div className="text-right text-sm">
                <div className="text-white">{account.tweet_count.toLocaleString()}</div>
                <div className="text-gray-500">tweets</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
