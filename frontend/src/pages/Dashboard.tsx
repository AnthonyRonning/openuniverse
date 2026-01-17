import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchStats, fetchAccounts } from '../api';

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-6 ${color}`}>
      <div className="text-4xl font-bold">{value.toLocaleString()}</div>
      <div className="text-sm opacity-80 mt-1">{label}</div>
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
    return <div className="text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Twitter/X account network analysis</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Accounts" value={stats?.accounts || 0} color="bg-blue-600" />
        <StatCard label="Seeds" value={stats?.seeds || 0} color="bg-purple-600" />
        <StatCard label="Tweets" value={stats?.tweets || 0} color="bg-green-600" />
        <StatCard label="Connections" value={stats?.follows || 0} color="bg-orange-600" />
        <StatCard label="Keywords" value={stats?.keywords || 0} color="bg-pink-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Seed Accounts</h2>
          {seeds?.accounts.length === 0 ? (
            <p className="text-gray-500">
              No seed accounts yet.{' '}
              <Link to="/scrape" className="text-blue-400 hover:underline">
                Add one
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {seeds?.accounts.map((account) => (
                <Link
                  key={account.id}
                  to={`/accounts/${account.username}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                >
                  {account.profile_image_url && (
                    <img
                      src={account.profile_image_url}
                      alt={account.username}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {account.name || account.username}
                    </div>
                    <div className="text-sm text-gray-400">@{account.username}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {account.followers_count.toLocaleString()} followers
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/scrape"
              className="block p-4 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white text-center font-medium"
            >
              + Scrape New Account
            </Link>
            <Link
              to="/graph"
              className="block p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-white text-center font-medium"
            >
              View Network Graph
            </Link>
            <Link
              to="/accounts"
              className="block p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-white text-center font-medium"
            >
              Browse All Accounts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
