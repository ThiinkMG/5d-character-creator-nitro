"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
    onConfirm: () => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = 'default',
    onConfirm,
    onCancel,
    isLoading = false
}: ConfirmDialogProps) {
    const handleCancel = () => {
        onCancel?.();
        onOpenChange(false);
    };

    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    const variantStyles = {
        danger: {
            icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
            iconBg: "bg-red-500/10 border-red-500/20",
            buttonClass: "bg-red-600 hover:bg-red-700 text-white border-0"
        },
        warning: {
            icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
            iconBg: "bg-amber-500/10 border-amber-500/20",
            buttonClass: "bg-amber-600 hover:bg-amber-700 text-white border-0"
        },
        default: {
            icon: <Info className="w-6 h-6 text-primary" />,
            iconBg: "bg-primary/10 border-primary/20",
            buttonClass: "premium-button"
        }
    };

    const styles = variantStyles[variant];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#0c0c14] border-white/10">
                <DialogHeader className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-xl border",
                            styles.iconBg
                        )}>
                            {styles.icon}
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-lg font-semibold text-white">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="flex-1 glass"
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className={cn("flex-1", styles.buttonClass)}
                        disabled={isLoading}
                    >
                        {isLoading ? "Processing..." : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
