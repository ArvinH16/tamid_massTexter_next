'use client';

import { motion } from 'framer-motion';

export default function TransitionAnimation() {
    return (
        <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <motion.div
                    className="w-16 h-16 border-4 border-white rounded-full"
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </motion.div>
        </motion.div>
    );
} 