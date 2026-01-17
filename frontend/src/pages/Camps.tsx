import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchCamps, fetchCampLeaderboard, analyzeAccounts } from '../api';
import { useState } from 'react';

function CampCard({ camp }: { camp: { id: number; name: string; slug: string; description: string | null; color: string } }) {
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', camp.slug],
    queryFn: () => fetchCampLeaderboard(camp.slug),
  });

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800" style={{ borderLeftColor: camp.color, borderLeftWidth: 4 }}>
        <h2 className="text-xl font-bold text-white">{camp.name}</h2>
        <p className="text-gray-400 text-sm mt-1">{camp.description}</p>
      </div>
      
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Top Accounts</h3>
        {!leaderboard?.entries.length ? (
          <p className="text-gray-500 text-sm">No accounts analyzed yet</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.entries.slice(0, 5).map((entry) => (
              <Link
                key={entry.account.id}
                to={`/accounts/${entry.account.username}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-500 w-5">{entry.rank}.</span>
                {entry.account.profile_image_url ? (
                  <img src={entry.account.profile_image_url} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-700" />
                )}
                <span className="text-white flex-1 truncate">@{entry.account.username}</span>
                <span className="text-sm font-medium" style={{ color: camp.color }}>
                  {entry.score.toFixed(1)}
                </span>
              </Link>
            ))}
          </div>
        )}
        
        <Link
          to={`/camps/${camp.slug}`}
          className="block mt-4 text-center text-sm text-blue-400 hover:text-blue-300"
        >
          View full leaderboard →
        </Link>
      </div>
    </div>
  );
}

export default function Camps() {
  const queryClient = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['camps'],
    queryFn: fetchCamps,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeAccounts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setAnalyzing(false);
    },
  });

  const handleAnalyze = () => {
    setAnalyzing(true);
    analyzeMutation.mutate();
  };

  if (isLoading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Camps</h1>
          <p className="text-gray-400 mt-1">
            Categorize accounts based on content analysis
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing || analyzeMutation.isPending}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium transition-colors"
        >
          {analyzing || analyzeMutation.isPending ? 'Analyzing...' : 'Re-analyze All'}
        </button>
      </div>

      {analyzeMutation.isSuccess && (
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
          <p className="text-green-400">
            Analyzed {analyzeMutation.data.analyzed} accounts, created {analyzeMutation.data.total_scores} scores
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {data?.camps.map((camp) => (
          <CampCard key={camp.id} camp={camp} />
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-3">How it works</h2>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li>• Each camp has a set of keywords with weights</li>
          <li>• Analysis scans account bios (2x weight) and tweets</li>
          <li>• Matches are counted and weighted to produce a score</li>
          <li>• Higher scores indicate stronger camp membership</li>
          <li>• Click any account to see detailed match breakdown</li>
        </ul>
      </div>
    </div>
  );
}
