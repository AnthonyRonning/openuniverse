import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchCamps, fetchCampLeaderboard, analyzeAccounts, createCamp } from '../api';
import { useState } from 'react';

function CampCard({ camp }: { camp: { id: number; name: string; description: string | null; color: string } }) {
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', camp.id],
    queryFn: () => fetchCampLeaderboard(camp.id),
  });

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border" style={{ borderLeftColor: camp.color, borderLeftWidth: 4 }}>
        <h2 className="text-xl font-bold text-foreground">{camp.name}</h2>
        <p className="text-muted-foreground text-sm mt-1">{camp.description || 'No description'}</p>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Accounts</h3>
        {!leaderboard?.entries.length ? (
          <p className="text-muted-foreground text-sm">No accounts analyzed yet</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.entries.slice(0, 5).map((entry) => (
              <Link
                key={entry.account.id}
                to={`/accounts/${entry.account.username}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <span className="text-muted-foreground w-5">{entry.rank}.</span>
                {entry.account.profile_image_url ? (
                  <img src={entry.account.profile_image_url} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted" />
                )}
                <span className="text-foreground flex-1 truncate">@{entry.account.username}</span>
                <span className="text-sm font-medium text-primary">
                  {entry.score.toFixed(1)}
                </span>
              </Link>
            ))}
          </div>
        )}

        <Link
          to={`/camps/${camp.id}`}
          className="block mt-4 text-center text-sm text-primary hover:text-primary/80"
        >
          Manage keywords
        </Link>
      </div>
    </div>
  );
}

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Camps() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCamp, setNewCamp] = useState({ name: '', description: '', color: COLORS[0] });

  const { data, isLoading } = useQuery({
    queryKey: ['camps'],
    queryFn: fetchCamps,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeAccounts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: createCamp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      setShowCreateForm(false);
      setNewCamp({ name: '', description: '', color: COLORS[0] });
    },
  });

  const handleCreateCamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCamp.name) {
      createMutation.mutate(newCamp);
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Camps</h1>
          <p className="text-muted-foreground mt-1">
            Create categories to analyze accounts based on keywords
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
          >
            + New Camp
          </button>
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-medium transition-colors"
          >
            {analyzeMutation.isPending ? 'Analyzing...' : 'Re-analyze All'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateCamp} className="bg-card rounded-lg p-6 border border-border space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Create New Camp</h2>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Name</label>
            <input
              type="text"
              value={newCamp.name}
              onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })}
              placeholder="e.g., Republican, Pro-Crypto, Sports Fan"
              className="w-full px-3 py-2 rounded bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Description (optional)</label>
            <input
              type="text"
              value={newCamp.description}
              onChange={(e) => setNewCamp({ ...newCamp, description: e.target.value })}
              placeholder="What does this camp represent?"
              className="w-full px-3 py-2 rounded bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCamp({ ...newCamp, color })}
                  className={`w-8 h-8 rounded-full border-2 ${newCamp.color === color ? 'border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newCamp.name || createMutation.isPending}
              className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:bg-muted text-white font-medium"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Camp'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded bg-secondary hover:bg-secondary/80 text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {analyzeMutation.isSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-green-400">
            Analyzed {analyzeMutation.data.analyzed} accounts, created {analyzeMutation.data.total_scores} scores
          </p>
        </div>
      )}

      {data?.camps.length === 0 ? (
        <div className="bg-card rounded-lg p-8 border border-border text-center">
          <p className="text-muted-foreground mb-4">No camps yet. Create your first camp to start categorizing accounts!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            + Create First Camp
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {data?.camps.map((camp) => (
            <CampCard key={camp.id} camp={camp} />
          ))}
        </div>
      )}
    </div>
  );
}
