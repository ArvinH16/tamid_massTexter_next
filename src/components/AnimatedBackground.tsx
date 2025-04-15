'use client';

import { motion } from 'framer-motion';

export default function AnimatedBackground({
    children,
    zIndex = 5,
}: {
    children: React.ReactNode;
    zIndex?: number;
}) {
    return (
        <div className="relative min-h-screen">
            {children}
            <div
                className="pointer-events-none fixed inset-0 overflow-hidden"
                style={{ zIndex }}
            >
                <motion.div
                    className="absolute top-[-5%] left-[-2.5%] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] md:w-[500px] md:h-[500px] md:top-[-10%] md:left-[-5%] rounded-full bg-gray-800 opacity-20 blur-[20px] sm:blur-[30px] md:blur-[40px]"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.3, 0.2],
                        x: [0, 100, -50, 0],
                        y: [0, -100, 50, 0],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute bottom-[-5%] right-[-2.5%] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] md:w-[500px] md:h-[500px] md:bottom-[-10%] md:right-[-5%] rounded-full bg-black opacity-20 blur-[20px] sm:blur-[30px] md:blur-[40px]"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.35, 0.2],
                        x: [0, -150, 100, 0],
                        y: [0, 150, -100, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute top-[30%] left-[20%] w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] rounded-full bg-gray-900 opacity-20 blur-[20px] sm:blur-[30px] md:blur-[40px]"
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.25, 0.2],
                        x: [0, 80, -120, 0],
                        y: [0, -80, 120, 0],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                />
            </div>
        </div>
    );
} 