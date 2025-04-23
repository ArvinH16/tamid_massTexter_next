'use client';

import { motion } from 'framer-motion';

export default function TransitionAnimation() {
    return (
        <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
        >
            <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                <motion.div
                    className="w-12 h-12 border-3 border-white rounded-full"
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </motion.div>
        </motion.div>
    );
} 