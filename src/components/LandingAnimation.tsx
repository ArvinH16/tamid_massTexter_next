'use client';

import { useEffect, useRef, useCallback } from 'react';

// Define types for our network components
type NetworkNode = {
    x: number;
    y: number;
    radius: number;
    type: string;
    connected: NetworkNode[];
    pulseActive: boolean;
    pulseRadius: number;
    pulseOpacity: number;
    nextPulseTime: number;
    size: number;
    draw: () => void;
    drawConnections: () => void;
    startPulse: () => void;
    updatePulse: (timestamp: number) => void;
};

type Signal = {
    startNode: NetworkNode;
    endNode: NetworkNode;
    progress: number;
    speed: number;
    color: string;
    active: boolean;
    width: number;
    update: () => void;
    draw: () => void;
};

export function LandingAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const networkRef = useRef<{ nodes: NetworkNode[], signals: Signal[] } | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error("Canvas element not found");
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error("Could not get canvas context");
            return;
        }

        // Set canvas size
        const setCanvasSize = () => {
            // Only update if dimensions actually changed
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                
                // Recreate network when window is resized
                if (networkRef.current) {
                    const { nodes, signals } = createNetwork();
                    networkRef.current = { nodes, signals };
                }
            }
        };
        
        // Debounced resize handler to prevent excessive updates
        const handleResize = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            
            resizeTimeoutRef.current = setTimeout(() => {
                setCanvasSize();
                resizeTimeoutRef.current = null;
            }, 150); // 150ms debounce
        };
        
        setCanvasSize();
        window.addEventListener('resize', handleResize);

        // Create nodes representing devices/companies
        class NetworkNodeImpl implements NetworkNode {
            x: number;
            y: number;
            radius: number;
            type: string;
            connected: NetworkNode[];
            pulseActive: boolean;
            pulseRadius: number;
            pulseOpacity: number;
            nextPulseTime: number;
            size: number;

            constructor(x: number, y: number, type: string) {
                this.x = x;
                this.y = y;
                this.radius = Math.random() * 2 + 2; // Smaller nodes
                this.size = type === 'phone' ? 1 : (type === 'company' ? 1.2 : 1.5); // Differentiate sizes by type
                this.type = type; // 'phone', 'company', 'server'
                this.connected = [];
                this.pulseActive = false;
                this.pulseRadius = 0;
                this.pulseOpacity = 0;
                this.nextPulseTime = Math.random() * 10000; // Less frequent pulses
            }

            draw() {
                if (!ctx) return;
                
                // Draw node
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#9ca3af'; // Light gray
                ctx.fill();

                // Draw pulse if active
                if (this.pulseActive) {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.pulseRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(139, 92, 246, ${this.pulseOpacity * 0.7})`; // Softer pulse
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }

            drawConnections() {
                if (!ctx) return;
                for (const connectedNode of this.connected) {
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(connectedNode.x, connectedNode.y);
                    ctx.strokeStyle = '#4b5563'; // Darker gray for connections
                    ctx.lineWidth = 0.5; // Thinner connections
                    ctx.stroke();
                }
            }

            startPulse() {
                this.pulseActive = true;
                this.pulseRadius = 0;
                this.pulseOpacity = 0.8; // Lower starting opacity
            }

            updatePulse(timestamp: number) {
                // Only update existing pulses, don't start new ones automatically
                if (this.pulseActive) {
                    this.pulseRadius += 1.5;
                    this.pulseOpacity -= 0.008; // Fade out faster

                    if (this.pulseOpacity <= 0) {
                        this.pulseActive = false;
                        this.pulseRadius = 0;
                    } else {
                        // Propagate pulse to connected nodes less frequently
                        if (this.pulseRadius > 40 && Math.random() > 0.95) { // Much less frequent propagation
                            if (this.connected.length > 0) {
                                const randomNode = this.connected[Math.floor(Math.random() * this.connected.length)];
                                if (randomNode && !randomNode.pulseActive) {
                                    randomNode.startPulse();
                                }
                            }
                        }
                    }
                }
            }
        }

        // Signal class for animated data transfer
        class SignalImpl implements Signal {
            startNode: NetworkNode;
            endNode: NetworkNode;
            progress: number;
            speed: number;
            color: string;
            active: boolean;
            width: number;

            constructor(startNode: NetworkNode, endNode: NetworkNode) {
                this.startNode = startNode;
                this.endNode = endNode;
                this.progress = 0;
                this.speed = 0.003 + Math.random() * 0.002; // Even slower signals
                this.color = `hsl(${Math.random() > 0.7 ? '270, 85%, 75%' : '260, 75%, 85%'})`;
                this.active = true;
                this.width = 1.5 + Math.random(); // Varied width
            }

            update() {
                if (this.active) {
                    this.progress += this.speed;
                    if (this.progress >= 1) {
                        this.active = false;
                        // Start a pulse at the destination
                        if (!this.endNode.pulseActive) {
                            this.endNode.startPulse();
                        }
                    }
                }
            }

            draw() {
                if (!ctx || !this.active) return;

                const currentX = this.startNode.x + (this.endNode.x - this.startNode.x) * this.progress;
                const currentY = this.startNode.y + (this.endNode.y - this.startNode.y) * this.progress;

                // Draw signal head
                ctx.beginPath();
                ctx.arc(currentX, currentY, 2, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();

                // Draw signal on wire
                const dx = this.endNode.x - this.startNode.x;
                const dy = this.endNode.y - this.startNode.y;
                const lineLength = Math.sqrt(dx * dx + dy * dy);
                
                // Draw the entire wire with a glow when signal is active
                ctx.beginPath();
                ctx.moveTo(this.startNode.x, this.startNode.y);
                ctx.lineTo(this.endNode.x, this.endNode.y);
                ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 * (1 - this.progress)})`; // Subtle glow
                ctx.lineWidth = this.width;
                ctx.stroke();

                // Draw signal trail
                const trailLength = 0.1;
                if (this.progress > trailLength) {
                    const trailStartProgress = Math.max(0, this.progress - trailLength);
                    const trailStartX = this.startNode.x + (this.endNode.x - this.startNode.x) * trailStartProgress;
                    const trailStartY = this.startNode.y + (this.endNode.y - this.startNode.y) * trailStartProgress;

                    const gradient = ctx.createLinearGradient(trailStartX, trailStartY, currentX, currentY);
                    gradient.addColorStop(0, 'rgba(147, 51, 234, 0)');
                    gradient.addColorStop(1, this.color);

                    ctx.beginPath();
                    ctx.moveTo(trailStartX, trailStartY);
                    ctx.lineTo(currentX, currentY);
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = this.width + 0.5;
                    ctx.stroke();
                }
            }
        }

        // Icon drawing helper functions
        const drawPhoneIcon = (x: number, y: number, size: number) => {
            if (!ctx) return;
            
            ctx.beginPath();
            ctx.rect(x - size/3, y - size/2, size*2/3, size);
            ctx.arc(x, y - size/3, size/8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(167, 139, 250, 0.8)'; // Softer purple
            ctx.fill();
        };

        const drawCompanyIcon = (x: number, y: number, size: number) => {
            if (!ctx) return;
            
            ctx.beginPath();
            ctx.moveTo(x - size/2, y + size/3);
            ctx.lineTo(x - size/2, y - size/3);
            ctx.lineTo(x, y - size/2);
            ctx.lineTo(x + size/2, y - size/3);
            ctx.lineTo(x + size/2, y + size/3);
            ctx.fillStyle = 'rgba(96, 165, 250, 0.8)'; // Softer blue
            ctx.fill();
        };

        const drawServerIcon = (x: number, y: number, size: number) => {
            if (!ctx) return;
            
            ctx.beginPath();
            ctx.rect(x - size/3, y - size/2, size*2/3, size);
            ctx.rect(x - size/4, y - size/3, size/2, size/4);
            ctx.rect(x - size/4, y, size/2, size/4);
            ctx.fillStyle = 'rgba(244, 114, 182, 0.8)'; // Softer pink
            ctx.fill();
        };

        // Create nodes and connections
        const createNetwork = () => {
            const nodes: NetworkNode[] = [];
            const signals: Signal[] = [];
            
            // Create a pyramid/triangle network pattern
            const rows = 5; // Number of rows in the pyramid
            const maxNodesInRow = 7; // Maximum nodes in the widest row
            const nodeSpacing = Math.min(canvas.width / (maxNodesInRow + 1), canvas.height / (rows + 1));
            
            // Calculate starting position (top middle of screen)
            const startX = canvas.width / 2;
            const startY = nodeSpacing * 1.5; // Start from top with some padding
            
            // Create nodes in a pyramid pattern
            for (let row = 0; row < rows; row++) {
                // Calculate nodes in this row (increases as we go down)
                const nodesInRow = Math.min(maxNodesInRow, 1 + row * 2);
                const rowWidth = nodesInRow * nodeSpacing;
                const rowStartX = startX - rowWidth / 2 + nodeSpacing / 2;
                
                for (let col = 0; col < nodesInRow; col++) {
                    const x = rowStartX + col * nodeSpacing;
                    const y = startY + row * nodeSpacing;
                    
                    // Determine node type based on position
                    let type = 'phone';
                    if (row === 0) {
                        type = 'server'; // Top node is a server
                    } else if (row === rows - 1) {
                        type = 'phone'; // Bottom row is phones
                    } else {
                        type = 'company'; // Middle rows are companies
                    }
                    
                    nodes.push(new NetworkNodeImpl(x, y, type));
                }
            }
            
            // Create connections (each node connects to nodes below it)
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const nodeRow = Math.floor(i / maxNodesInRow);
                
                // Skip connections for the bottom row
                if (nodeRow < rows - 1) {
                    // Calculate indices of nodes in the row below
                    const nextRowStart = (nodeRow + 1) * maxNodesInRow;
                    const nextRowEnd = Math.min((nodeRow + 2) * maxNodesInRow, nodes.length);
                    
                    // Find the closest nodes in the row below
                    for (let j = nextRowStart; j < nextRowEnd; j++) {
                        const targetNode = nodes[j];
                        const distance = Math.abs(node.x - targetNode.x);
                        
                        // Connect to nodes that are close horizontally
                        if (distance < nodeSpacing * 1.5) {
                            node.connected.push(targetNode);
                        }
                    }
                }
            }

            // Start with just a few initial signals from the top server
            const topServer = nodes.find(node => node.type === 'server');
            if (topServer && topServer.connected.length > 0) {
                for (let i = 0; i < 2; i++) {
                    const targetNode = topServer.connected[Math.floor(Math.random() * topServer.connected.length)];
                    signals.push(new SignalImpl(topServer, targetNode));
                }
            }

            return { nodes, signals };
        };

        // Initialize network
        networkRef.current = createNetwork();

        // Animation loop
        const animate = (timestamp: number) => {
            if (!ctx || !networkRef.current) return;
            
            const { nodes, signals } = networkRef.current;
            
            // Clear canvas with nearly opaque black to reduce flickering
            ctx.fillStyle = 'rgba(0, 0, 0, 0.99)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw connections
            nodes.forEach(node => node.drawConnections());
            
            // Update and draw nodes with pulses
            nodes.forEach(node => {
                node.updatePulse(timestamp);
                node.draw();
                
                // Draw appropriate icon for node type
                const iconSize = node.radius * 6 * node.size; // Scale icon size based on node type
                if (node.type === 'phone') {
                    drawPhoneIcon(node.x, node.y, iconSize);
                } else if (node.type === 'company') {
                    drawCompanyIcon(node.x, node.y, iconSize);
                } else if (node.type === 'server') {
                    drawServerIcon(node.x, node.y, iconSize);
                }
            });
            
            // Update and draw active signals
            signals.forEach(signal => {
                signal.update();
                signal.draw();
            });
            
            // Occasionally create new signals (much less frequently)
            if (Math.random() > 0.995) { // Significantly reduced frequency
                const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
                if (randomNode.connected.length > 0) {
                    const targetNode = randomNode.connected[Math.floor(Math.random() * randomNode.connected.length)];
                    signals.push(new SignalImpl(randomNode, targetNode));
                }
            }
            
            // Remove inactive signals
            while (signals.length > 0 && !signals[0].active) {
                signals.shift();
            }
            
            // Limit active signals
            if (signals.length > 10) { // Reduced maximum signals
                signals.length = 10;
            }
            
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        // Start animation
        animationFrameRef.current = requestAnimationFrame(animate);

        // Clean up
        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full -z-10 bg-black"
            style={{ 
                display: 'block', 
                pointerEvents: 'none'
            }}
        />
    );
} 