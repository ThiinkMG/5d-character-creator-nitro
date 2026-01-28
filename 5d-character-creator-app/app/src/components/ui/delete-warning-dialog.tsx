'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteWarningDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    itemName?: string;
}

export function DeleteWarningDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Section",
    description = "This section will be moved to the Trash. You can restore it later if needed.",
    itemName
}: DeleteWarningDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#12121a] border border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-white/70">
                        {itemName && <span className="block mb-2 font-medium text-white">"{itemName}"</span>}
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Move to Trash
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
