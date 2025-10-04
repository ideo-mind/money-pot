import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PotCard } from "@/components/PotCard";
import { usePotStore } from "@/store/pot-store";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Lock } from "lucide-react";
import { useEffect } from "react";
import { PotCardSkeleton } from "@/components/PotCardSkeleton";
export function HomePage() {
  const pots = usePotStore((state) => state.sortedPots);
  const loading = usePotStore((state) => state.loading);
  const fetchPots = usePotStore((state) => state.fetchPots);
  useEffect(() => {
    fetchPots();
  }, [fetchPots]);
  const featuredPots = pots.slice(0, 3);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
      },
    },
  };
  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="py-24 md:py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8"
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-display font-extrabold text-slate-900 dark:text-slate-50 tracking-tight"
            >
              The Ultimate Test of Skill:{" "}
              <span className="text-brand-green">Unlock the Pot</span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300"
            >
              Money Pot is a provably fair gaming dApp on Aptos. Create USDC-funded treasure hunts secured by your mind, or test your skills to win big.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex justify-center gap-4"
            >
              <Button asChild size="lg" className="bg-brand-green hover:bg-brand-green/90 text-white font-bold text-lg px-8 py-6 transition-transform hover:scale-105">
                <Link to="/pots">
                  Browse Pots <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-bold text-lg px-8 py-6 transition-transform hover:scale-105">
                <Link to="/create">Create a Pot</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold">How It Works</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">A simple, fair, and rewarding game of wits.</p>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
          >
            <motion.div variants={itemVariants} className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="bg-brand-green/10 p-4 rounded-full">
                  <img src="https://i.imgur.com/J4q42s0.png" alt="Create Pot Icon" className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold mb-2">1. Create a Pot</h3>
              <p className="text-slate-600 dark:text-slate-300">Deposit USDC and set up a unique, brain-based authentication challenge. You earn from every attempt.</p>
            </motion.div>
            <motion.div variants={itemVariants} className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="bg-brand-gold/10 p-4 rounded-full">
                  <BrainCircuit className="w-12 h-12 text-brand-gold" />
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold mb-2">2. Solve the Challenge</h3>
              <p className="text-slate-600 dark:text-slate-300">Pay a small entry fee and attempt to solve the puzzle. Success means a hefty reward.</p>
            </motion.div>
            <motion.div variants={itemVariants} className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="bg-slate-500/10 p-4 rounded-full">
                  <Lock className="w-12 h-12 text-slate-500" />
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold mb-2">3. Provably Fair</h3>
              <p className="text-slate-600 dark:text-slate-300">Game theory ensures creators can't cheat. Honesty is the most profitable strategy for everyone.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      {/* Featured Pots Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold">Featured Pots</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Try your luck with these popular treasure hunts.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <PotCardSkeleton key={i} />)
              : featuredPots.length > 0 ? featuredPots.map((pot) => (
                  <PotCard key={pot.id} pot={pot} />
                )) : (
                  <div className="col-span-full text-center py-16">
                    <div className="text-6xl mb-4">🏺</div>
                    <h3 className="text-2xl font-display font-bold mb-2">No Featured Pots</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-8">
                      No treasure hunts are available yet. Create the first one!
                    </p>
                    <Button asChild size="lg">
                      <Link to="/create">Create Your First Pot</Link>
                    </Button>
                  </div>
                )}
          </div>
          <div className="mt-16 text-center">
            <Button asChild size="lg" variant="outline" className="font-bold">
              <Link to="/pots">
                View All Pots <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}