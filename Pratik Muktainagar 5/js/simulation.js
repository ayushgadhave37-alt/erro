/* ═══════════════════════════════════════════════════════════
   SIMULATION MANAGER — Orchestrates the full emergency flow
   Accident → Dispatch → En Route → At Scene → Transport → Hospital
   ═══════════════════════════════════════════════════════════ */
class SimulationManager {
    constructor(mapEngine, routingEngine, ambulanceSelector, hospitalSelector) {
        this.map = mapEngine;
        this.router = routingEngine;
        this.ambSelector = ambulanceSelector;
        this.hospSelector = hospitalSelector;

        this.incident = null;
        this.ambulance = null;
        this.hospital = null;
        this.ambRoute = null;
        this.hospRoute = null;
        this.state = 'IDLE'; // IDLE | DETECTED | DISPATCHED | EN_ROUTE | AT_SCENE | TRANSPORTING | FINISHED

        this._etaInterval = null;

        window.addEventListener('traffic-changed', () => this.onTrafficChange());
    }

    /* ── Toast helper ── */
    toast(msg, type = 'info') {
        const c = document.getElementById('toast-container');
        if (!c) return;
        const el = document.createElement('div');
        el.className = 'toast ' + type;
        el.textContent = msg;
        c.appendChild(el);
        setTimeout(() => { el.classList.add('fade-out'); setTimeout(() => el.remove(), 400); }, 3500);
    }

    /* ══════════════════ MAIN FLOW ══════════════════ */

    simulateAccident() {
        if (this.state !== 'IDLE' && this.state !== 'FINISHED') {
            this.toast('⚠ An incident is already active!', 'warning');
            return;
        }

        // 1. Pick random incident
        const pool = MockData.incidents;
        this.incident = { ...pool[Math.floor(Math.random() * pool.length)] };
        this.incident.detectedAt = new Date().toLocaleTimeString('en-US', { hour12: false });
        this.state = 'DETECTED';

        this.map.activeIncident = this.incident;
        this.map.activeRoute = null;
        this.map.altRoutes = [];

        this.toast(`🚨 ACCIDENT DETECTED: ${this.incident.type}`, 'error');
        this.updatePanels();
        this.updateKPI('kpi-incidents', '1');

        // Proceed after dramatic pause
        setTimeout(() => this.findAndDispatch(), 2500);
    }

    findAndDispatch() {
        if (!this.incident) return;
        this.toast('🔍 Scanning available ambulances...', 'info');

        setTimeout(() => {
            // 2. Select best ambulance
            const result = this.ambSelector.selectBestAmbulance(this.incident.node);
            if (!result.ambulance) {
                this.toast('⚠ NO AVAILABLE AMBULANCE — searching secondary zone...', 'error');
                return;
            }

            this.ambulance = result.ambulance;
            this.ambRoute = result.route;
            this.ambulance.status = 'DISPATCHED';
            this.state = 'DISPATCHED';

            // Show route on map
            this.map.activeRoute = this.ambRoute.path;

            this.toast(`🚑 ${this.ambulance.id} dispatched from ${this.map.nodes.find(n => n.id === this.ambulance.node).name}`, 'info');
            this.toast(`🧠 Dijkstra route optimization completed — ${this.ambRoute.distance.toFixed(1)} km`, 'success');

            this.updatePanels();
            this.updateKPI('kpi-ambulances', this.map.ambulances.filter(a => a.status === 'AVAILABLE').length.toString());

            // 3. Start movement after brief pause
            setTimeout(() => {
                this.ambulance.status = 'EN ROUTE';
                this.state = 'EN_ROUTE';
                this.updatePanels();

                // Start ETA countdown
                this.startETATimer();

                // Dispatch on map (this handles currentX/Y init and path)
                this.map.dispatchAmbulance(this.ambulance.id, this.ambRoute.path, () => {
                    this.onReachedAccident();
                });
            }, 1500);
        }, 1500);
    }

    onReachedAccident() {
        this.stopETATimer();
        this.ambulance.status = 'AT SCENE';
        this.state = 'AT_SCENE';
        this.map.activeRoute = null;

        this.toast(`🚑 ${this.ambulance.id} ARRIVED at accident scene`, 'success');
        this.toast('🏥 Selecting optimal hospital for patient transport...', 'info');
        this.updatePanels();

        setTimeout(() => this.selectAndTransport(), 2500);
    }

    selectAndTransport() {
        if (!this.incident) return;

        // 4. Select hospital
        const result = this.hospSelector.selectBestHospital(this.incident.node, this.incident.severity);
        if (!result.hospital) {
            this.toast('⚠ NO SUITABLE HOSPITAL FOUND', 'error');
            return;
        }

        this.hospital = result.hospital;
        this.hospRoute = result.route;

        this.map.activeRoute = this.hospRoute.path;
        this.toast(`🏥 Selected: ${this.hospital.name}`, 'info');
        this.updatePanels();

        setTimeout(() => {
            this.ambulance.status = 'TRANSPORTING';
            this.state = 'TRANSPORTING';
            this.updatePanels();
            this.startETATimer();

            this.map.dispatchAmbulance(this.ambulance.id, this.hospRoute.path, () => {
                this.onReachedHospital();
            });
        }, 2000);
    }

