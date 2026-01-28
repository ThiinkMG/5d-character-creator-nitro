'use client';

import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart, Info, Download, X, ArrowRight, User, Globe, Folder, Search, ArrowUp, ArrowDown, MessageSquare, Network, Sparkles, FileText } from 'lucide-react';
import { RelationshipGraph } from '@/components/visualization';
import { AutoLinkSuggestions } from '@/components/project/AutoLinkSuggestions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

export default function AnalysisPage() {
    const { characters, worlds, projects, chatSessions, characterDocuments, projectDocuments } = useStore();
    const router = useRouter();

    // Modal State
    const [selectedFilter, setSelectedFilter] = useState<{
        type: 'Archetype' | 'Role' | 'Genre' | 'Category';
        value: string;
        items: Array<{ id: string; name: string; url: string; type: 'Character' | 'World' | 'Project' | 'Chat' | 'Document'; progress?: number }>;
    } | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'progress', direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    
    // Document Navigation Modal State
    const [documentNavModal, setDocumentNavModal] = useState<{
        documentId: string;
        documentName: string;
        locations: Array<{ url: string; label: string; type: 'character' | 'project' }>;
    } | null>(null);

    const totalProgress = Math.round(
        [...characters, ...worlds, ...projects].reduce((acc, item) => acc + item.progress, 0) /
        (characters.length + worlds.length + projects.length || 1)
    );

    // Document statistics
    const allDocuments = [...characterDocuments, ...projectDocuments];
    const totalDocuments = allDocuments.length;
    const uploadedDocuments = allDocuments.filter(doc => doc.sourceFile).length;
    const generatedDocuments = totalDocuments - uploadedDocuments;

    // Distribution Data Helper
    const getDistribution = (items: any[], key: string) => {
        const counts: Record<string, number> = {};
        items.forEach(item => {
            const val = item[key] || 'Undefined';
            counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    };

    const archetypeDist = getDistribution(characters, 'archetype');
    const roleDist = getDistribution(characters, 'role');
    const worldGenreDist = getDistribution(worlds, 'genre');

    const maxVal = Math.max(...archetypeDist.map(d => d[1]), 1);

    const handleExportJSON = () => {
        const data = JSON.stringify({ characters, worlds, projects }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `5d-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSelect = (type: 'Archetype' | 'Role' | 'Genre' | 'Category', value: string) => {
        let matches: Array<{ id: string; name: string; url: string; type: 'Character' | 'World' | 'Project' | 'Chat' | 'Document'; progress?: number }> = [];

        if (type === 'Archetype') {
            matches = characters
                .filter(c => (c.archetype || 'Undefined') === value)
                .map(c => ({ id: c.id, name: c.name, url: `/characters/${encodeURIComponent(c.id)}`, type: 'Character', progress: c.progress }));
        } else if (type === 'Role') {
            matches = characters
                .filter(c => (c.role || 'Undefined') === value)
                .map(c => ({ id: c.id, name: c.name, url: `/characters/${encodeURIComponent(c.id)}`, type: 'Character', progress: c.progress }));
        } else if (type === 'Genre') {
            matches = worlds
                .filter(w => (w.genre || 'Undefined') === value)
                .map(w => ({ id: w.id, name: w.name, url: `/worlds/${encodeURIComponent(w.id)}`, type: 'World', progress: w.progress }));
        } else if (type === 'Category') {
            if (value === 'Characters') {
                matches = characters.map(c => ({ id: c.id, name: c.name, url: `/characters/${encodeURIComponent(c.id)}`, type: 'Character', progress: c.progress }));
            } else if (value === 'Worlds') {
                matches = worlds.map(w => ({ id: w.id, name: w.name, url: `/worlds/${encodeURIComponent(w.id)}`, type: 'World', progress: w.progress }));
            } else if (value === 'Projects') {
                matches = projects.map(p => ({ id: p.id, name: p.name, url: `/projects/${encodeURIComponent(p.id)}`, type: 'Project', progress: p.progress }));
            } else if (value === 'Global Progress') {
                matches = [
                    ...characters.map(c => ({ ...c, type: 'Character' as const, url: `/characters/${encodeURIComponent(c.id)}` })),
                    ...worlds.map(w => ({ ...w, type: 'World' as const, url: `/worlds/${encodeURIComponent(w.id)}` })),
                    ...projects.map(p => ({ ...p, type: 'Project' as const, url: `/projects/${encodeURIComponent(p.id)}` }))
                ];
            } else if (value === 'Chat Sessions') {
                matches = chatSessions.map(s => ({
                    id: s.id,
                    name: s.title || 'Untitled Session',
                    url: `/chat?sessionId=${s.id}`,
                    type: 'Chat',
                    progress: undefined
                }));
            } else if (value === 'Documents') {
                matches = [
                    ...characterDocuments.map(doc => ({
                        id: doc.id,
                        name: doc.title,
                        url: `/characters/${encodeURIComponent(doc.characterId)}?tab=documents&doc=${doc.id}`,
                        type: 'Document' as const,
                        progress: undefined
                    })),
                    ...projectDocuments.map(doc => ({
                        id: doc.id,
                        name: doc.title,
                        url: `/projects/${encodeURIComponent(doc.projectId)}?tab=documents&doc=${doc.id}`,
                        type: 'Document' as const,
                        progress: undefined
                    }))
                ];
            }
        }

        setSearchQuery('');
        setSortConfig({ key: 'name', direction: 'asc' });
        setSelectedFilter({ type, value, items: matches });
    };

    // Filter & Sort Logic
    const filteredItems = useMemo(() => {
        if (!selectedFilter) return [];

        let items = [...selectedFilter.items];

        // Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(i => i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q));
        }

        // Sort
        items.sort((a, b) => {
            const aVal = sortConfig.key === 'progress' ? (a.progress || 0) : a.name;
            const bVal = sortConfig.key === 'progress' ? (b.progress || 0) : b.name;

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return items;
    }, [selectedFilter, searchQuery, sortConfig]);

    const toggleSort = (key: 'name' | 'progress') => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Find all locations where a document appears
    const findDocumentLocations = (documentId: string): Array<{ url: string; label: string; type: 'character' | 'project' }> => {
        const locations: Array<{ url: string; label: string; type: 'character' | 'project' }> = [];

        // Check if it's a character document
        const charDoc = characterDocuments.find(d => d.id === documentId);
        if (charDoc) {
            const character = characters.find(c => c.id === charDoc.characterId);
            if (character) {
                locations.push({
                    url: `/characters/${encodeURIComponent(charDoc.characterId)}?tab=documents&doc=${documentId}`,
                    label: `Character: ${character.name}`,
                    type: 'character'
                });

                // Check if character is linked to a project and document was imported
                if (character.projectId) {
                    const project = projects.find(p => p.id === character.projectId);
                    const importedDoc = projectDocuments.find(
                        d => d.projectId === character.projectId && 
                        d.metadata?.sourceItemId === documentId
                    );
                    if (importedDoc && project) {
                        locations.push({
                            url: `/projects/${encodeURIComponent(character.projectId)}?tab=documents&doc=${importedDoc.id}`,
                            label: `Project: ${project.name} (Imported)`,
                            type: 'project'
                        });
                    }
                }
            }
        }

        // Check if it's a project document
        const projDoc = projectDocuments.find(d => d.id === documentId);
        if (projDoc) {
            const project = projects.find(p => p.id === projDoc.projectId);
            if (project) {
                locations.push({
                    url: `/projects/${encodeURIComponent(projDoc.projectId)}?tab=documents&doc=${documentId}`,
                    label: `Project: ${project.name}`,
                    type: 'project'
                });

                // Check if it's an imported document and find the original source
                if (projDoc.type === 'imported' && projDoc.metadata?.sourceItemId) {
                    const sourceDoc = characterDocuments.find(d => d.id === projDoc.metadata?.sourceItemId);
                    if (sourceDoc) {
                        const character = characters.find(c => c.id === sourceDoc.characterId);
                        if (character) {
                            locations.push({
                                url: `/characters/${encodeURIComponent(sourceDoc.characterId)}?tab=documents&doc=${projDoc.metadata.sourceItemId}`,
                                label: `Character: ${character.name} (Original)`,
                                type: 'character'
                            });
                        }
                    }
                }
            }
        }

        return locations;
    };

    const handleDocumentClick = (e: React.MouseEvent, documentId: string, documentName: string) => {
        e.preventDefault();
        const locations = findDocumentLocations(documentId);
        
        if (locations.length === 0) {
            // No locations found, shouldn't happen but handle gracefully
            return;
        } else if (locations.length === 1) {
            // Single location, navigate directly
            router.push(locations[0].url);
        } else {
            // Multiple locations, show navigation modal
            setDocumentNavModal({ documentId, documentName, locations });
        }
    };

    return (
        <div className="min-h-screen p-8 lg:p-12 pb-32 relative">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-yellow-500 to-amber-600" />
                        <h1 className="text-3xl font-semibold tracking-tight">Analysis</h1>
                    </div>
                    <p className="text-muted-foreground text-base ml-5">
                        Visualize your creative output and export data
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={handleExportJSON} variant="outline" className="glass">
                        <Download className="h-4 w-4 mr-2" />
                        Backup JSON
                    </Button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Characters */}
                <div
                    onClick={() => handleSelect('Category', 'Characters')}
                    className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all shine"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <User className="h-16 w-16 text-primary" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide mb-1">Characters</p>
                        <h3 className="text-4xl font-bold text-foreground">{characters.length}</h3>
                    </div>
                </div>

                {/* Worlds */}
                <div
                    onClick={() => handleSelect('Category', 'Worlds')}
                    className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-violet-500/50 transition-all shine"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Globe className="h-16 w-16 text-violet-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide mb-1">Worlds</p>
                        <h3 className="text-4xl font-bold text-foreground">{worlds.length}</h3>
                    </div>
                </div>

                {/* Projects */}
                <div
                    onClick={() => handleSelect('Category', 'Projects')}
                    className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-cyan-500/50 transition-all shine"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Folder className="h-16 w-16 text-cyan-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide mb-1">Projects</p>
                        <h3 className="text-4xl font-bold text-foreground">{projects.length}</h3>
                    </div>
                </div>

                {/* Chat Sessions */}
                <div
                    onClick={() => handleSelect('Category', 'Chat Sessions')}
                    className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-amber-500/50 transition-all shine"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <MessageSquare className="h-16 w-16 text-amber-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide mb-1">Total Chats</p>
                        <h3 className="text-4xl font-bold text-foreground">{chatSessions.length}</h3>
                    </div>
                </div>

                {/* Velocity */}
                <div
                    onClick={() => handleSelect('Category', 'Global Progress')}
                    className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-emerald-500/50 transition-all shine"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BarChart3 className="h-16 w-16 text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide mb-1">Global Progress</p>
                        <h3 className="text-4xl font-bold text-emerald-400">{totalProgress}%</h3>
                    </div>
                </div>

                {/* Documents */}
                <div
                    onClick={() => handleSelect('Category', 'Documents')}
                    className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-blue-500/50 transition-all shine"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText className="h-16 w-16 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide mb-1">Current Documents</p>
                        <h3 className="text-4xl font-bold text-foreground mb-3">{totalDocuments}</h3>
                        <div className="space-y-2 pt-3 border-t border-white/5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Total</span>
                                <span className="text-foreground font-semibold">{totalDocuments}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Uploaded</span>
                                <span className="text-blue-400 font-semibold">{uploadedDocuments}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Generated</span>
                                <span className="text-cyan-400 font-semibold">{generatedDocuments}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Archetype Distribution */}
                <div className="glass-card p-8 rounded-2xl">
                    <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                        Character Archetypes
                        <Info className="h-4 w-4 text-muted-foreground" />
                    </h3>

                    <div className="space-y-4">
                        {archetypeDist.length > 0 ? archetypeDist.map(([key, val]) => (
                            <div
                                key={key}
                                onClick={() => handleSelect('Archetype', key)}
                                className="cursor-pointer group"
                            >
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground group-hover:text-primary transition-colors">{key}</span>
                                    <span className="text-foreground font-medium">{val}</span>
                                </div>
                                <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary/80 rounded-full group-hover:bg-primary transition-colors duration-300"
                                        style={{ width: `${(val / maxVal) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )) : <div className="text-sm text-muted-foreground italic">No character data available.</div>}
                    </div>
                </div>

                {/* Roles & Genres */}
                <div className="space-y-8">
                    <div className="glass-card p-8 rounded-2xl">
                        <h3 className="text-lg font-medium mb-6">Roles Breakdown</h3>
                        <div className="flex flex-wrap gap-3">
                            {roleDist.length > 0 ? roleDist.map(([key, val]) => (
                                <button
                                    key={key}
                                    onClick={() => handleSelect('Role', key)}
                                    className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3 hover:bg-white/[0.08] hover:border-primary/30 transition-all"
                                >
                                    <span className="text-sm text-muted-foreground">{key}</span>
                                    <span className="text-lg font-bold text-foreground">{val}</span>
                                </button>
                            )) : <div className="text-sm text-muted-foreground italic">No roles defined.</div>}
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-2xl border-violet-500/10">
                        <h3 className="text-lg font-medium mb-6">World Genres</h3>
                        <div className="flex flex-wrap gap-2">
                            {worldGenreDist.length > 0 ? worldGenreDist.map(([key, val]) => (
                                <button
                                    key={key}
                                    onClick={() => handleSelect('Genre', key)}
                                    className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 text-sm border border-violet-500/20 hover:bg-violet-500/20 hover:border-violet-500/40 transition-colors"
                                >
                                    {key} ({val})
                                </button>
                            )) : <div className="text-sm text-muted-foreground italic">No world data available.</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Relationship Graph & Auto-Link Suggestions */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Relationship Graph - Takes 2 columns */}
                <div className="lg:col-span-2 glass-card p-8 rounded-2xl">
                    <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                        <Network className="h-5 w-5 text-violet-400" />
                        Entity Relationships
                        <span className="text-xs text-muted-foreground font-normal ml-2">
                            Click nodes to navigate • Drag to pan • Scroll to zoom
                        </span>
                    </h3>
                    <RelationshipGraph height={400} className="w-full" />
                </div>

                {/* Auto-Link Suggestions - Takes 1 column */}
                <div className="glass-card p-6 rounded-2xl">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-violet-400" />
                        Smart Suggestions
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                        AI-detected relationships between your unlinked entities
                    </p>
                    <AutoLinkSuggestions maxSuggestions={6} />
                </div>
            </div>

            {/* Details Modal / Overlay */}
            {selectedFilter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedFilter(null)}>
                    <div
                        className="bg-[#0A0A0F] border border-white/10 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{selectedFilter.type}</span>
                                    <h3 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                                        {selectedFilter.value}
                                        <span className="text-sm font-medium text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                                            {filteredItems.length}
                                        </span>
                                    </h3>
                                </div>
                                <button onClick={() => setSelectedFilter(null)} className="text-muted-foreground hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Filters & Sort Controls */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full text-sm bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn("glass text-xs h-9", sortConfig.key === 'name' && "bg-white/10 border-white/20")}
                                    onClick={() => toggleSort('name')}
                                >
                                    Name
                                    {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />)}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn("glass text-xs h-9", sortConfig.key === 'progress' && "bg-white/10 border-white/20")}
                                    onClick={() => toggleSort('progress')}
                                >
                                    Progress
                                    {sortConfig.key === 'progress' && (sortConfig.direction === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />)}
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable List */}
                        <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                            {filteredItems.length > 0 ? (
                                <div className="grid gap-2 p-2">
                                    {filteredItems.map(item => {
                                        const isDocument = item.type === 'Document';
                                        const itemContent = (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                                        item.type === 'Character' ? "bg-primary/10 text-primary" :
                                                            item.type === 'World' ? "bg-violet-500/10 text-violet-400" :
                                                                item.type === 'Document' ? "bg-blue-500/10 text-blue-400" :
                                                                    item.type === 'Chat' ? "bg-amber-500/10 text-amber-400" :
                                                                        "bg-cyan-500/10 text-cyan-400"
                                                    )}>
                                                        {item.type === 'Character' ? <User className="h-5 w-5" /> :
                                                            item.type === 'World' ? <Globe className="h-5 w-5" /> :
                                                                item.type === 'Document' ? <FileText className="h-5 w-5" /> :
                                                                    item.type === 'Chat' ? <MessageSquare className="h-5 w-5" /> :
                                                                        <Folder className="h-5 w-5" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">{item.name}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                            <span>{item.type}</span>
                                                            {item.progress !== undefined && (
                                                                <span className={cn(
                                                                    "px-1.5 py-0.5 rounded text-[10px]",
                                                                    item.progress === 100 ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10"
                                                                )}>{item.progress}%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
                                            </>
                                        );

                                        if (isDocument) {
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={(e) => handleDocumentClick(e, item.id, item.name)}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                                                >
                                                    {itemContent}
                                                </div>
                                            );
                                        }

                                        return (
                                            <Link
                                                key={item.id}
                                                href={item.url}
                                                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all group"
                                            >
                                                {itemContent}
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                    <Search className="h-8 w-8 mb-3 opacity-20" />
                                    <p className="text-sm">No items found matching your filters.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer / Count (Optional) */}
                        <div className="p-3 border-t border-white/5 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                Showing {filteredItems.length} of {selectedFilter.items.length} Items
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Navigation Modal */}
            {documentNavModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDocumentNavModal(null)}>
                    <div
                        className="bg-[#0A0A0F] border border-white/10 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-400" />
                                        Navigate to Document
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">{documentNavModal.documentName}</p>
                                </div>
                                <button onClick={() => setDocumentNavModal(null)} className="text-muted-foreground hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                This document appears in multiple locations. Choose where to navigate:
                            </p>
                        </div>

                        {/* Locations List */}
                        <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
                            <div className="space-y-2">
                                {documentNavModal.locations.map((location, index) => (
                                    <Link
                                        key={index}
                                        href={location.url}
                                        onClick={() => setDocumentNavModal(null)}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                                location.type === 'character' ? "bg-primary/10 text-primary" : "bg-cyan-500/10 text-cyan-400"
                                            )}>
                                                {location.type === 'character' ? <User className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">{location.label}</div>
                                                <div className="text-xs text-muted-foreground">{location.type === 'character' ? 'Character Document' : 'Project Document'}</div>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
