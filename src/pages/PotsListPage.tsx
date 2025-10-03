import { PotCard } from "@/components/PotCard";
import { PotCardSkeleton } from "@/components/PotCardSkeleton";
import { usePotStore } from "@/store/pot-store";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
export function PotsListPage() {
  const pots = usePotStore((state) => state.pots);
  const loading = usePotStore((state) => state.loading);
  const error = usePotStore((state) => state.error);
  const fetchPots = usePotStore((state) => state.fetchPots);
  useEffect(() => {
    fetchPots();
  }, [fetchPots]);
  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold">Money Pots</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Browse all available treasure hunts. May the sharpest mind win.</p>
      </div>
      {error && <div className="text-center text-red-500">{error}</div>}
      {!loading && !error && pots.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏺</div>
          <h3 className="text-2xl font-display font-bold mb-2">No Pots Available</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-8">
            There are no active treasure hunts at the moment. Be the first to create one!
          </p>
          <Button asChild size="lg">
            <Link to="/create">Create Your First Pot</Link>
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <PotCardSkeleton key={i} />)
          : pots.map((pot) => (
              <PotCard key={pot.id} pot={pot} />
            ))}
      </div>
    </div>
  );
}