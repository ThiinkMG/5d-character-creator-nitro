'use client';

import { useState, useEffect } from 'react';
import { User, Upload, Wand2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ImagePicker } from '@/components/ui/image-picker';
import { ImageGeneratorModal } from '@/components/gallery/ImageGeneratorModal';

interface UserProfile {
    name: string;
    description: string;
    avatar: string;
}

const DEFAULT_AVATAR = '/app-image-assets/5d-logo-solo.png';

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        description: '',
        avatar: DEFAULT_AVATAR,
    });
    const [saved, setSaved] = useState(false);
    const [showImageGenerator, setShowImageGenerator] = useState(false);

    // Load profile from localStorage on mount
    useEffect(() => {
        const savedProfile = localStorage.getItem('5d-user-profile');
        if (savedProfile) {
            try {
                const parsed = JSON.parse(savedProfile);
                setProfile({
                    name: parsed.name || '',
                    description: parsed.description || '',
                    avatar: parsed.avatar || DEFAULT_AVATAR,
                });
            } catch (e) {
                console.error('Failed to parse saved profile:', e);
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('5d-user-profile', JSON.stringify(profile));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleAvatarChange = (imageUrl: string) => {
        setProfile(prev => ({ ...prev, avatar: imageUrl }));
    };

    const handleGenerateAvatar = async (prompt: string, provider: string) => {
        try {
            const savedConfig = typeof window !== 'undefined'
                ? JSON.parse(localStorage.getItem('5d-api-config') || '{}')
                : {};

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(savedConfig.geminiKey && { 'x-gemini-key': savedConfig.geminiKey }),
                    ...(savedConfig.openaiKey && { 'x-openai-key': savedConfig.openaiKey }),
                    ...(savedConfig.dalleKey && { 'x-openai-key': savedConfig.dalleKey }),
                },
                body: JSON.stringify({ 
                    prompt: `Professional avatar portrait: ${prompt}. Clean, modern, suitable for profile picture.`,
                    provider 
                }),
            });

            const data = await response.json();

            if (response.ok && data.imageUrl) {
                handleAvatarChange(data.imageUrl);
                setShowImageGenerator(false);
            } else {
                throw new Error(data.error || 'Failed to generate image');
            }
        } catch (error) {
            console.error('Avatar generation error:', error);
            alert('Failed to generate avatar. Please try again.');
        }
    };

    return (
        <div className="min-h-screen p-8 lg:p-12">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-primary to-primary/40" />
                    <h1 className="text-3xl font-semibold tracking-tight">User Profile</h1>
                </div>
                <p className="text-muted-foreground text-base ml-5">
                    Customize your profile information and avatar
                </p>
            </header>

            <div className="max-w-2xl space-y-8">
                {/* Avatar Section */}
                <section>
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Profile Picture
                    </h2>
                    <div className="glass-card rounded-xl p-6">
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-white/5">
                                    <img
                                        src={profile.avatar}
                                        alt="Profile avatar"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full">
                                <ImagePicker
                                    value={profile.avatar}
                                    onChange={handleAvatarChange}
                                    label="Upload Avatar"
                                    size="md"
                                    className="flex-1"
                                />
                                <Button
                                    onClick={() => setShowImageGenerator(true)}
                                    variant="outline"
                                    className="glass flex-1"
                                >
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Generate with AI
                                </Button>
                            </div>
                            <Button
                                onClick={() => handleAvatarChange(DEFAULT_AVATAR)}
                                variant="outline"
                                className="glass text-xs"
                            >
                                Reset to Default
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Profile Information */}
                <section>
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Profile Information
                    </h2>
                    <div className="space-y-4">
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">Display Name</h3>
                                    <p className="text-xs text-muted-foreground">This name appears in chat messages</p>
                                </div>
                            </div>
                            <Input
                                value={profile.name}
                                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter your name"
                                className="bg-background/50"
                            />
                        </div>

                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">Description</h3>
                                    <p className="text-xs text-muted-foreground">Tell us about yourself (optional)</p>
                                </div>
                            </div>
                            <Textarea
                                value={profile.description}
                                onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Write a brief description about yourself..."
                                className="bg-background/50 min-h-[100px]"
                                rows={4}
                            />
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Button onClick={handleSave} className="premium-button">
                        {saved ? (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Profile
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* AI Image Generator Modal */}
            {showImageGenerator && (
                <ImageGeneratorModal
                    isOpen={showImageGenerator}
                    onClose={() => setShowImageGenerator(false)}
                    onGenerate={handleGenerateAvatar}
                    onUpload={(dataUrl) => {
                        handleAvatarChange(dataUrl);
                        setShowImageGenerator(false);
                    }}
                    itemName="avatar"
                    initialMode="generate"
                />
            )}
        </div>
    );
}