    onReachedHospital() {
        this.stopETATimer();
        this.ambulance.status = 'AVAILABLE';
        this.state = 'FINISHED';
        this.map.activeRoute = null;
        this.map.activeIncident = null;

        this.toast(`✅ Patient delivered to ${this.hospital.name}`, 'success');
        this.toast('✅ Emergency response completed successfully', 'success');

        // Update KPIs
        this.updateKPI('kpi-incidents', '0');
        this.updateKPI('kpi-ambulances', this.map.ambulances.filter(a => a.status === 'AVAILABLE').length.toString());
        const lives = parseInt(document.getElementById('kpi-lives').textContent || '127');
        this.updateKPI('kpi-lives', (lives + this.incident.patients).toString());

        this.updatePanels();
    }

    /* ── ETA Timer ── */
    startETATimer() {
        this.stopETATimer();
        const amb = this.map.ambulances.find(a => a.id === this.ambulance.id);
        if (!amb) return;

        const route = this.state === 'TRANSPORTING' ? this.hospRoute : this.ambRoute;
        if (!route) return;

        let startTime = Date.now();
        let totalTimeSec = route.time * 60; // convert minutes to seconds for display
        // Scale: we speed up for demo, so 1 real second ~ 6 simulated seconds
        const timeScale = 6;

        this._etaInterval = setInterval(() => {
            const elapsed = ((Date.now() - startTime) / 1000) * timeScale;
            const remaining = Math.max(0, totalTimeSec - elapsed);
            const mins = Math.floor(remaining / 60);
            const secs = Math.floor(remaining % 60);
            const etaStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            // Remaining distance estimate
            const progress = amb.progress || 0;
            const distRemaining = (route.distance * (1 - progress)).toFixed(1);

            // Update ambulance HUD data
            amb.etaDisplay = etaStr;
            amb.distDisplay = distRemaining + ' km';

            // Update KPI
            this.updateKPI('kpi-eta', etaStr);
        }, 200);
    }

    stopETATimer() {
        if (this._etaInterval) { clearInterval(this._etaInterval); this._etaInterval = null; }
    }

    /* ── Traffic re-routing ── */
    onTrafficChange() {
        if (!this.ambulance) return;
        const amb = this.map.ambulances.find(a => a.id === this.ambulance.id);
        if (!amb || !amb.isMoving) return;

        this.toast('⚠ Traffic conditions changed — recalculating route...', 'warning');

        const endNode = this.state === 'TRANSPORTING'
            ? this.hospital.node
            : this.incident.node;

        const newRoute = this.router.calculateOptimalRoute(amb.node, endNode);
        if (newRoute && newRoute.path.length > 0) {
            if (this.state === 'TRANSPORTING') {
                this.hospRoute = newRoute;
            } else {
                this.ambRoute = newRoute;
            }

            // Re-dispatch from current position
            this.map.activeRoute = newRoute.path;
            this.map.dispatchAmbulance(this.ambulance.id, newRoute.path, () => {
                if (this.state === 'TRANSPORTING') this.onReachedHospital();
                else this.onReachedAccident();
            });

            this.startETATimer();
            this.toast('🧠 Route recalculated — new optimal path found', 'success');
            this.updatePanels();
        }
    }

    /* ═══════════ PANEL UPDATES ═══════════ */

    updatePanels() {
        this.updateIncidentPanel();
        this.updateRoutePanel();
        this.updateResponsePanel();
        this.updateHospitalPanel();
    }

    updateIncidentPanel() {
        const el = document.getElementById('incident-panel');
        if (!el) return;
        if (!this.incident || this.state === 'IDLE') {
            el.innerHTML = '<h3>INCIDENT INFO</h3><div class="content placeholder">No active incidents.</div>';
            return;
        }
        const loc = this.map.nodes.find(n => n.id === this.incident.node);
        const sevClass = this.incident.severity === 'CRITICAL' ? 'critical'
            : this.incident.severity === 'MEDIUM' ? 'warning' : 'success';
        el.innerHTML = `
            <h3>INCIDENT ${this.incident.id}</h3>
            <div class="data-row"><span class="data-label">Type</span><span class="data-value">${this.incident.type}</span></div>
            <div class="data-row"><span class="data-label">Location</span><span class="data-value">${loc ? loc.name : 'Unknown'}</span></div>
            <div class="data-row"><span class="data-label">Severity</span><span class="data-value ${sevClass}">${this.incident.severity}</span></div>
            <div class="data-row"><span class="data-label">Patients</span><span class="data-value">${this.incident.patients}</span></div>
            <div class="data-row"><span class="data-label">Detected</span><span class="data-value">${this.incident.detectedAt || '--'}</span></div>
            <div class="data-row"><span class="data-label">Status</span><span class="data-value info">${this.state.replace('_', ' ')}</span></div>
            ${this.incident.description ? `<p class="incident-desc">${this.incident.description}</p>` : ''}`;
    }

