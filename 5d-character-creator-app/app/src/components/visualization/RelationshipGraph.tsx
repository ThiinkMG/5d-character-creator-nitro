'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GraphNode {
    id: string;
    type: 'character' | 'world' | 'project';
    name: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    radius: number;
}

interface GraphEdge {
    source: string;
    target: string;
    type: 'project' | 'world';
}

interface RelationshipGraphProps {
    projectId?: string;
    worldId?: string;
    characterId?: string;
    width?: number;
    height?: number;
    className?: string;
}

const NODE_COLORS = {
    character: '#34d399', // emerald-400
    world: '#60a5fa',     // blue-400
    project: '#fb923c',   // orange-400
};

const NODE_RADIUS = {
    character: 20,
    world: 25,
    project: 30,
};

export function RelationshipGraph({
    projectId,
    worldId,
    characterId,
    width: propWidth,
    height: propHeight,
    className
}: RelationshipGraphProps) {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    const { characters, worlds, projects } = useStore();

    const [dimensions, setDimensions] = useState({ width: propWidth || 600, height: propHeight || 400 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Build graph data from store
    const { nodes, edges } = useMemo(() => {
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const nodeMap = new Map<string, GraphNode>();

        // Filter based on focus entity
        let relevantProjects = projects;
        let relevantWorlds = worlds;
        let relevantCharacters = characters;

        if (projectId) {
            relevantProjects = projects.filter(p => p.id === projectId);
            relevantCharacters = characters.filter(c => c.projectId === projectId);
            relevantWorlds = worlds.filter(w => w.projectId === projectId);
        } else if (worldId) {
            relevantWorlds = worlds.filter(w => w.id === worldId);
            relevantCharacters = characters.filter(c => c.worldId === worldId);
            const worldProjectIds = relevantWorlds.map(w => w.projectId).filter(Boolean);
            relevantProjects = projects.filter(p => worldProjectIds.includes(p.id));
        } else if (characterId) {
            relevantCharacters = characters.filter(c => c.id === characterId);
            const charProjectIds = relevantCharacters.map(c => c.projectId).filter(Boolean);
            const charWorldIds = relevantCharacters.map(c => c.worldId).filter(Boolean);
            relevantProjects = projects.filter(p => charProjectIds.includes(p.id));
            relevantWorlds = worlds.filter(w => charWorldIds.includes(w.id) || charProjectIds.includes(w.projectId));
        }

        // Add project nodes (center)
        relevantProjects.forEach((project, i) => {
            const node: GraphNode = {
                id: project.id,
                type: 'project',
                name: project.name,
                x: dimensions.width / 2 + Math.cos(i * Math.PI * 2 / Math.max(relevantProjects.length, 1)) * 50,
                y: dimensions.height / 2 + Math.sin(i * Math.PI * 2 / Math.max(relevantProjects.length, 1)) * 50,
                vx: 0,
                vy: 0,
                color: NODE_COLORS.project,
                radius: NODE_RADIUS.project,
            };
            nodes.push(node);
            nodeMap.set(project.id, node);
        });

        // Add world nodes
        relevantWorlds.forEach((world, i) => {
            const angle = (i / Math.max(relevantWorlds.length, 1)) * Math.PI * 2;
            const node: GraphNode = {
                id: world.id,
                type: 'world',
                name: world.name,
                x: dimensions.width / 2 + Math.cos(angle) * 120,
                y: dimensions.height / 2 + Math.sin(angle) * 120,
                vx: 0,
                vy: 0,
                color: NODE_COLORS.world,
                radius: NODE_RADIUS.world,
            };
            nodes.push(node);
            nodeMap.set(world.id, node);

            // Create edge to project if linked
            if (world.projectId && nodeMap.has(world.projectId)) {
                edges.push({
                    source: world.projectId,
                    target: world.id,
                    type: 'project',
                });
            }
        });

        // Add character nodes
        relevantCharacters.forEach((char, i) => {
            const angle = (i / Math.max(relevantCharacters.length, 1)) * Math.PI * 2 + Math.PI / 4;
            const node: GraphNode = {
                id: char.id,
                type: 'character',
                name: char.name,
                x: dimensions.width / 2 + Math.cos(angle) * 180,
                y: dimensions.height / 2 + Math.sin(angle) * 180,
                vx: 0,
                vy: 0,
                color: NODE_COLORS.character,
                radius: NODE_RADIUS.character,
            };
            nodes.push(node);
            nodeMap.set(char.id, node);

            // Create edge to project if linked
            if (char.projectId && nodeMap.has(char.projectId)) {
                edges.push({
                    source: char.projectId,
                    target: char.id,
                    type: 'project',
                });
            }

            // Create edge to world if linked
            if (char.worldId && nodeMap.has(char.worldId)) {
                edges.push({
                    source: char.worldId,
                    target: char.id,
                    type: 'world',
                });
            }
        });

        return { nodes, edges };
    }, [characters, worlds, projects, projectId, worldId, characterId, dimensions]);

    // Force simulation
    const simulateForces = useCallback(() => {
        const strength = 0.1;
        const repulsion = 2000;
        const damping = 0.9;

        // Apply repulsion between all nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = repulsion / (dist * dist);

                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                nodes[i].vx -= fx;
                nodes[i].vy -= fy;
                nodes[j].vx += fx;
                nodes[j].vy += fy;
            }
        }

        // Apply attraction along edges
        edges.forEach(edge => {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            if (!source || !target) return;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetDist = 100;
            const force = (dist - targetDist) * strength;

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
        });

        // Apply center gravity
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        nodes.forEach(node => {
            node.vx += (centerX - node.x) * 0.01;
            node.vy += (centerY - node.y) * 0.01;
        });

        // Update positions with damping
        nodes.forEach(node => {
            node.vx *= damping;
            node.vy *= damping;
            node.x += node.vx;
            node.y += node.vy;

            // Keep within bounds
            node.x = Math.max(node.radius, Math.min(dimensions.width - node.radius, node.x));
            node.y = Math.max(node.radius, Math.min(dimensions.height - node.radius, node.y));
        });
    }, [nodes, edges, dimensions]);

    // Draw the graph
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#08080c';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);

        // Apply zoom and pan
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);

        // Draw edges
        edges.forEach(edge => {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            if (!source || !target) return;

            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = edge.type === 'project' ? 'rgba(251, 146, 60, 0.3)' : 'rgba(96, 165, 250, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw nodes
        nodes.forEach(node => {
            const isHovered = hoveredNode === node.id;
            const isFocused = node.id === projectId || node.id === worldId || node.id === characterId;

            // Node glow
            if (isHovered || isFocused) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
                ctx.fillStyle = `${node.color}40`;
                ctx.fill();
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fillStyle = isHovered ? '#ffffff' : node.color;
            ctx.fill();

            // Node border
            ctx.strokeStyle = isFocused ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = isFocused ? 3 : 1;
            ctx.stroke();

            // Node label
            ctx.fillStyle = '#ffffff';
            ctx.font = `${isHovered ? 'bold ' : ''}11px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Truncate name if too long
            let displayName = node.name;
            if (displayName.length > 12) {
                displayName = displayName.slice(0, 10) + '...';
            }
            ctx.fillText(displayName, node.x, node.y + node.radius + 14);
        });

        ctx.restore();

        // Run simulation
        simulateForces();

        animationRef.current = requestAnimationFrame(draw);
    }, [nodes, edges, dimensions, zoom, pan, hoveredNode, projectId, worldId, characterId, simulateForces]);

    // Handle canvas interactions
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;

        if (isDragging) {
            setPan({
                x: pan.x + e.movementX,
                y: pan.y + e.movementY,
            });
            return;
        }

        // Check if hovering over a node
        const hovered = nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) < node.radius;
        });

        setHoveredNode(hovered?.id || null);
        canvas.style.cursor = hovered ? 'pointer' : isDragging ? 'grabbing' : 'grab';
    }, [nodes, zoom, pan, isDragging]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!hoveredNode) return;

        const node = nodes.find(n => n.id === hoveredNode);
        if (!node) return;

        // Navigate to entity page
        const path = node.type === 'character' ? `/characters/${node.id}`
            : node.type === 'world' ? `/worlds/${node.id}`
            : `/projects/${node.id}`;

        router.push(path);
    }, [hoveredNode, nodes, router]);

    const handleMouseDown = useCallback(() => {
        if (!hoveredNode) {
            setIsDragging(true);
        }
    }, [hoveredNode]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Reset view
    const resetView = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    // Start animation
    useEffect(() => {
        draw();
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [draw]);

    // Handle resize
    useEffect(() => {
        const container = containerRef.current;
        if (!container || propWidth || propHeight) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [propWidth, propHeight]);

    if (nodes.length === 0) {
        return (
            <div className={cn("flex items-center justify-center bg-black/20 rounded-xl border border-white/10", className)}
                 style={{ width: dimensions.width, height: dimensions.height }}>
                <div className="text-center text-muted-foreground">
                    <p className="text-sm">No relationships to display</p>
                    <p className="text-xs mt-1">Link characters to projects or worlds to see connections</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn("relative rounded-xl overflow-hidden border border-white/10 bg-black/20", className)}
            style={{ width: propWidth || '100%', height: propHeight || 400 }}
        >
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="cursor-grab"
            />

            {/* Controls */}
            <div className="absolute top-2 right-2 flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
                    className="h-7 w-7 bg-black/40 backdrop-blur-sm hover:bg-white/10"
                >
                    <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
                    className="h-7 w-7 bg-black/40 backdrop-blur-sm hover:bg-white/10"
                >
                    <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetView}
                    className="h-7 w-7 bg-black/40 backdrop-blur-sm hover:bg-white/10"
                >
                    <Maximize2 className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 flex gap-3 text-[10px] bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1">
                <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS.character }} />
                    Character
                </span>
                <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS.world }} />
                    World
                </span>
                <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS.project }} />
                    Project
                </span>
            </div>

            {/* Node count */}
            <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1">
                {nodes.length} nodes • {edges.length} connections
            </div>
        </div>
    );
}
