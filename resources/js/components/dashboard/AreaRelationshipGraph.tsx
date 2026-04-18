import { useEffect, useRef, useState } from 'react';
import { GitBranch } from 'lucide-react';

interface Node {
    id: string;
    label: string;
    type: 'area' | 'subarea' | 'program';
    areaId?: string;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
}

interface Link {
    source: string;
    target: string;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
}

interface Props {
    data: GraphData;
}

export default function AreaRelationshipGraph({ data }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('all');
    const animationRef = useRef<number | undefined>(undefined);

    // Extract unique areas for tabs
    const areas = Array.from(new Set(
        data.nodes
            .filter(n => n.type === 'area')
            .map(n => ({ id: n.id, label: n.label }))
    ));

    // Filter data based on active tab
    const filteredData = activeTab === 'all' 
        ? data 
        : {
            nodes: data.nodes.filter(node => {
                if (node.type === 'area') return node.id === activeTab;
                if (node.type === 'subarea') {
                    return data.links.some(link => 
                        link.source === activeTab && link.target === node.id
                    );
                }
                if (node.type === 'program') {
                    const areaSubareas = data.nodes
                        .filter(n => n.type === 'subarea')
                        .filter(n => data.links.some(l => l.source === activeTab && l.target === n.id))
                        .map(n => n.id);
                    return data.links.some(link => 
                        areaSubareas.includes(link.source) && link.target === node.id
                    );
                }
                return false;
            }),
            links: data.links.filter(link => {
                const sourceNode = data.nodes.find(n => n.id === link.source);
                const targetNode = data.nodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return false;

                if (activeTab === 'all') return true;

                if (link.source === activeTab) return true;
                
                const isSourceSubareaOfActiveArea = data.links.some(l => 
                    l.source === activeTab && l.target === link.source
                );
                if (isSourceSubareaOfActiveArea) return true;

                return false;
            })
        };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // High DPI support for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        // Initialize node positions if not set
        filteredData.nodes.forEach((node, i) => {
            if (node.x === undefined || node.y === undefined) {
                const angle = (i / filteredData.nodes.length) * 2 * Math.PI;
                const radius = Math.min(width, height) * 0.3;
                node.x = width / 2 + radius * Math.cos(angle);
                node.y = height / 2 + radius * Math.sin(angle);
                node.vx = 0;
                node.vy = 0;
            }
        });

        // Force simulation
        const simulate = () => {
            filteredData.nodes.forEach((node) => {
                if (!node.x || !node.y) return;

                const centerX = width / 2;
                const centerY = height / 2;
                const dx = centerX - node.x;
                const dy = centerY - node.y;
                node.vx = (node.vx || 0) + dx * 0.0008;
                node.vy = (node.vy || 0) + dy * 0.0008;

                filteredData.nodes.forEach((other) => {
                    if (node === other || !other.x || !other.y) return;
                    const dx = node.x! - other.x;
                    const dy = node.y! - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (dist < 120) {
                        const force = (120 - dist) / dist * 0.4;
                        node.vx = (node.vx || 0) + dx * force * 0.008;
                        node.vy = (node.vy || 0) + dy * force * 0.008;
                    }
                });

                filteredData.links.forEach((link) => {
                    const source = filteredData.nodes.find(n => n.id === link.source);
                    const target = filteredData.nodes.find(n => n.id === link.target);
                    if (!source || !target || !source.x || !source.y || !target.x || !target.y) return;

                    if (node === source || node === target) {
                        const other = node === source ? target : source;
                        if (!other.x || !other.y) return;
                        const dx = other.x - node.x!;
                        const dy = other.y - node.y!;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = (dist - 80) / dist * 0.08;
                        node.vx = (node.vx || 0) + dx * force * 0.008;
                        node.vy = (node.vy || 0) + dy * force * 0.008;
                    }
                });

                node.vx = (node.vx || 0) * 0.88;
                node.vy = (node.vy || 0) * 0.88;
                node.x = node.x! + (node.vx || 0);
                node.y = node.y! + (node.vy || 0);

                node.x = Math.max(30, Math.min(width - 30, node.x));
                node.y = Math.max(30, Math.min(height - 30, node.y));
            });
        };

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Enable anti-aliasing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw links with gradient
            filteredData.links.forEach((link) => {
                const source = filteredData.nodes.find(n => n.id === link.source);
                const target = filteredData.nodes.find(n => n.id === link.target);
                if (!source || !target || !source.x || !source.y || !target.x || !target.y) return;

                // Gradient line
                const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
                gradient.addColorStop(0, 'rgba(148, 163, 184, 0.3)');
                gradient.addColorStop(1, 'rgba(148, 163, 184, 0.15)');
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();

                // Arrow
                const angle = Math.atan2(target.y - source.y, target.x - source.x);
                const arrowSize = 7;
                const arrowX = target.x - Math.cos(angle) * 20;
                const arrowY = target.y - Math.sin(angle) * 20;
                
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(
                    arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
                    arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
                    arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
                ctx.fill();
            });

            // Draw nodes with glow effect
            filteredData.nodes.forEach((node) => {
                if (!node.x || !node.y) return;

                const isHovered = hoveredNode === node.id;
                const isDragged = draggedNode === node.id;
                const radius = isHovered || isDragged ? 18 : 14;

                const colors = {
                    area: { bg: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' },
                    subarea: { bg: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
                    program: { bg: '#ec4899', glow: 'rgba(236, 72, 153, 0.3)' },
                };
                const color = colors[node.type];

                // Outer glow
                if (isHovered || isDragged) {
                    const glowGradient = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius + 8);
                    glowGradient.addColorStop(0, color.glow);
                    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = glowGradient;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI);
                    ctx.fill();
                }

                // Node circle with gradient
                const nodeGradient = ctx.createRadialGradient(
                    node.x - radius * 0.3, 
                    node.y - radius * 0.3, 
                    0, 
                    node.x, 
                    node.y, 
                    radius
                );
                nodeGradient.addColorStop(0, color.bg);
                nodeGradient.addColorStop(1, color.bg + 'dd');

                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = nodeGradient;
                ctx.fill();

                // Border
                ctx.strokeStyle = isHovered || isDragged ? '#ffffff' : color.bg;
                ctx.lineWidth = isHovered || isDragged ? 2.5 : 2;
                ctx.stroke();

                // Inner highlight
                ctx.beginPath();
                ctx.arc(node.x - radius * 0.25, node.y - radius * 0.25, radius * 0.3, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fill();

                // Label with shadow
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 1;
                ctx.fillStyle = '#1e293b';
                ctx.font = isHovered || isDragged ? '600 11px "DM Sans", sans-serif' : '500 10px "DM Sans", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(node.label, node.x, node.y + radius + 6);
                
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            });
        };

        const animate = () => {
            if (!isDragging) {
                simulate();
            }
            render();
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [filteredData, hoveredNode, isDragging, draggedNode]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width) / (window.devicePixelRatio || 1);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height) / (window.devicePixelRatio || 1);

        if (isDragging && draggedNode) {
            const node = filteredData.nodes.find(n => n.id === draggedNode);
            if (node) {
                node.x = x;
                node.y = y;
                node.vx = 0;
                node.vy = 0;
            }
            return;
        }

        let found = false;
        for (const node of filteredData.nodes) {
            if (!node.x || !node.y) continue;
            const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            if (dist < 14) {
                setHoveredNode(node.id);
                found = true;
                break;
            }
        }
        if (!found) {
            setHoveredNode(null);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width) / (window.devicePixelRatio || 1);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height) / (window.devicePixelRatio || 1);

        for (const node of filteredData.nodes) {
            if (!node.x || !node.y) continue;
            const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            if (dist < 14) {
                setIsDragging(true);
                setDraggedNode(node.id);
                break;
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDraggedNode(null);
    };

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #dde1ed',
            borderRadius: 12,
            padding: 20,
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <GitBranch size={16} color="#0f1f3d" />
                    <div style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#0f1f3d',
                    }}>
                        Area Relationships
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#8892aa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                        Area
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                        Sub-Area
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ec4899' }} />
                        Program
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: 6,
                marginBottom: 16,
                borderBottom: '1px solid #f0f2f8',
                paddingBottom: 8,
                overflowX: 'auto',
                scrollbarWidth: 'thin',
            }}>
                <button
                    onClick={() => setActiveTab('all')}
                    style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        border: 'none',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: activeTab === 'all' ? '#0f1f3d' : 'transparent',
                        color: activeTab === 'all' ? '#fff' : '#8892aa',
                        whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'all') {
                            e.currentTarget.style.background = '#f8f9fc';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'all') {
                            e.currentTarget.style.background = 'transparent';
                        }
                    }}
                >
                    All Areas
                </button>
                {areas.map((area, index) => (
                    <button
                        key={area.id}
                        onClick={() => setActiveTab(area.id)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: activeTab === area.id ? '#0f1f3d' : 'transparent',
                            color: activeTab === area.id ? '#fff' : '#8892aa',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== area.id) {
                                e.currentTarget.style.background = '#f8f9fc';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== area.id) {
                                e.currentTarget.style.background = 'transparent';
                            }
                        }}
                    >
                        Area {index + 1}
                    </button>
                ))}
            </div>

            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: 280,
                    cursor: isDragging ? 'grabbing' : (hoveredNode ? 'grab' : 'default'),
                }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
}
