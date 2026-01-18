import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { fetchCamp, fetchCampLeaderboard, fetchCampTopTweets, addKeyword, deleteKeyword, deleteCamp } from '../api';

export default function CampDetail() {
  const { id } = useParams<{ id: string }>();
  const campId = parseInt(id!, 10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newKeyword, setNewKeyword] = useState('');
  const [newWeight, setNewWeight] = useState('1.0');
  const [newSentiment, setNewSentiment] = useState<'positive' | 'negative' | 'any'>('any');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'tweets'>('leaderboard');

  const { data: camp, isLoading } = useQuery({
    queryKey: ['camp', campId],
    queryFn: () => fetchCamp(campId),
    enabled: !isNaN(campId),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', campId],
    queryFn: () => fetchCampLeaderboard(campId),
    enabled: !isNaN(campId),
  });

  const { data: topTweets } = useQuery({
    queryKey: ['camp-tweets', campId],
    queryFn: () => fetchCampTopTweets(campId),
    enabled: !isNaN(campId),
  });

  const addKeywordMutation = useMutation({
    mutationFn: (data: { term: string; weight: number; expected_sentiment: 'positive' | 'negative' | 'any' }) => addKeyword(campId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camp', campId] });
      setNewKeyword('');
      setNewWeight('1.0');
      setNewSentiment('any');
    },
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: (keywordId: number) => deleteKeyword(campId, keywordId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['camp', campId] }),
  });

  const deleteCampMutation = useMutation({
    mutationFn: () => deleteCamp(campId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      navigate('/camps');
    },
  });

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      addKeywordMutation.mutate({ 
        term: newKeyword.trim(), 
        weight: parseFloat(newWeight) || 1.0,
        expected_sentiment: newSentiment,
      });
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!camp) return <div className="text-destructive">Camp not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-4 h-12 rounded" style={{ backgroundColor: camp.color }} />
          <div>
            <h1 className="text-3xl font-bold text-foreground">{camp.name}</h1>
            <p className="text-muted-foreground mt-1">{camp.description || 'No description'}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
        >
          Delete Camp
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive mb-3">Delete this camp? All keywords and scores will be removed.</p>
          <div className="flex gap-2">
            <button
              onClick={() => deleteCampMutation.mutate()}
              className="px-4 py-2 rounded bg-destructive text-white hover:bg-destructive/90"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 rounded bg-secondary text-foreground hover:bg-secondary/80"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content with tabs */}
        <div className="md:col-span-2 bg-card rounded-lg border border-border overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'leaderboard'
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Top Accounts ({leaderboard?.entries.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('tweets')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'tweets'
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Top Tweets ({topTweets?.tweets.length || 0})
            </button>
          </div>

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="divide-y divide-border">
              {leaderboard?.entries.length === 0 ? (
                <div className="p-4 text-muted-foreground">No accounts with scores yet. Add keywords and run analysis!</div>
              ) : (
                leaderboard?.entries.map((entry) => (
                  <Link
                    key={entry.account.id}
                    to={`/accounts/${entry.account.username}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-2xl font-bold text-muted-foreground w-8">{entry.rank}</span>
                    {entry.account.profile_image_url ? (
                      <img src={entry.account.profile_image_url} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {entry.account.name || entry.account.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{entry.account.username} · {entry.account.followers_count.toLocaleString()} followers
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        {entry.score.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        bio: {entry.bio_score.toFixed(1)} / tweets: {entry.tweet_score.toFixed(1)}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Tweets Tab */}
          {activeTab === 'tweets' && (
            <div className="divide-y divide-border">
              {topTweets?.tweets.length === 0 ? (
                <div className="p-4 text-muted-foreground">No matching tweets found. Run analysis to populate tweet matches!</div>
              ) : (
                topTweets?.tweets.map((tweet) => (
                  <div key={tweet.tweet_id} className="p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <Link to={`/accounts/${tweet.username}`}>
                        {tweet.profile_image_url ? (
                          <img src={tweet.profile_image_url} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted" />
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link to={`/accounts/${tweet.username}`} className="font-medium text-foreground hover:underline">
                            {tweet.name || tweet.username}
                          </Link>
                          <span className="text-muted-foreground">@{tweet.username}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <span className="text-muted-foreground text-sm">{tweet.followers_count.toLocaleString()} followers</span>
                        </div>
                        <p className="text-foreground/80 mt-1 whitespace-pre-wrap">{tweet.text}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground">{tweet.like_count} likes</span>
                          <span className="text-xs text-muted-foreground">{tweet.retweet_count} retweets</span>
                          <div className="flex gap-1">
                            {tweet.matched_keywords.map((kw) => (
                              <span
                                key={kw}
                                className="px-2 py-0.5 text-xs rounded bg-primary/20 text-primary"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {tweet.score.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Keywords sidebar */}
        <div className="bg-card rounded-lg border border-border overflow-hidden h-fit">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Keywords ({camp.keywords.length})</h2>
          </div>

          <form onSubmit={handleAddKeyword} className="p-4 border-b border-border space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword..."
                className="flex-1 px-3 py-2 rounded bg-secondary border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
              <input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                step="0.5"
                min="0.5"
                max="5"
                className="w-16 px-2 py-2 rounded bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                title="Weight (higher = stronger signal)"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={newSentiment}
                onChange={(e) => setNewSentiment(e.target.value as 'positive' | 'negative' | 'any')}
                className="flex-1 px-3 py-2 rounded bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              >
                <option value="any">Any sentiment</option>
                <option value="positive">Positive sentiment</option>
                <option value="negative">Negative sentiment</option>
              </select>
              <button
                type="submit"
                disabled={!newKeyword.trim() || addKeywordMutation.isPending}
                className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:bg-muted"
              >
                Add
              </button>
            </div>
          </form>

          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {camp.keywords.length === 0 ? (
              <p className="text-muted-foreground text-sm">No keywords yet. Add some above!</p>
            ) : (
              camp.keywords.map((kw) => (
                <div
                  key={kw.id}
                  className="flex items-center justify-between p-2 rounded bg-secondary/50 group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-foreground truncate">{kw.term}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                      kw.expected_sentiment === 'positive'
                        ? 'bg-green-900/50 text-green-400'
                        : kw.expected_sentiment === 'negative'
                        ? 'bg-red-900/50 text-red-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {kw.expected_sentiment === 'positive' ? 'pos' : kw.expected_sentiment === 'negative' ? 'neg' : 'any'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">x{kw.weight}</span>
                    <button
                      onClick={() => deleteKeywordMutation.mutate(kw.id)}
                      className="text-destructive opacity-0 group-hover:opacity-100 hover:text-destructive/80 transition-opacity"
                    >
                      x
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
