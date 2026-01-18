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
          <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            {data?.total || 0} accounts in database
          </p>
        </div>
        <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
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
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {data?.accounts.map((account) => (
            <Link
              key={account.id}
              to={`/accounts/${account.username}`}
              className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors overflow-hidden"
            >
              {account.profile_image_url ? (
                <img
                  src={account.profile_image_url}
                  alt={account.username}
                  className="w-11 h-11 rounded-full shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  ?
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">
                    {account.name || account.username}
                  </span>
                  {account.is_seed && (
                    <span className="px-2 py-0.5 text-xs rounded bg-primary text-primary-foreground shrink-0">
                      SEED
                    </span>
                  )}
                  {account.verified && (
                    <span className="text-primary shrink-0">✓</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">@{account.username}</div>
                {account.description && (
                  <div className="text-sm text-muted-foreground/70 truncate mt-1">
                    {account.description}
                  </div>
                )}
              </div>
              <div className="text-right text-sm shrink-0">
                <div className="text-foreground">{account.followers_count.toLocaleString()}</div>
                <div className="text-muted-foreground">followers</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
