import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchStats, fetchAccounts } from '../api';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg p-6 bg-card border border-border">
      <div className="text-4xl font-bold text-foreground">{value.toLocaleString()}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const { data: seeds } = useQuery({
    queryKey: ['seeds'],
    queryFn: () => fetchAccounts(true),
  });

  if (statsLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Twitter/X account network analysis</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Accounts" value={stats?.accounts || 0} />
        <StatCard label="Seeds" value={stats?.seeds || 0} />
        <StatCard label="Tweets" value={stats?.tweets || 0} />
        <StatCard label="Connections" value={stats?.follows || 0} />
        <StatCard label="Keywords" value={stats?.keywords || 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Seed Accounts</h2>
          {seeds?.accounts.length === 0 ? (
            <p className="text-muted-foreground">
              No seed accounts yet.{' '}
              <Link to="/scrape" className="text-primary hover:underline">
                Add one
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {seeds?.accounts.map((account) => (
                <Link
                  key={account.id}
                  to={`/accounts/${account.username}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  {account.profile_image_url && (
                    <img
                      src={account.profile_image_url}
                      alt={account.username}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {account.name || account.username}
                    </div>
                    <div className="text-sm text-muted-foreground">@{account.username}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {account.followers_count.toLocaleString()} followers
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/scrape"
              className="block p-4 rounded-lg bg-primary hover:bg-primary/90 transition-colors text-primary-foreground text-center font-medium"
            >
              + Scrape New Account
            </Link>
            <Link
              to="/graph"
              className="block p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-secondary-foreground text-center font-medium"
            >
              View Network Graph
            </Link>
            <Link
              to="/accounts"
              className="block p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-secondary-foreground text-center font-medium"
            >
              Browse All Accounts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
