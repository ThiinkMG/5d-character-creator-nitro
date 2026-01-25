'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { ImagePicker } from '@/components/ui/image-picker';
import { cn } from '@/lib/utils';

interface DocumentThumbnailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (thumbnail: string | null, imageSource?: 'ai-generated' | 'uploaded') => void;
    currentThumbnail?: string | null;
    documentTitle: string;
}

export function DocumentThumbnailModal({
    isOpen,
    onClose,
    onSave,
    currentThumbnail,
    documentTitle,
}: DocumentThumbnailModalProps) {
    const [thumbnail, setThumbnail] = useState<string | null>(currentThumbnail || null);
    const [imageSource, setImageSource] = useState<'ai-generated' | 'uploaded' | undefined>(undefined);

    React.useEffect(() => {
        if (isOpen) {
            setThumbnail(currentThumbnail || null);
            setImageSource(undefined);
        }
    }, [isOpen, currentThumbnail]);

    const handleImageChange = (url: string | null, source?: 'ai-generated' | 'uploaded') => {
        setThumbnail(url);
        setImageSource(source);
    };

    const handleSave = () => {
        onSave(thumbnail, imageSource);
        onClose();
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
                <DialogContent
                    showCloseButton={false}
                    className="max-w-md bg-[#0c0c14] border-white/10"
                >
                    <DialogHeader className="relative">
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2 pr-8">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Document Thumbnail
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Manage thumbnail for "{documentTitle}"
                        </DialogDescription>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="absolute top-0 right-0 h-8 w-8 p-0 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </DialogHeader>

                    <div className="mt-4">
                        {/* Using new ImagePicker component */}
                        <ImagePicker
                            value={thumbnail}
                            onChange={handleImageChange}
                            label="Document Thumbnail"
                            placeholder={documentTitle}
                            aspectRatio="video"
                            size="md"
                        />
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </>
    );
}
