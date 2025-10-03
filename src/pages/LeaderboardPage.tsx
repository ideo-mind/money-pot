import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockLeaderboardData } from "@/lib/mock-data";
import { LeaderboardUser } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Trophy } from "lucide-react";
const LeaderboardTable = ({ users, title }: { users: LeaderboardUser[], title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Trophy className="w-6 h-6 text-brand-gold" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-4">
        {users.map((user, index) => (
          <li
            key={user.rank}
            className={`flex items-center p-3 rounded-lg transition-all ${
              index === 0 ? 'bg-brand-gold/20' : 'bg-slate-50 dark:bg-slate-900/50'
            }`}
          >
            <div className="flex items-center gap-4 w-1/3">
              <span className="font-bold text-lg w-6 text-center">{user.rank}</span>
              {user.rank === 1 && <Crown className="w-5 h-5 text-amber-500" />}
            </div>
            <div className="flex items-center gap-3 flex-grow">
              <Avatar>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.username.slice(2, 4)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{user.username}</span>
            </div>
            <span className="font-bold text-brand-green text-right">${user.amount.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);
export function LeaderboardPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold">Leaderboard</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          See who's dominating the world of Money Pot.
        </p>
      </div>
      <Tabs defaultValue="creators" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="creators">Top Creators</TabsTrigger>
          <TabsTrigger value="hunters">Top Hunters</TabsTrigger>
        </TabsList>
        <TabsContent value="creators" className="mt-8">
          <LeaderboardTable users={mockLeaderboardData.topCreators} title="Top Creators (by Pot Value)" />
        </TabsContent>
        <TabsContent value="hunters" className="mt-8">
          <LeaderboardTable users={mockLeaderboardData.topHunters} title="Top Hunters (by Winnings)" />
        </TabsContent>
      </Tabs>
    </div>
  );
}