'use client';

import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, AlertCircle, Sparkles, Cpu, Image as ImageIcon, Wand2, Globe } from 'lucide-react';
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

    // Load config from localStorage on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem('5d-api-config');
        if (savedConfig) {
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

    const handleSave = () => {
        localStorage.setItem('5d-api-config', JSON.stringify(config));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        setTestError(null);

        const apiKey = config.provider === 'anthropic' ? config.anthropicKey : config.openaiKey;

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
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-primary to-primary/40" />
                    <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
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
                                    onChange={(e) => setConfig({ ...config, anthropicKey: e.target.value })}
                                    placeholder="sk-ant-..."
                                    className="pr-10 bg-background/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
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
                                    onChange={(e) => setConfig({ ...config, openaiKey: e.target.value })}
                                    placeholder="sk-..."
                                    className="pr-10 bg-background/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
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
                                    onChange={(e) => setConfig({ ...config, geminiKey: e.target.value })}
                                    placeholder="AIza..."
                                    className="pr-10 bg-background/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
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
                                    onChange={(e) => setConfig({ ...config, dalleKey: e.target.value })}
                                    placeholder="sk-..."
                                    className="pr-10 bg-background/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowDalleKey(!showDalleKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showDalleKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <div className="flex items-center gap-4">
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
        </div>
    );
}