    updateRoutePanel() {
        const el = document.getElementById('route-panel');
        if (!el) return;
        const route = this.state === 'TRANSPORTING' ? this.hospRoute : this.ambRoute;
        if (!route || !route.path || route.path.length < 2) {
            el.innerHTML = '<h3>ROUTE ANALYSIS</h3><div class="content placeholder">Awaiting route calculation...</div>';
            return;
        }
        const mins = Math.floor(route.time);
        const secs = Math.floor((route.time - mins) * 60);
        const eta = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const trafficLabel = this.map.trafficCondition === 'high' ? 'Heavy' : this.map.trafficCondition === 'normal' ? 'Moderate' : 'Light';
        el.innerHTML = `
            <h3>OPTIMAL ROUTE ✓</h3>
            <div class="data-row"><span class="data-label">Distance</span><span class="data-value">${route.distance.toFixed(1)} km</span></div>
            <div class="data-row"><span class="data-label">Est. Time</span><span class="data-value success">${eta} min</span></div>
            <div class="data-row"><span class="data-label">Traffic</span><span class="data-value ${this.map.trafficCondition === 'high' ? 'critical' : 'info'}">${trafficLabel}</span></div>
            <div class="data-row"><span class="data-label">Waypoints</span><span class="data-value">${route.path.length}</span></div>
            <div class="data-row"><span class="data-label">Algorithm</span><span class="data-value info">Dijkstra (JS)</span></div>`;
    }

    updateResponsePanel() {
        const el = document.getElementById('response-panel');
        if (!el) return;
        if (!this.ambulance) {
            el.innerHTML = '<h3>RESPONSE UNIT</h3><div class="content placeholder">Awaiting dispatch...</div>';
            return;
        }
        const route = this.ambRoute;
        let eta = '--:--';
        if (route) { const m = Math.floor(route.time); const s = Math.floor((route.time - m) * 60); eta = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; }

        el.innerHTML = `
            <h3>RESPONSE UNIT</h3>
            <div class="data-row"><span class="data-label">Unit</span><span class="data-value">${this.ambulance.id}</span></div>
            <div class="data-row"><span class="data-label">Affiliation</span><span class="data-value">${this.ambulance.affiliation || '--'}</span></div>
            <div class="data-row"><span class="data-label">Status</span><span class="data-value info">${this.ambulance.status}</span></div>
            <div class="data-row"><span class="data-label">Init. ETA</span><span class="data-value success">${eta} min</span></div>
            <div class="data-row"><span class="data-label">Distance</span><span class="data-value">${route ? route.distance.toFixed(1) : '--'} km</span></div>`;
    }

    updateHospitalPanel() {
        const el = document.getElementById('hospital-panel');
        if (!el) return;
        if (!this.hospital) {
            el.innerHTML = '<h3>DESTINATION HOSPITAL</h3><div class="content placeholder">Awaiting triage...</div>';
            return;
        }
        const route = this.hospRoute;
        let eta = '--:--';
        if (route) { const m = Math.floor(route.time); const s = Math.floor((route.time - m) * 60); eta = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; }

        el.innerHTML = `
            <h3>DESTINATION HOSPITAL</h3>
            <div class="data-row"><span class="data-label">Name</span><span class="data-value">${this.hospital.name}</span></div>
            <div class="data-row"><span class="data-label">Trauma</span><span class="data-value ${this.hospital.trauma ? 'success' : 'critical'}">${this.hospital.trauma ? 'AVAILABLE' : 'N/A'}</span></div>
            <div class="data-row"><span class="data-label">ICU</span><span class="data-value ${this.hospital.icu ? 'success' : 'critical'}">${this.hospital.icu ? 'AVAILABLE' : 'N/A'}</span></div>
            <div class="data-row"><span class="data-label">Capacity</span><span class="data-value">${this.hospital.capacity || '--'}%</span></div>
            <div class="data-row"><span class="data-label">ETA</span><span class="data-value success">${eta} min</span></div>`;
    }

    /* ═══════════ RESET ═══════════ */
    reset() {
        this.stopETATimer();
        this.incident = null;
        this.ambulance = null;
        this.hospital = null;
        this.ambRoute = null;
        this.hospRoute = null;
        this.state = 'IDLE';
        this.map.activeIncident = null;
        this.map.activeRoute = null;
        this.map.trails = {};

        // Reset all ambulances
        this.map.ambulances.forEach((a, i) => {
            const orig = MockData.ambulances[i];
            a.node = orig.node;
            a.status = 'AVAILABLE';
            a.isMoving = false;
            a.currentX = undefined;
            a.currentY = undefined;
            a.routePath = null;
            a.etaDisplay = undefined;
            a.distDisplay = undefined;
            a.progress = undefined;
        });

        this.updateKPI('kpi-incidents', '0');
        this.updateKPI('kpi-ambulances', '8');
        this.updateKPI('kpi-eta', '06:42');
        this.updatePanels();
        this.toast('↺ Simulation reset', 'info');
    }

    updateKPI(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }
}
