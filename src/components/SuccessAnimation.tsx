import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
export function SuccessAnimation() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };
  const circleVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };
  const checkVariants = {
    hidden: { pathLength: 0 },
    visible: {
      pathLength: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut" as const,
      },
    },
  };
  return (
    <motion.div
      className="flex flex-col items-center justify-center p-8 space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="w-24 h-24 bg-brand-green rounded-full flex items-center justify-center"
        variants={circleVariants}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path d="M20 6 9 17l-5-5" variants={checkVariants} />
        </motion.svg>
      </motion.div>
      <h3 className="text-2xl font-display font-bold">Pot Created!</h3>
      <p className="text-muted-foreground">Your treasure hunt is now live.</p>
    </motion.div>
  );
}