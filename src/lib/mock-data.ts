import { LeaderboardUser, Pot } from "@/types";
// Removed mockPots array - no longer needed
export const mockLeaderboardData: { topCreators: LeaderboardUser[], topHunters: LeaderboardUser[] } = {
  topCreators: [
    { rank: 1, avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=creator1', username: '0x...a4f2', amount: 25000 },
    { rank: 2, avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=creator2', username: '0x...b8e1', amount: 18500 },
    { rank: 3, avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=creator3', username: '0x...c9d3', amount: 15200 },
    { rank: 4, avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=creator4', username: '0x...d7c4', amount: 11000 },
    { rank: 5, avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=creator5', username: '0x...e6b5', amount: 9800 },
  ],
  topHunters: [
    { rank: 1, avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=hunter1', username: '0x...f5a6', amount: 12000 },
    { rank: 2, avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=hunter2', username: '0x...1b97', amount: 10500 },
    { rank: 3, avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=hunter3', username: '0x...2c88', amount: 8900 },
    { rank: 4, avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=hunter4', username: '0x...3d79', amount: 7200 },
    { rank: 5, avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=hunter5', username: '0x...4e6a', amount: 6100 },
  ]
};
// Removed initialMockPots - no longer needed