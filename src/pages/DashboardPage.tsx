import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { PotCard } from "@/components/PotCard";
import { PotCardSkeleton } from "@/components/PotCardSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePotStore } from "@/store/pot-store";
import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { PartyPopper, ShieldClose, Trophy, Package, Target } from "lucide-react";
const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);
export function DashboardPage() {
  const { account, connected } = useWallet();
  const allPots = usePotStore((state) => state.pots);
  const attempts = usePotStore((state) => state.attempts);
  const loading = usePotStore((state) => state.loading);
  const fetchPots = usePotStore((state) => state.fetchPots);
  useEffect(() => {
    if (connected) {
      fetchPots();
    }
  }, [connected, fetchPots]);
  const myCreatedPots = useMemo(() => {
    if (!account) return [];
    return allPots.filter(pot => pot.creator === account.address.toString());
  }, [allPots, account]);
  const stats = useMemo(() => {
    const wins = attempts.filter(a => a.status === 'won').length;
    const totalAttempts = attempts.length;
    const winRate = totalAttempts > 0 ? ((wins / totalAttempts) * 100).toFixed(0) + '%' : 'N/A';
    return {
      potsCreated: myCreatedPots.length,
      totalAttempts,
      winRate,
    };
  }, [myCreatedPots, attempts]);
  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold">My Dashboard</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          Please connect your wallet to view your dashboard.
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold">My Dashboard</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          Track your created pots and attempt history.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard title="Pots Created" value={stats.potsCreated} icon={Package} />
        <StatCard title="Total Attempts" value={stats.totalAttempts} icon={Target} />
        <StatCard title="Win Rate" value={stats.winRate} icon={Trophy} />
      </div>
      <Tabs defaultValue="created" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="created">My Created Pots</TabsTrigger>
          <TabsTrigger value="attempts">My Attempts</TabsTrigger>
        </TabsList>
        <TabsContent value="created" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading && Array.from({ length: 3 }).map((_, i) => <PotCardSkeleton key={i} />)}
            {!loading && myCreatedPots.length === 0 && (
              <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-slate-500">You haven't created any pots yet.</p>
              </div>
            )}
            {!loading && myCreatedPots.map((pot) => (
              <PotCard key={pot.id} pot={pot} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="attempts" className="mt-8">
          {attempts.length === 0 ? (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-slate-500">You haven't attempted any pots yet.</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Attempt History</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {attempts.map((attempt, index) => (
                    <li key={index} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-4">
                        {attempt.status === 'won' ? <PartyPopper className="w-6 h-6 text-brand-gold" /> : <ShieldClose className="w-6 h-6 text-destructive" />}
                        <div>
                          <Link to={`/pots/${attempt.potId}`} className="font-semibold hover:underline">{attempt.potTitle}</Link>
                          <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(attempt.date), { addSuffix: true })}</p>
                        </div>
                      </div>
                      <Badge variant={attempt.status === 'won' ? 'default' : 'destructive'} className={attempt.status === 'won' ? 'bg-brand-green' : ''}>
                        {attempt.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}