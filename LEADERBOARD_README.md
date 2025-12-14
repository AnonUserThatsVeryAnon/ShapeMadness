# Leaderboard System

This game now features a global leaderboard powered by Supabase!

## Features

- **Score Submission**: When you die, enter your name to submit your score
- **Global Leaderboard**: View top 10 scores from all players
- **Real-time Data**: Scores are stored and retrieved in real-time
- **Beautiful UI**: Styled leaderboard with rankings and medals for top 3 players

## How It Works

### For Players

1. **Play the Game**: Survive as long as you can!
2. **Game Over**: When you die, a name input screen appears
3. **Submit Score**: Enter your name (2-20 characters) to submit
4. **Skip Option**: You can skip submission if you prefer
5. **View Leaderboard**: Click "🏆 LEADERBOARD" from the main menu

### Technical Implementation

The leaderboard uses:

- **Supabase**: Backend database and real-time API
- **React Components**:
  - `NameInputScreen`: Score submission after death
  - `LeaderboardMenu`: Display top scores
- **API Integration**: `supabase.ts` config file

## Database Schema

```sql
leaderboard (
  id: bigint (auto-generated)
  player_name: text
  score: integer
  wave: integer
  created_at: timestamp
)
```

## Setup

The leaderboard is already configured and ready to use! Your Supabase project is connected:

- Project: `https://nwmcfjadpjcdrpopoeor.supabase.co`
- Table: `leaderboard` (ensure it's created using `supabase_setup.sql`)

## Files Added/Modified

### New Files

- `src/config/supabase.ts` - Supabase client and API functions
- `src/components/NameInputScreen.tsx` - Score submission UI
- `src/components/NameInputScreen.css` - Score submission styling
- `src/components/LeaderboardMenu.tsx` - Leaderboard display
- `src/components/LeaderboardMenu.css` - Leaderboard styling
- `supabase_setup.sql` - Database setup script

### Modified Files

- `src/App.tsx` - Integrated leaderboard flow
- `src/components/GameMenu.tsx` - Added leaderboard button

## Future Enhancements

Possible improvements:

- Filters (daily, weekly, all-time)
- Player profiles
- Social sharing
- Score verification
- Difficulty modes with separate leaderboards
- Regional leaderboards

## Security

- Row Level Security (RLS) enabled
- Public read access to leaderboard
- Public insert access for score submission
- No update/delete permissions (scores are permanent)
