/* ═══════════════════════════════════════════════════════════
   MAP ENGINE — Renders Jalgaon city graph on HTML Canvas
   with live ambulance tracking, route glow, and incident pulses
   ═══════════════════════════════════════════════════════════ */

// Polyfill for Canvas roundRect (for older browsers)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        const r = Array.isArray(radii) ? radii[0] || 0 : radii || 0;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y); this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r); this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h); this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r); this.quadraticCurveTo(x, y, x + r, y);
    };
}

class MapEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        // Deep-copy data so we can mutate ambulance positions
        this.nodes = JSON.parse(JSON.stringify(MockData.nodes));
        this.edges = JSON.parse(JSON.stringify(MockData.edges));
        this.ambulances = JSON.parse(JSON.stringify(MockData.ambulances));
        this.hospitals = JSON.parse(JSON.stringify(MockData.hospitals));

        this.activeIncident = null;
        this.activeRoute = null;       // Array of node IDs for the glowing route
        this.altRoutes = [];           // Additional routes to show faintly
        this.trafficMultiplier = 1.0;
        this.trafficCondition = 'low';
        this.edgeTraffic = {};

        // Trail history for moving ambulances
        this.trails = {};  // ambId -> [{x,y}, ...]

        // Initialize edge traffic
        this.edges.forEach((_, i) => { this.edgeTraffic[i] = 1.0; });

        // Resize & start animation
        this._resizeBound = () => this.resize();
        window.addEventListener('resize', this._resizeBound);
        this.resize();
        this._raf = null;
        this.startAnimation();
    }

    resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = Math.max(rect.height, 400);
        this.scaleX = this.canvas.width / 1000;
        this.scaleY = this.canvas.height / 900;
    }

    /* ── Traffic ── */
    setTrafficLevel(level) {
        this.trafficCondition = level;
        const base = level === 'low' ? 1.0 : level === 'normal' ? 1.5 : 2.5;
        this.trafficMultiplier = base;
        this.edges.forEach((_, i) => {
            this.edgeTraffic[i] = base * (0.8 + Math.random() * 0.4);
        });
    }

    getEdgeWeight(src, tgt) {
        const idx = this.edges.findIndex(e =>
            (e.source === src && e.target === tgt) ||
            (e.source === tgt && e.target === src));
        if (idx === -1) return Infinity;
        return this.edges[idx].time * (this.edgeTraffic[idx] || 1.0);
    }

    /* ── Coordinate helpers ── */
    getCoords(nodeId) {
        const n = this.nodes.find(nd => nd.id === nodeId);
        if (!n) return { x: 0, y: 0 };
        return {
            x: n.x * this.scaleX * 0.85 + this.canvas.width * 0.07,
            y: n.y * this.scaleY * 0.85 + this.canvas.height * 0.05
        };
    }

    /* ═══════════════ DRAWING ═══════════════ */
    draw() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Subtle grid
        ctx.strokeStyle = 'rgba(51,65,85,0.12)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        this.drawRoads(ctx);
        this.drawTrails(ctx);
        this.drawNodes(ctx);
        this.drawHospitals(ctx);
        this.drawSpecialNodes(ctx);
        this.drawIncident(ctx);
        this.drawAmbulances(ctx);
        this.drawMovingAmbulanceHUD(ctx);
    }

    drawRoads(ctx) {
        this.edges.forEach((edge, i) => {
            const a = this.getCoords(edge.source);
            const b = this.getCoords(edge.target);
            const tf = this.edgeTraffic[i] || 1.0;

            // Determine if this edge is on the active route
            let onRoute = false;
            if (this.activeRoute && this.activeRoute.length > 1) {
                for (let k = 0; k < this.activeRoute.length - 1; k++) {
                    const p = this.activeRoute[k], q = this.activeRoute[k + 1];
                    if ((p === edge.source && q === edge.target) || (p === edge.target && q === edge.source)) {
                        onRoute = true; break;
                    }
                }
            }

            ctx.save();
            if (onRoute) {
                // Glowing route
                ctx.shadowBlur = 18;
                ctx.shadowColor = '#3b82f6';
                ctx.strokeStyle = '#60a5fa';
                ctx.lineWidth = 7;
            } else {
                ctx.shadowBlur = 0;
                // Road color by type and traffic
                if (edge.roadType === 'highway') {
                    ctx.strokeStyle = tf > 2.0 ? '#7f1d1d' : tf > 1.3 ? '#92400e' : '#475569';
                    ctx.lineWidth = 5;
                } else if (edge.roadType === 'main') {
                    ctx.strokeStyle = tf > 2.0 ? '#991b1b' : tf > 1.3 ? '#a16207' : '#334155';
                    ctx.lineWidth = 3.5;
                } else {
                    ctx.strokeStyle = tf > 2.0 ? '#7f1d1d44' : '#1e293b';
                    ctx.lineWidth = 2;
                }
            }
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.restore();
        });
    }

    drawTrails(ctx) {
        Object.values(this.trails).forEach(trail => {
            if (trail.length < 2) return;
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let i = 1; i < trail.length; i++) {
                const alpha = (i / trail.length) * 0.6;
                ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
                ctx.lineTo(trail[i].x, trail[i].y);
                ctx.stroke();
            }
            ctx.restore();
        });
    }

    drawNodes(ctx) {
        this.nodes.forEach(node => {
            if (node.type === 'hospital' || node.type === 'police' || node.type === 'fire') return;
            const { x, y } = this.getCoords(node.id);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#475569';
            ctx.fill();
            // label
            ctx.fillStyle = '#64748b';
            ctx.font = '9px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(node.name, x + 8, y + 3);
        });
    }

    drawHospitals(ctx) {
        this.hospitals.forEach(h => {
            const { x, y } = this.getCoords(h.node);
            // White square with red cross
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x - 10, y - 10, 20, 20, 3);
            ctx.fill();
            ctx.stroke();
            // Cross
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.stroke();
            // Label
            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(h.name.split(',')[0], x, y - 14);
            ctx.textAlign = 'left';
        });
    }

    drawSpecialNodes(ctx) {
        this.nodes.forEach(node => {
            const { x, y } = this.getCoords(node.id);
            if (node.type === 'police') {
                ctx.fillStyle = '#3b82f6';
                ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#93c5fd';
                ctx.font = '8px Inter'; ctx.fillText('🚔', x - 6, y - 8);
            } else if (node.type === 'fire') {
                ctx.fillStyle = '#f97316';
                ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fdba74';
                ctx.font = '8px Inter'; ctx.fillText('🚒', x - 6, y - 8);
            }
        });
    }

    drawIncident(ctx) {
        if (!this.activeIncident) return;
        const { x, y } = this.getCoords(this.activeIncident.node);
        const t = Date.now();
        const pulse = (Math.sin(t / 150) + 1) / 2;
        const color = this.activeIncident.severity === 'CRITICAL' ? '#ef4444'
            : this.activeIncident.severity === 'MEDIUM' ? '#f59e0b' : '#10b981';

        // Outer pulse ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 14 + pulse * 16, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.fill();

        // Second ring
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(x, y, 20 + pulse * 24, 0, Math.PI * 2);
        ctx.fill();

        // Core marker
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Exclamation
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', x, y + 5);
        ctx.textAlign = 'left';
        ctx.restore();
    }

    drawAmbulances(ctx) {
        const t = Date.now();
        this.ambulances.forEach(amb => {
            let x, y;
            if (amb.currentX !== undefined && amb.currentY !== undefined) {
                x = amb.currentX;
                y = amb.currentY;
            } else {
                const c = this.getCoords(amb.node);
                x = c.x; y = c.y;
            }

            const isActive = amb.status === 'EN ROUTE' || amb.status === 'TRANSPORTING' || amb.status === 'DISPATCHED';

            ctx.save();
            if (isActive) {
                // Flashing red/blue siren
                const flash = Math.floor(t / 250) % 2 === 0;
                const col = flash ? '#ef4444' : '#3b82f6';
                ctx.shadowBlur = 20;
                ctx.shadowColor = col;
                ctx.fillStyle = col;
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, Math.PI * 2);
                ctx.fill();

                // White ambulance cross
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.stroke();

                // ID label above
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px Share Tech Mono, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(amb.id, x, y - 16);
                ctx.fillStyle = '#94a3b8';
                ctx.font = '9px Inter, sans-serif';
                ctx.fillText(amb.status, x, y - 26);
                ctx.textAlign = 'left';
            } else {
                // Idle ambulance — small green dot
                ctx.fillStyle = '#10b981';
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
                // tiny cross
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(x, y - 2.5); ctx.lineTo(x, y + 2.5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x - 2.5, y); ctx.lineTo(x + 2.5, y); ctx.stroke();
            }
            ctx.restore();
        });
    }

    /* ── HUD overlay on the moving ambulance ── */
    drawMovingAmbulanceHUD(ctx) {
        this.ambulances.forEach(amb => {
            if (!amb.isMoving || amb.currentX === undefined) return;
            const x = amb.currentX;
            const y = amb.currentY;

            // ETA / distance box
            ctx.save();
            const boxW = 120, boxH = 38;
            const bx = x + 18, by = y - 45;
            ctx.fillStyle = 'rgba(15,23,42,0.88)';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(bx, by, boxW, boxH, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '9px Inter, sans-serif';
            ctx.fillText('ETA', bx + 6, by + 14);
            ctx.fillText('Dist', bx + 6, by + 30);

            const eta = amb.etaDisplay || '--:--';
            const dist = amb.distDisplay || '--';
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 11px Share Tech Mono, monospace';
            ctx.fillText(eta, bx + 40, by + 14);
            ctx.fillStyle = '#60a5fa';
            ctx.fillText(dist, bx + 40, by + 30);

            // Progress bar
            if (amb.progress !== undefined) {
                const barY = by + boxH + 3;
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(bx, barY, boxW, 4);
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(bx, barY, boxW * amb.progress, 4);
            }
            ctx.restore();
        });
    }

    /* ═══════════════ ANIMATION LOOP ═══════════════ */
    startAnimation() {
        const loop = () => {
            this.updateAmbulancePositions();
            this.draw();
            this._raf = requestAnimationFrame(loop);
        };
        loop();
    }

    updateAmbulancePositions() {
        this.ambulances.forEach(amb => {
            if (!amb.isMoving || !amb.routePath || amb.routePath.length === 0) return;

            // Initialize trail
            if (!this.trails[amb.id]) this.trails[amb.id] = [];

            const targetNodeId = amb.routePath[0];
            const target = this.getCoords(targetNodeId);
            const dx = target.x - amb.currentX;
            const dy = target.y - amb.currentY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const speed = 2.5; // px per frame

            if (dist < speed) {
                amb.currentX = target.x;
                amb.currentY = target.y;
                amb.node = targetNodeId;
                amb.routePath.shift();
                amb.nodesVisited = (amb.nodesVisited || 0) + 1;

                // Record trail point
                this.trails[amb.id].push({ x: amb.currentX, y: amb.currentY });
                if (this.trails[amb.id].length > 200) this.trails[amb.id].shift();

                if (amb.routePath.length === 0) {
                    amb.isMoving = false;
                    if (amb.onArrival) amb.onArrival();
                }
            } else {
                amb.currentX += (dx / dist) * speed;
                amb.currentY += (dy / dist) * speed;

                // Trail sampling (every few frames)
                const trail = this.trails[amb.id];
                const last = trail[trail.length - 1];
                if (!last || Math.abs(amb.currentX - last.x) > 4 || Math.abs(amb.currentY - last.y) > 4) {
                    trail.push({ x: amb.currentX, y: amb.currentY });
                    if (trail.length > 200) trail.shift();
                }
            }

            // Update progress
            if (amb.totalNodes > 0) {
                amb.progress = (amb.nodesVisited || 0) / amb.totalNodes;
            }
        });
    }

    /* ── Dispatch an ambulance along a route ── */
    dispatchAmbulance(ambId, routePath, onArrival) {
        const amb = this.ambulances.find(a => a.id === ambId);
        if (!amb) return;

        // Set initial pixel position from current node
        const startCoords = this.getCoords(amb.node);
        amb.currentX = startCoords.x;
        amb.currentY = startCoords.y;

        // Skip the first node in the route (that's where we already are)
        const movePath = routePath[0] === amb.node ? routePath.slice(1) : [...routePath];
        amb.routePath = movePath;
        amb.totalNodes = movePath.length;
        amb.nodesVisited = 0;
        amb.progress = 0;
        amb.isMoving = true;
        amb.onArrival = onArrival;

        // Clear old trail
        this.trails[ambId] = [{ x: amb.currentX, y: amb.currentY }];
    }
}
