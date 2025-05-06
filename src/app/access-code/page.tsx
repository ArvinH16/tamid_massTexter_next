'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import TransitionAnimation from '@/components/TransitionAnimation';
import { motion } from 'framer-motion';

export default function AccessCodePage() {
    const router = useRouter();
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showTransition, setShowTransition] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation after component mounts
        setIsVisible(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessCode }),
            });

            const data = await response.json();

            if (response.ok) {
                setShowTransition(true);
                // Wait for the transition animation to complete before redirecting
                setTimeout(() => {
                    router.push('/mass-text');
                }, 1000);
            } else {
                setError(data.message || 'Invalid access code');
                setIsLoading(false);
            }
        } catch {
            setError('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <>
            {showTransition && <TransitionAnimation />}
            <motion.div 
                className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4"
                initial={{ opacity: 0 }}
                animate={{ 
                    opacity: isVisible ? 1 : 0,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ 
                        scale: isVisible ? 1 : 0.95,
                        opacity: isVisible ? 1 : 0,
                        y: isVisible ? 0 : 20
                    }}
                    transition={{ 
                        duration: 0.8, 
                        delay: 0.3,
                        ease: [0.16, 1, 0.3, 1] // Custom easing for a more polished feel
                    }}
                >
                    <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-2xl text-center">Enter Access Code</CardTitle>
                            <CardDescription className="text-center">
                                Please enter your organization&apos;s access code to continue
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    type="password"
                                    placeholder="Enter access code"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    className="w-full"
                                    required
                                />
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <Button 
                                    type="submit" 
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Verifying...' : 'Continue'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </>
    );
} 