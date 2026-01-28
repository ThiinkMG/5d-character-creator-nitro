import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Sparkles } from 'lucide-react';

interface ReloadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onReload: (context?: string) => void;
}

export function ReloadModal({ open, onOpenChange, onReload }: ReloadModalProps) {
    const [context, setContext] = useState('');

    const handleStandardReload = () => {
        onReload();
        onOpenChange(false);
    };

    const handleContextReload = () => {
        onReload(context);
        onOpenChange(false);
        setContext(''); // Reset after use
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-black/95 border-white/10 backdrop-blur-xl text-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-primary" />
                        Regenerate Response
                    </DialogTitle>
                    <DialogDescription>
                        Choose how you want to regenerate the last response.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Option 1: Standard */}
                    <div className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full justify-start h-auto py-3 px-4 border-white/10 hover:bg-white/5"
                            onClick={handleStandardReload}
                        >
                            <div className="flex flex-col items-start gap-1 text-left">
                                <span className="font-medium text-sm">Standard Regeneration</span>
                                <span className="text-[10px] text-muted-foreground">Regenerate without any new instructions. Same context.</span>
                            </div>
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black/95 px-2 text-muted-foreground">Or with context</span>
                        </div>
                    </div>

                    {/* Option 2: With Context */}
                    <div className="space-y-3">
                        <Textarea
                            placeholder="e.g. Focus more on the character's dark past..."
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            className="min-h-[80px] bg-white/5 border-white/10 text-sm focus:border-primary/50 resize-none"
                        />
                        <Button
                            variant="default"
                            className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0"
                            onClick={handleContextReload}
                            disabled={!context.trim()}
                        >
                            <Sparkles className="w-4 h-4" />
                            Regenerate with Instructions
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
