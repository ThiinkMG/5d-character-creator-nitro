'use client';

import { useState, useEffect } from 'react';
import { User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface UserNameSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}

export function UserNameSetupModal({ isOpen, onClose, onSave }: UserNameSetupModalProps) {
    const [name, setName] = useState('');
    const [savedProfile, setSavedProfile] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            const profile = localStorage.getItem('5d-user-profile');
            if (profile) {
                try {
                    const parsed = JSON.parse(profile);
                    setSavedProfile(parsed);
                    if (parsed.name) {
                        setName(parsed.name);
                    }
                } catch (e) {
                    console.error('Failed to parse profile:', e);
                }
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        if (name.trim()) {
            const profile = savedProfile || { description: '', avatar: '/app-image-assets/5d-logo-solo.png' };
            const updatedProfile = { ...profile, name: name.trim() };
            localStorage.setItem('5d-user-profile', JSON.stringify(updatedProfile));
            onSave(name.trim());
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[#0A0A0F] border border-white/10 rounded-2xl w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Set Your Name</h3>
                                <p className="text-sm text-muted-foreground">This will appear in your chat messages</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Display Name
                        </label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && name.trim()) {
                                    handleSave();
                                }
                            }}
                            placeholder="Enter your name"
                            className="bg-background/50"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            You can change this anytime in your Profile settings
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={!name.trim()}
                            className="premium-button flex-1"
                        >
                            Save & Continue
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="glass"
                        >
                            Skip for Now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
