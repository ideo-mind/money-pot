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
  const hasMorePots = usePotStore((state) => state.hasMorePots);
  const currentBatch = usePotStore((state) => state.currentBatch);
  const totalPots = usePotStore((state) => state.totalPots);
  const fetchPots = usePotStore((state) => state.fetchPots);
  const fetchNextBatch = usePotStore((state) => state.fetchNextBatch);
  const clearCache = usePotStore((state) => state.clearCache);
  useEffect(() => {
    fetchPots();
  }, [fetchPots]);
  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold">Money Pots</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Browse all available treasure hunts, newest first. May the sharpest mind win.</p>
      </div>
      {error && (
        <div className="text-center mb-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            <p className="text-sm text-red-500 dark:text-red-500 mt-2">
              Showing up to 20 most recent pots to avoid rate limits.
            </p>
            <Button 
              onClick={() => fetchPots()} 
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
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
      {loading && (
        <div className="text-center mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              Fetching pot IDs from blockchain...
            </p>
            <p className="text-sm text-blue-500 dark:text-blue-500 mt-2">
              This will start slow batch loading to avoid rate limits.
            </p>
          </div>
        </div>
      )}
      
      {!loading && totalPots > 0 && (
        <div className="text-center mb-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Loading pots in batches of 10 every 100 seconds
            </p>
            <p className="text-sm text-green-500 dark:text-green-500 mt-2">
              Showing {pots.length} of {totalPots} pots
              {hasMorePots && ` • Next batch in ${Math.max(0, 100 - ((Date.now() - (currentBatch * 100000)) / 1000))}s`}
            </p>
            <div className="mt-3 space-x-2">
              {hasMorePots && (
                <Button 
                  onClick={() => fetchNextBatch()} 
                  variant="outline" 
                  size="sm"
                >
                  Load Next Batch Now
                </Button>
              )}
              <Button 
                onClick={() => clearCache()} 
                variant="outline" 
                size="sm"
              >
                Clear Cache
              </Button>
            </div>
          </div>
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