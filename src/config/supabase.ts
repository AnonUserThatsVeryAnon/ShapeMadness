import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwmcfjadpjcdrpopoeor.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bWNmamFkcGpjZHJwb3BvZW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MDU2MDMsImV4cCI6MjA4MTI4MTYwM30.VSbS2lkomazlKHqZBEWpUDJjDaBySGHwTOmGOr-GzH8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface LeaderboardEntry {
  id: number;
  player_name: string;
  score: number;
  wave: number;
  created_at: string;
}

export async function submitScore(playerName: string, score: number, wave: number) {
  const { data, error } = await supabase
    .from('leaderboard')
    .insert([{ player_name: playerName, score, wave }])
    .select();

  if (error) {
    console.error('Error submitting score:', error);
    return null;
  }

  return data;
}

export async function getTopScores(limit: number = 10) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return data as LeaderboardEntry[];
}
