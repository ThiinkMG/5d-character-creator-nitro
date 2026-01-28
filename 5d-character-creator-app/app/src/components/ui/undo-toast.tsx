'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface UndoToastProps {
    onUndo: () => void;
    onClose: () => void;
    message?: string;
    duration?: number;
}

export function UndoToast({
    onUndo,
    onClose,
    message = "Item moved to trash",
    duration = 5000
}: UndoToastProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => Math.max(0, prev - (100 / (duration / 100))));
        }, 100);

        const closeTimer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Allow exit animation
        }, duration);

        return () => {
            clearInterval(timer);
            clearTimeout(closeTimer);
        };
    }, [duration, onClose]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className={cn(
                "fixed bottom-8 right-8 z-50 flex flex-col gap-1 transition-all duration-300",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
        >
            <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-[#12121a] border border-white/10 shadow-xl overflow-hidden relative group">
                {/* Progress bar */}
                <div
                    className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />

                <span className="text-sm font-medium text-white">{message}</span>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            onUndo();
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                        className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                    >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Undo
                    </Button>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                        className="text-white/30 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
