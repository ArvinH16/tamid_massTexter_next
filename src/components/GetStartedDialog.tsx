import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

interface GetStartedDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GetStartedDialog({ isOpen, onClose }: GetStartedDialogProps) {
    const router = useRouter();

    const handleNavigation = (path: string) => {
        // Use a smoother transition with Framer Motion
        setTimeout(() => {
            onClose();
            router.push(path);
        }, 500); // Slightly longer for smoother transition
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <AnimatePresence>
                {isOpen && (
                    <DialogContent className="sm:max-w-md max-w-[90%] overflow-hidden border border-gray-100 bg-white/90 backdrop-blur-sm p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <DialogHeader className="mb-4">
                                <DialogTitle className="text-center text-xl font-bold">Welcome to Mass Texter</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-4">
                                <Button 
                                    variant="outline" 
                                    className="w-full h-12 text-base border-gray-300 hover:bg-gray-100 transition-colors"
                                    onClick={() => handleNavigation('/access-code')}
                                >
                                    Already have an organization
                                </Button>
                                <Button 
                                    className="w-full h-12 text-base bg-gradient-to-r from-blue-600 via-purple-500 to-blue-800 hover:opacity-90 transition-opacity text-white"
                                    onClick={() => handleNavigation('/register')}
                                >
                                    Register organization
                                </Button>
                            </div>
                        </motion.div>
                    </DialogContent>
                )}
            </AnimatePresence>
        </Dialog>
    );
} 