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
                    <DialogContent className="sm:max-w-md overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <DialogHeader>
                                <DialogTitle className="text-center text-xl">Welcome to Mass Texter</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-4">
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => handleNavigation('/access-code')}
                                >
                                    Already have an organization
                                </Button>
                                <Button 
                                    className="w-full"
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