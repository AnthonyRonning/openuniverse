const API_BASE = '/api';

export interface Account {
  id: number;
  username: string;
  name: string | null;
  description: string | null;
  location: string | null;
  profile_image_url: string | null;
  verified: boolean;
  verified_type: string | null;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  like_count: number;
  is_seed: boolean;
}

export interface Tweet {
  id: number;
  account_id: number;
  text: string;
  twitter_created_at: string | null;
  retweet_count: number;
  reply_count: number;
  like_count: number;
  quote_count: number;
}

export interface GraphNode {
  id: string;
  username: string;
  name: string | null;
  is_seed: boolean;
  followers_count: number;
  following_count: number;
  profile_image_url: string | null;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Stats {
  accounts: number;
  seeds: number;
  tweets: number;
  follows: number;
  keywords: number;
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}

export async function fetchAccounts(seedsOnly = false): Promise<{ accounts: Account[]; total: number }> {
  const url = seedsOnly ? `${API_BASE}/accounts?seeds_only=true` : `${API_BASE}/accounts`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchAccount(username: string): Promise<Account> {
  const res = await fetch(`${API_BASE}/accounts/${username}`);
  if (!res.ok) throw new Error('Account not found');
  return res.json();
}

export async function fetchAccountTweets(username: string): Promise<{ tweets: Tweet[]; total: number }> {
  const res = await fetch(`${API_BASE}/accounts/${username}/tweets`);
  return res.json();
}

export async function fetchAccountFollowing(username: string): Promise<{ accounts: Account[]; total: number }> {
  const res = await fetch(`${API_BASE}/accounts/${username}/following`);
  return res.json();
}

export async function fetchAccountFollowers(username: string): Promise<{ accounts: Account[]; total: number }> {
  const res = await fetch(`${API_BASE}/accounts/${username}/followers`);
  return res.json();
}

export async function fetchGraph(): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/graph`);
  return res.json();
}

export async function scrapeAccount(username: string): Promise<{ account: Account | null; stats: any }> {
  const res = await fetch(`${API_BASE}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  return res.json();
}
