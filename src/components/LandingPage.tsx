'use client';

import { Fragment, useState } from 'react';
import { LandingAnimation } from './LandingAnimation';
import { motion } from 'framer-motion';
import { GetStartedDialog } from './GetStartedDialog';
import Link from 'next/link';
import AnimatedBackground from './AnimatedBackground';

export function LandingPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <Fragment>
            {/* Hide animation on mobile screens */}
            <div className="hidden sm:block">
                <LandingAnimation />
            </div>
            
            <AnimatedBackground>
                <div className="relative min-h-screen w-full bg-transparent text-black sm:text-black text-white flex flex-col items-center justify-center z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-center px-4 relative max-w-xl mx-auto"
                    >
                        <div className="mb-8 relative">
                            <div className="text-6xl md:text-8xl font-bold relative">
                                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent animate-gradient">
                                    Blitz
                                </span>
                                <span className="invisible">Blitz</span>
                            </div>
                        </div>
                        
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-xl md:text-2xl font-semibold max-w-2xl mx-auto mb-10 leading-relaxed bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent animate-gradient"
                            style={{
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                color: 'transparent',
                                WebkitTextFillColor: 'transparent',
                                MozBackgroundClip: 'text',
                            }}
                        >
                            Streamline your communication with powerful mass texting capabilities
                        </motion.p>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.8 }}
                            className="flex flex-row gap-4 justify-center items-center"
                        >
                            <button 
                                onClick={() => setIsDialogOpen(true)}
                                className="flex-1 max-w-[180px] bg-gradient-to-r from-blue-600 via-purple-500 to-blue-800 text-white px-6 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-purple-600/30 transition-all duration-300 transform hover:scale-105"
                            >
                                Get Started
                            </button>
                            <Link 
                                href="/about"
                                className="flex-1 max-w-[180px] bg-black text-white sm:bg-white sm:text-black px-6 py-4 rounded-xl text-lg font-semibold shadow-lg hover:bg-gray-900 sm:hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 border border-white/40 sm:border-gray-200"
                            >
                                About Us
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </AnimatedBackground>

            <GetStartedDialog 
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </Fragment>
    );
} 