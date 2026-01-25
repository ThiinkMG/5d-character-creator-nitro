'use client';

import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, AlertCircle, Sparkles, Cpu, Image as ImageIcon, Wand2, Globe, Lock, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ImageProvider } from '@/types/image-config';

type Provider = 'anthropic' | 'openai';

interface ApiConfig {
    provider: Provider;
    anthropicKey: string;
    openaiKey: string;
    // Image Generation
    geminiKey: string;
    dalleKey: string;
    imageProvider: ImageProvider;
}

export default function SettingsPage() {
    const [config, setConfig] = useState<ApiConfig>({
        provider: 'anthropic',
        anthropicKey: '',
        openaiKey: '',
        geminiKey: '',
        dalleKey: '',
        imageProvider: 'free',
    });
    const [showAnthropicKey, setShowAnthropicKey] = useState(false);
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [showDalleKey, setShowDalleKey] = useState(false);
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [testError, setTestError] = useState<string | null>(null);
    
    // Admin mode state
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [adminError, setAdminError] = useState<string | null>(null);
    const [adminLoading, setAdminLoading] = useState(false);

    // Load config from localStorage on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem('5d-api-config');
        const adminMode = localStorage.getItem('5d-admin-mode') === 'true';
        
        if (adminMode && savedConfig) {
            // Admin mode is active - restore state but keys are masked
            setIsAdminMode(true);
            try {
                const parsed = JSON.parse(savedConfig);
                setConfig({
                    provider: parsed.provider || 'anthropic',
                    anthropicKey: parsed.anthropicKey ? '••••••••••••' : '',
                    openaiKey: parsed.openaiKey ? '••••••••••••' : '',
                    geminiKey: parsed.geminiKey ? '••••••••••••' : '',
                    dalleKey: parsed.dalleKey ? '••••••••••••' : '',
                    imageProvider: parsed.imageProvider || 'free',
                });
            } catch (e) {
                console.error('Failed to parse saved config:', e);
            }
        } else if (savedConfig) {
            try {
                setConfig({
                    // Defaults
                    provider: 'anthropic',
                    anthropicKey: '',
                    openaiKey: '',
                    geminiKey: '',
                    dalleKey: '',
                    imageProvider: 'free',
                    ...JSON.parse(savedConfig)
                });
            } catch (e) {
                console.error('Failed to parse saved config:', e);
            }
        }
    }, []);

    const handleAdminLogin = async (skipModal = false) => {
        if (!skipModal && !adminPassword) {
            setAdminError('Please enter a password');
            return;
        }

        setAdminLoading(true);
        setAdminError(null);

        try {
            const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: adminPassword || 'dummy' })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Set admin mode
                setIsAdminMode(true);
                localStorage.setItem('5d-admin-mode', 'true');
                
                // Load keys from .env
                setConfig(prev => ({
                    ...prev,
                    anthropicKey: data.keys.anthropicKey || prev.anthropicKey,
                    openaiKey: data.keys.openaiKey || prev.openaiKey,
                    geminiKey: data.keys.geminiKey || prev.geminiKey,
                    dalleKey: data.keys.openaiKey || prev.dalleKey, // DALL-E uses OpenAI key
                }));

                // Save to localStorage (but keys will be masked)
                localStorage.setItem('5d-api-config', JSON.stringify({
                    provider: config.provider,
                    imageProvider: config.imageProvider,
                    anthropicKey: data.keys.anthropicKey || config.anthropicKey,
                    openaiKey: data.keys.openaiKey || config.openaiKey,
                    geminiKey: data.keys.geminiKey || config.geminiKey,
                    dalleKey: data.keys.openaiKey || config.dalleKey,
                }));

                setShowAdminModal(false);
                setAdminPassword('');
            } else {
                setAdminError(data.error || 'Invalid password');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            setAdminError('Failed to verify password');
        } finally {
            setAdminLoading(false);
        }
    };

    const handleAdminLogout = () => {
        if (confirm('Are you sure you want to log out of admin mode? This will clear all API key entries.')) {
            setIsAdminMode(false);
            localStorage.removeItem('5d-admin-mode');
            localStorage.removeItem('5d-api-keys-admin'); // Remove actual keys
            
            // Clear all API keys
            setConfig({
                provider: 'anthropic',
                anthropicKey: '',
                openaiKey: '',
                geminiKey: '',
                dalleKey: '',
                imageProvider: 'free',
            });
            
            localStorage.setItem('5d-api-config', JSON.stringify({
                provider: 'anthropic',
                anthropicKey: '',
                openaiKey: '',
                geminiKey: '',
                dalleKey: '',
                imageProvider: 'free',
            }));
        }
    };

    const handleSave = () => {
        localStorage.setItem('5d-api-config', JSON.stringify(config));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        setTestError(null);

        // Get actual API key (from admin keys if in admin mode, otherwise from config)
        let apiKey = '';
        if (isAdminMode) {
            const adminKeys = localStorage.getItem('5d-api-keys-admin');
            if (adminKeys) {
                try {
                    const keys = JSON.parse(adminKeys);
                    apiKey = config.provider === 'anthropic' ? (keys.anthropicKey || '') : (keys.openaiKey || '');
                } catch (e) {
                    console.error('Failed to parse admin keys:', e);
                }
            }
        } else {
            apiKey = config.provider === 'anthropic' ? config.anthropicKey : config.openaiKey;
        }

        if (!apiKey) {
            setTestResult('error');
            setTestError('Please enter an API key first');
            setTesting(false);
            return;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'Say "Connection successful!" and nothing else.' }],
                    provider: config.provider,
                    apiKey,
                }),
            });

            if (response.ok) {
                // Read the response to verify it worked
                const text = await response.text();
                if (text.toLowerCase().includes('connection successful') || text.trim().length > 0) {
                    setTestResult('success');
                    setTestError(null);
                } else {
                    setTestResult('error');
                    setTestError('Unexpected response from API');
                }
            } else {
                // Try to read error message from response
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch {
                    // If response isn't JSON, try text
                    try {
                        const errorText = await response.text();
                        if (errorText) {
                            errorMessage = errorText;
                        }
                    } catch {
                        // Use default error message
                    }
                }
                setTestResult('error');
                setTestError(errorMessage);
            }
        } catch (error) {
            setTestResult('error');
            const errorMessage = error instanceof Error ? error.message : 'Network error - could not connect to API';
            setTestError(errorMessage);
            console.error('Connection test error:', error);
        }

        setTesting(false);
    };

    const providers = [
        {
            id: 'anthropic' as Provider,
            name: 'Claude',
            description: 'Anthropic Claude 3.5 Sonnet',
            icon: Sparkles,
            color: 'text-orange-400',
            bgColor: 'bg-orange-400/10',
        },
        {
            id: 'openai' as Provider,
            name: 'GPT-4',
            description: 'OpenAI GPT-4o',
            icon: Cpu,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-400/10',
        },
    ];

    return (
        <div className="min-h-screen p-8 lg:p-12">
            <header className="mb-12">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-primary to-primary/40" />
                        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdminMode ? (
                            <Button
                                onClick={handleAdminLogout}
                                variant="outline"
                                className="glass text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Log Out Admin
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setShowAdminModal(true)}
                                variant="outline"
                                className="glass"
                            >
                                <Lock className="h-4 w-4 mr-2" />
                                Admin Login
                            </Button>
                        )}
                    </div>
                </div>
                <p className="text-muted-foreground text-base ml-5">
                    Configure your AI providers and preferences
                </p>
            </header>

            <div className="max-w-2xl space-y-8">
                {/* Chat Provider Selection */}
                <section>
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Chat Provider
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {providers.map((provider) => (
                            <button
                                key={provider.id}
                                onClick={() => setConfig({ ...config, provider: provider.id })}
                                className={cn(
                                    "glass-card-interactive rounded-xl p-5 text-left transition-all",
                                    config.provider === provider.id && "ring-2 ring-primary"
                                )}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn("p-2 rounded-lg", provider.bgColor)}>
                                        <provider.icon className={cn("h-5 w-5", provider.color)} />
                                    </div>
                                    {config.provider === provider.id && (
                                        <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-medium mb-1">{provider.name}</h3>
                                <p className="text-sm text-muted-foreground">{provider.description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* API Keys */}
                <section>
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Chat API Keys
                    </h2>
                    <div className="space-y-4">
                        {/* Anthropic Key */}
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-orange-400/10">
                                    <Key className="h-4 w-4 text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">Anthropic API Key</h3>
                                    <p className="text-xs text-muted-foreground">For Claude models</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showAnthropicKey ? 'text' : 'password'}
                                    value={config.anthropicKey}
                                    onChange={(e) => !isAdminMode && setConfig({ ...config, anthropicKey: e.target.value })}
                                    placeholder={isAdminMode ? "••••••••••••" : "sk-ant-..."}
                                    className={cn("pr-10 bg-background/50", isAdminMode && "opacity-50 cursor-not-allowed")}
                                    disabled={isAdminMode}
                                />
                                {!isAdminMode && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                )}
                                {isAdminMode && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* OpenAI Key */}
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-emerald-400/10">
                                    <Key className="h-4 w-4 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">OpenAI API Key</h3>
                                    <p className="text-xs text-muted-foreground">For GPT-4 models</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showOpenaiKey ? 'text' : 'password'}
                                    value={config.openaiKey}
                                    onChange={(e) => !isAdminMode && setConfig({ ...config, openaiKey: e.target.value })}
                                    placeholder={isAdminMode ? "••••••••••••" : "sk-..."}
                                    className={cn("pr-10 bg-background/50", isAdminMode && "opacity-50 cursor-not-allowed")}
                                    disabled={isAdminMode}
                                />
                                {!isAdminMode && (
                                    <button
                                        type="button"
                                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                )}
                                {isAdminMode && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Image Generation Section */}
                <section>
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Image Generation
                    </h2>
                    <div className="space-y-4">
                        {/* Provider Selection */}
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Wand2 className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">Image Provider</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Choose how to generate character & world images
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'free', name: 'Free', desc: 'No API key needed' },
                                    { id: 'gemini', name: 'Gemini', desc: 'Google AI' },
                                    { id: 'dalle', name: 'DALL-E', desc: 'OpenAI' },
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setConfig({ ...config, imageProvider: p.id as any })}
                                        className={cn(
                                            "p-3 rounded-xl text-left transition-all border",
                                            config.imageProvider === p.id
                                                ? "border-primary bg-primary/10"
                                                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <div className="text-sm font-medium">{p.name}</div>
                                        <div className="text-xs text-muted-foreground">{p.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Gemini API Key */}
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-blue-400/10">
                                    <Globe className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">Google Gemini API Key</h3>
                                    <p className="text-xs text-muted-foreground">For Gemini image generation</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showGeminiKey ? 'text' : 'password'}
                                    value={config.geminiKey}
                                    onChange={(e) => !isAdminMode && setConfig({ ...config, geminiKey: e.target.value })}
                                    placeholder={isAdminMode ? "••••••••••••" : "AIza..."}
                                    className={cn("pr-10 bg-background/50", isAdminMode && "opacity-50 cursor-not-allowed")}
                                    disabled={isAdminMode}
                                />
                                {!isAdminMode && (
                                    <button
                                        type="button"
                                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                )}
                                {isAdminMode && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* DALL-E API Key */}
                        <div className="glass-card rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-emerald-400/10">
                                    <Key className="h-4 w-4 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">OpenAI DALL-E API Key</h3>
                                    <p className="text-xs text-muted-foreground">For DALL-E image generation (uses same key as GPT-4)</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showDalleKey ? 'text' : 'password'}
                                    value={config.dalleKey || config.openaiKey} // Fallback to main OpenAI key if same
                                    onChange={(e) => !isAdminMode && setConfig({ ...config, dalleKey: e.target.value })}
                                    placeholder={isAdminMode ? "••••••••••••" : "sk-..."}
                                    className={cn("pr-10 bg-background/50", isAdminMode && "opacity-50 cursor-not-allowed")}
                                    disabled={isAdminMode}
                                />
                                {!isAdminMode && (
                                    <button
                                        type="button"
                                        onClick={() => setShowDalleKey(!showDalleKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showDalleKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                )}
                                {isAdminMode && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {!isAdminMode && (
                        <Button onClick={handleSave} className="premium-button">
                            {saved ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Saved!
                                </>
                            ) : (
                                'Save Settings'
                            )}
                        </Button>
                    )}
                    {isAdminMode && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Lock className="h-4 w-4" />
                            <span>Admin mode: API keys are managed from .env file</span>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        onClick={handleTest}
                        disabled={testing}
                        className="glass"
                    >
                        {testing ? 'Testing...' : 'Test Chat Connection'}
                    </Button>

                    {testResult === 'success' && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                            <Check className="h-4 w-4" />
                            <span>Connected!</span>
                        </div>
                    )}

                    {testResult === 'error' && (
                        <div className="flex flex-col gap-2 text-red-400 text-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>Connection failed</span>
                            </div>
                            {testError && (
                                <div className="text-xs text-red-300/80 ml-6 pl-2 border-l-2 border-red-400/30">
                                    {testError}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="glass-card rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                            <p className="mb-2">
                                <strong className="text-foreground">Your API keys are stored locally</strong> in your browser
                                and are never sent to our servers. They are only used to communicate directly with the AI providers.
                            </p>
                            <p>
                                Get your API keys from{' '}
                                <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    Anthropic Console
                                </a>
                                {' '}or{' '}
                                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    OpenAI Platform
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Login Modal */}
            {showAdminModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowAdminModal(false)}>
                    <div
                        className="bg-[#0A0A0F] border border-white/10 rounded-2xl w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Lock className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Admin Login</h3>
                                        <p className="text-sm text-muted-foreground">Enter admin password to use API keys from .env</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAdminModal(false);
                                        setAdminPassword('');
                                        setAdminError(null);
                                    }}
                                    className="text-muted-foreground hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Password
                                </label>
                                <Input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => {
                                        setAdminPassword(e.target.value);
                                        setAdminError(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !adminLoading) {
                                            handleAdminLogin();
                                        }
                                    }}
                                    placeholder="Enter admin password"
                                    className="bg-background/50"
                                    autoFocus
                                />
                                {adminError && (
                                    <p className="text-sm text-red-400 mt-2 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        {adminError}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    onClick={() => handleAdminLogin()}
                                    disabled={adminLoading || !adminPassword}
                                    className="premium-button flex-1"
                                >
                                    {adminLoading ? 'Verifying...' : 'Login'}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowAdminModal(false);
                                        setAdminPassword('');
                                        setAdminError(null);
                                    }}
                                    variant="outline"
                                    className="glass"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
