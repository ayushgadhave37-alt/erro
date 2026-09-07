/* ═══════════════════════════════════════════════
   APP.JS — Main entry point, wires everything together
   ═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

    /* ── Landing Screen ── */
    const enterBtn = document.getElementById('enter-btn');
    const landingScreen = document.getElementById('landing-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');

    // Animated landing background
    const lc = document.getElementById('landing-canvas');
    if (lc) {
        const lctx = lc.getContext('2d');
        lc.width = window.innerWidth;
        lc.height = window.innerHeight;
        const dots = Array.from({ length: 60 }, () => ({
            x: Math.random() * lc.width, y: Math.random() * lc.height,
            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5
        }));
        function drawLanding() {
            lctx.clearRect(0, 0, lc.width, lc.height);
            dots.forEach(d => {
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > lc.width) d.vx *= -1;
                if (d.y < 0 || d.y > lc.height) d.vy *= -1;
                lctx.beginPath(); lctx.arc(d.x, d.y, 2, 0, Math.PI * 2);
                lctx.fillStyle = '#334155'; lctx.fill();
            });
            // Draw connections
            for (let i = 0; i < dots.length; i++) {
                for (let j = i + 1; j < dots.length; j++) {
                    const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        lctx.strokeStyle = `rgba(59,130,246,${0.15 * (1 - dist / 150)})`;
                        lctx.lineWidth = 1;
                        lctx.beginPath(); lctx.moveTo(dots[i].x, dots[i].y); lctx.lineTo(dots[j].x, dots[j].y); lctx.stroke();
                    }
                }
            }
            if (!landingScreen.classList.contains('hidden')) requestAnimationFrame(drawLanding);
        }
        drawLanding();
    }

    enterBtn.addEventListener('click', () => {
        landingScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        // Trigger map resize after transition
        setTimeout(() => mapEngine.resize(), 600);
    });

    /* ── Initialize Core Systems ── */
    const mapEngine = new MapEngine('city-map');
    const routingEngine = new RoutingEngine(mapEngine);
    await routingEngine.init();
    const ambulanceSelector = new AmbulanceSelector(mapEngine, routingEngine);
    const hospitalSelector = new HospitalSelector(mapEngine, routingEngine);
    const sim = new SimulationManager(mapEngine, routingEngine, ambulanceSelector, hospitalSelector);
    const traffic = new TrafficController(mapEngine);

    /* ── Sidebar navigation ── */
    const navItems = document.querySelectorAll('.nav-item');
    const mapWrapper = document.getElementById('map-wrapper');
    const overlays = {
        dashboard: null,  // shows the map
        incidents: document.getElementById('view-incidents'),
        ambulances: document.getElementById('view-ambulances'),
        hospitals: document.getElementById('view-hospitals'),
        analytics: document.getElementById('view-analytics')
    };

    function switchView(view) {
        navItems.forEach(n => n.classList.toggle('active', n.dataset.view === view));
        // Hide all overlays
        Object.values(overlays).forEach(el => { if (el) el.classList.add('hidden'); });
        if (view === 'dashboard') {
            mapWrapper.style.display = '';
        } else {
            mapWrapper.style.display = 'none';
            if (overlays[view]) {
                overlays[view].classList.remove('hidden');
                if (view === 'incidents') populateIncidents();
                if (view === 'ambulances') populateAmbulances();
                if (view === 'hospitals') populateHospitals();
                if (view === 'analytics') drawAllCharts();
            }
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
        item.addEventListener('keydown', e => { if (e.key === 'Enter') switchView(item.dataset.view); });
    });

    /* ── Populate overlay pages ── */
    function populateIncidents() {
        const grid = document.getElementById('incidents-grid');
        if (!grid) return;
        grid.innerHTML = MockData.incidents.map(inc => {
            const loc = MockData.nodes.find(n => n.id === inc.node);
            const sevClass = inc.severity === 'CRITICAL' ? 'critical' : inc.severity === 'MEDIUM' ? 'warning' : 'success';
            return `<div class="info-card">
                <div class="card-header"><span class="card-id">${inc.id}</span><span class="badge ${sevClass}">${inc.severity}</span></div>
                <div class="card-title">${inc.type}</div>
                <div class="card-detail">📍 ${loc ? loc.name : 'Unknown'}</div>
                <div class="card-detail">👥 ${inc.patients} patient(s)</div>
                ${inc.description ? `<div class="card-desc">${inc.description}</div>` : ''}
            </div>`;
        }).join('');
    }

    function populateAmbulances() {
        const grid = document.getElementById('ambulances-grid');
        if (!grid) return;
        grid.innerHTML = mapEngine.ambulances.map(amb => {
            const loc = MockData.nodes.find(n => n.id === amb.node);
            const statusClass = amb.status === 'AVAILABLE' ? 'success' : 'info';
            return `<div class="info-card">
                <div class="card-header"><span class="card-id">${amb.id}</span><span class="badge ${statusClass}">${amb.status}</span></div>
                <div class="card-detail">📍 ${loc ? loc.name : 'Unknown'}</div>
                <div class="card-detail">🏥 ${amb.affiliation || '--'}</div>
                <div class="card-detail">👥 Capacity: ${amb.capacity || '--'}</div>
                <div class="card-detail">🚗 Speed: ${amb.speed || '--'} km/h</div>
            </div>`;
        }).join('');
    }

    function populateHospitals() {
        const grid = document.getElementById('hospitals-grid');
        if (!grid) return;
        grid.innerHTML = MockData.hospitals.map(h => {
            const loc = MockData.nodes.find(n => n.id === h.node);
            return `<div class="info-card">
                <div class="card-header"><span class="card-id">${h.id}</span></div>
                <div class="card-title">${h.name}</div>
                <div class="card-detail">📍 ${loc ? loc.name : 'Unknown'}</div>
                <div class="card-detail">🛏️ Beds: ${h.beds || '--'} &bull; Capacity: ${h.capacity || '--'}%</div>
                <div class="card-detail">Trauma: <span class="${h.trauma ? 'text-green' : 'text-red'}">${h.trauma ? '✔ YES' : '✘ NO'}</span></div>
                <div class="card-detail">ICU: <span class="${h.icu ? 'text-green' : 'text-red'}">${h.icu ? '✔ YES' : '✘ NO'}</span></div>
            </div>`;
        }).join('');
    }

    /* ── Analytics Charts ── */
    function drawAllCharts() { drawResponseChart(); drawSeverityChart(); drawUtilChart(); }

    function drawResponseChart() {
        const canvas = document.getElementById('chart-response'); if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const p = canvas.parentElement; canvas.width = p.clientWidth; canvas.height = p.clientHeight;
        const W = canvas.width, H = canvas.height;
        const data = [8.2, 7.5, 6.8, 6.2, 5.5, 5.0, 4.8];
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const pad = 40;

        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad + (H - pad * 2) * (i / 4);
            ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 10, y); ctx.stroke();
            ctx.fillStyle = '#64748b'; ctx.font = '10px Inter';
            ctx.fillText((10 - i * 2.5).toFixed(0) + 'm', 5, y + 4);
        }
        labels.forEach((l, i) => {
            const x = pad + (W - pad - 10) * (i / (labels.length - 1));
            ctx.fillStyle = '#64748b'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
            ctx.fillText(l, x, H - 5); ctx.textAlign = 'left';
        });

        ctx.beginPath();
        data.forEach((v, i) => {
            const x = pad + (W - pad - 10) * (i / (data.length - 1));
            const y = pad + (H - pad * 2) * (1 - v / 10);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; ctx.stroke();

        // Fill area
        const lastX = pad + (W - pad - 10);
        ctx.lineTo(lastX, H - pad); ctx.lineTo(pad, H - pad); ctx.closePath();
        ctx.fillStyle = 'rgba(59,130,246,0.15)'; ctx.fill();

        // Dots
        data.forEach((v, i) => {
            const x = pad + (W - pad - 10) * (i / (data.length - 1));
            const y = pad + (H - pad * 2) * (1 - v / 10);
            ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = '#3b82f6'; ctx.fill();
        });
    }

    function drawSeverityChart() {
        const canvas = document.getElementById('chart-severity'); if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const p = canvas.parentElement; canvas.width = p.clientWidth; canvas.height = p.clientHeight;
        const cx = canvas.width / 2, cy = canvas.height / 2, r = Math.min(canvas.width, canvas.height) * 0.38;
        const slices = [
            { val: 35, color: '#10b981', label: 'Low' },
            { val: 40, color: '#f59e0b', label: 'Medium' },
            { val: 25, color: '#ef4444', label: 'Critical' }
        ];
        const total = slices.reduce((a, b) => a + b.val, 0);
        let angle = -Math.PI / 2;
        slices.forEach(s => {
            const slice = (s.val / total) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + slice); ctx.fillStyle = s.color; ctx.fill();
            // label
            const mid = angle + slice / 2;
            const lx = cx + Math.cos(mid) * (r + 20); const ly = cy + Math.sin(mid) * (r + 20);
            ctx.fillStyle = '#cbd5e1'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
            ctx.fillText(`${s.label} ${s.val}%`, lx, ly); ctx.textAlign = 'left';
            angle += slice;
        });
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2); ctx.fillStyle = '#1e293b'; ctx.fill();
        ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 16px Inter'; ctx.textAlign = 'center';
        ctx.fillText('100', cx, cy + 6); ctx.textAlign = 'left';
    }

    function drawUtilChart() {
        const canvas = document.getElementById('chart-utilization'); if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const p = canvas.parentElement; canvas.width = p.clientWidth; canvas.height = p.clientHeight;
        const W = canvas.width, H = canvas.height;
        const data = [65, 72, 85, 45, 90, 55, 30, 78];
        const ids = MockData.ambulances.map(a => a.id.replace('AMB-', ''));
        const pad = 30;
        const barW = (W - pad * 2) / data.length * 0.6;
        const gap = (W - pad * 2) / data.length * 0.4;

        data.forEach((v, i) => {
            const x = pad + i * (barW + gap);
            const h = (v / 100) * (H - pad * 2);
            const y = H - pad - h;
            ctx.fillStyle = v > 80 ? '#ef4444' : v > 60 ? '#f59e0b' : '#3b82f6';
            ctx.beginPath(); ctx.roundRect(x, y, barW, h, [3, 3, 0, 0]); ctx.fill();
            ctx.fillStyle = '#94a3b8'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
            ctx.fillText(ids[i] || '', x + barW / 2, H - 10);
            ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 10px Inter';
            ctx.fillText(v + '%', x + barW / 2, y - 6);
            ctx.textAlign = 'left';
        });
    }

    /* ── Button Bindings ── */
    document.getElementById('simulate-btn').addEventListener('click', () => {
        switchView('dashboard');
        sim.simulateAccident();
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        sim.reset();
        switchView('dashboard');
    });

    // Demo mode
    let demoActive = false;
    const demoBtn = document.getElementById('demo-btn');
    demoBtn.addEventListener('click', function () {
        if (demoActive) {
            this.textContent = '▶ START LIVE DEMO';
            this.classList.remove('danger-btn'); this.classList.add('action-btn');
            demoActive = false;
            sim.reset();
        } else {
            this.textContent = '⏹ STOP DEMO';
            this.classList.remove('action-btn'); this.classList.add('danger-btn');
            demoActive = true;
            switchView('dashboard');
            sim.reset();
            setTimeout(() => { if (demoActive) sim.simulateAccident(); }, 1200);
            setTimeout(() => {
                if (demoActive) document.querySelector('.traffic-btn[data-level="high"]').click();
            }, 10000);
        }
    });

    // Command Center Mode
    document.getElementById('command-btn').addEventListener('click', () => {
        document.body.classList.toggle('command-mode');
        setTimeout(() => mapEngine.resize(), 100);
    });

    // System clock
    setInterval(() => {
        document.getElementById('system-clock').textContent =
            new Date().toLocaleTimeString('en-US', { hour12: false });
    }, 1000);
});
