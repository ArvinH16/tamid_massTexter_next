'use client';

import { Fragment, useState } from 'react';
import { LandingAnimation } from './LandingAnimation';
import { motion } from 'framer-motion';
import { GetStartedDialog } from './GetStartedDialog';

export function LandingPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <Fragment>
            <LandingAnimation />
            
            <div className="relative min-h-screen w-full bg-transparent text-white flex flex-col items-center justify-center z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="text-center px-4 relative"
                >
                    {/* Semi-transparent backdrop for better text visibility */}
                    <div className="absolute inset-0 bg-black/40 blur-xl rounded-3xl -z-10"></div>
                    
                    <div className="mb-8 relative">
                        <div className="text-6xl md:text-8xl font-bold relative">
                            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent animate-gradient">
                                Mass Texter
                            </span>
                            <span className="invisible">Mass Texter</span>
                        </div>
                    </div>
                    
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        Streamline your communication with powerful mass texting capabilities
                    </motion.p>
                    
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                    >
                        <button 
                            onClick={() => setIsDialogOpen(true)}
                            className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-800 text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-purple-600/30 transition-all duration-300 transform hover:scale-105"
                        >
                            Get Started
                        </button>
                    </motion.div>
                </motion.div>
            </div>

            <GetStartedDialog 
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </Fragment>
    );
} 