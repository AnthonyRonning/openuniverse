import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { fetchCamp, fetchCampLeaderboard } from '../api';

export default function CampDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: camp, isLoading } = useQuery({
    queryKey: ['camp', slug],
    queryFn: () => fetchCamp(slug!),
    enabled: !!slug,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', slug],
    queryFn: () => fetchCampLeaderboard(slug!),
    enabled: !!slug,
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (!camp) return <div className="text-red-400">Camp not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div
          className="w-4 h-12 rounded"
          style={{ backgroundColor: camp.color }}
        />
        <div>
          <h1 className="text-3xl font-bold text-white">{camp.name}</h1>
          <p className="text-gray-400 mt-1">{camp.description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="md:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {leaderboard?.entries.length === 0 ? (
              <div className="p-4 text-gray-500">No accounts with scores yet</div>
            ) : (
              leaderboard?.entries.map((entry) => (
                <Link
                  key={entry.account.id}
                  to={`/accounts/${entry.account.username}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-2xl font-bold text-gray-500 w-8">{entry.rank}</span>
                  {entry.account.profile_image_url ? (
                    <img src={entry.account.profile_image_url} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {entry.account.name || entry.account.username}
                    </div>
                    <div className="text-sm text-gray-400">@{entry.account.username}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: camp.color }}>
                      {entry.score.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">
                      bio: {entry.bio_score.toFixed(1)} / tweets: {entry.tweet_score.toFixed(1)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Keywords */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Keywords ({camp.keywords.length})</h2>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {camp.keywords.map((kw) => (
              <div
                key={kw.id}
                className="flex items-center justify-between p-2 rounded bg-gray-800/50"
              >
                <span className="text-white">{kw.term}</span>
                <span className="text-sm text-gray-400">×{kw.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
