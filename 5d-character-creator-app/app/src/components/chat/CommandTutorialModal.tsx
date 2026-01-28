
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command, User, Globe, Search, Sparkles, AlertCircle, LayoutGrid } from 'lucide-react';

interface CommandTutorialModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandTutorialModal({ open, onOpenChange }: CommandTutorialModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-foreground p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Command className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Command Reference</DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-1">
                                Master the 5D Creator with these slash commands.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="h-[60vh] p-6">
                    <div className="space-y-8">
                        {/* General Section */}
                        <section>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4" /> General
                            </h3>
                            <div className="grid gap-4">
                                <CommandCard
                                    command="/menu"
                                    description="Opens the quick command menu to see available options at a glance."
                                    icon={Command}
                                    usage="/menu"
                                    color="text-gray-400"
                                    bgColor="bg-gray-400/10"
                                />
                                <CommandCard
                                    command="/help"
                                    description="Shows help information and usage tips for the current context."
                                    icon={AlertCircle}
                                    usage="/help"
                                    color="text-blue-400"
                                    bgColor="bg-blue-400/10"
                                />
                            </div>
                        </section>

                        {/* Character Section */}
                        <section>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User className="w-4 h-4" /> Character Development
                            </h3>
                            <div className="grid gap-4">
                                <CommandCard
                                    command="/generate basic"
                                    description="Starts a quick character creation session. Best for NPCs or simple concepts. Asks 5-7 key questions."
                                    icon={User}
                                    usage="/generate basic"
                                    color="text-emerald-400"
                                    bgColor="bg-emerald-400/10"
                                />
                                <CommandCard
                                    command="/generate advanced"
                                    description="Initiates the full 5-Phase Character Development process. Deep psychological profiling, backstory, and arc capability."
                                    icon={Sparkles}
                                    usage="/generate advanced"
                                    color="text-violet-400"
                                    bgColor="bg-violet-400/10"
                                />
                                <CommandCard
                                    command="/simulate"
                                    description="Places your active character into a scenario to stress-test their personality and reactions."
                                    icon={Sparkles} // Reusing sparkles or could use a different icon like Clapperboard or Play
                                    usage="/simulate [scenario]"
                                    color="text-pink-400"
                                    bgColor="bg-pink-400/10"
                                />
                            </div>
                        </section>

                        {/* World Section */}
                        <section>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4" /> World Building
                            </h3>
                            <div className="grid gap-4">
                                <CommandCard
                                    command="/worldbio"
                                    description="Create a new world setting. Define lore, physics, factions, and tone."
                                    icon={Globe}
                                    usage="/worldbio"
                                    color="text-orange-400"
                                    bgColor="bg-orange-400/10"
                                />
                            </div>
                        </section>

                        {/* Analysis Section */}
                        <section>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Search className="w-4 h-4" /> Analysis
                            </h3>
                            <div className="grid gap-4">
                                <CommandCard
                                    command="/analyze"
                                    description="Performs a deep consistency check on your character or world. Identifies plot holes and psychological contradictions."
                                    icon={Search}
                                    usage="/analyze"
                                    color="text-cyan-400"
                                    bgColor="bg-cyan-400/10"
                                />
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-white/5 bg-white/5 text-xs text-center text-muted-foreground">
                    Tip: You can also type <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">/</kbd> in the chat to see this list inline.
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CommandCard({ command, description, icon: Icon, usage, color, bgColor }: any) {
    return (
        <div className="group p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${bgColor} ${color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-bold text-foreground bg-white/10 px-1.5 py-0.5 rounded">{command}</code>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground/50">
                        <span className="uppercase tracking-wider font-semibold">Usage:</span>
                        <code className="font-mono">{usage}</code>
                    </div>
                </div>
            </div>
        </div>
    );
}
