class RoutingEngine {
    constructor(mapEngine) {
        this.mapEngine = mapEngine;
        this.useWasm = false; // Set to true if WASM is successfully loaded
        this.wasmModule = null;
    }

    async init() {
        try {
            // Attempt to load WASM module (if compiled)
            // For hackathon offline-first, we rely gracefully on JS fallback if fetch fails
            const response = await fetch('wasm/routing.wasm');
            if (response.ok) {
                // Mock loading for structure. In real emscripten it would be a generated JS wrapper.
                // this.wasmModule = await WebAssembly.instantiateStreaming(response, {});
                // this.useWasm = true;
                console.log("WASM module loaded successfully. (Mock)");
                this.useWasm = false; // Forcing JS fallback for this prototype as we don't have compiled wasm
            }
        } catch (e) {
            console.warn("WASM module not found or CORS blocked. Falling back to JavaScript routing engine.");
            this.useWasm = false;
        }
    }

    // Returns { path: [nodeIds], distance: total, time: totalTime }
    calculateOptimalRoute(startNodeId, endNodeId) {
        if (this.useWasm) {
            return this.calculateWasm(startNodeId, endNodeId);
        } else {
            return this.calculateJS(startNodeId, endNodeId);
        }
    }

    calculateWasm(startNodeId, endNodeId) {
        // Placeholder for actual WASM call
        return this.calculateJS(startNodeId, endNodeId);
    }

    // Pure JS fallback implementation of Dijkstra
    calculateJS(startNodeId, endNodeId) {
        const nodes = this.mapEngine.nodes;
        const dist = {};
        const prev = {};
        const unvisited = new Set();

        nodes.forEach(n => {
            dist[n.id] = Infinity;
            prev[n.id] = null;
            unvisited.add(n.id);
        });

        dist[startNodeId] = 0;

        while (unvisited.size > 0) {
            // Find node with min dist
            let minNode = null;
            let minDist = Infinity;
            
            unvisited.forEach(nodeId => {
                if (dist[nodeId] < minDist) {
                    minDist = dist[nodeId];
                    minNode = nodeId;
                }
            });

            if (minNode === null || minNode === endNodeId) {
                break;
            }

            unvisited.delete(minNode);

            // Update neighbors
            this.mapEngine.edges.forEach((edge) => {
                let neighbor = null;
                if (edge.source === minNode) neighbor = edge.target;
                if (edge.target === minNode) neighbor = edge.source;
                
                if (neighbor !== null && unvisited.has(neighbor)) {
                    const weight = this.mapEngine.getEdgeWeight(edge.source, edge.target);
                    const alt = dist[minNode] + weight;
                    if (alt < dist[neighbor]) {
                        dist[neighbor] = alt;
                        prev[neighbor] = minNode;
                    }
                }
            });
        }

        // Reconstruct path
        const path = [];
        let curr = endNodeId;
        if (prev[curr] !== null || curr === startNodeId) {
            while (curr !== null) {
                path.unshift(curr);
                curr = prev[curr];
            }
        }

        // Calculate total distance for UI (weight is time, but we also want distance)
        let totalDist = 0;
        let totalTime = dist[endNodeId] === Infinity ? 0 : dist[endNodeId];
        
        for (let i = 0; i < path.length - 1; i++) {
            const e = this.mapEngine.edges.find(edge => 
                (edge.source === path[i] && edge.target === path[i+1]) || 
                (edge.target === path[i] && edge.source === path[i+1])
            );
            if (e) totalDist += e.distance;
        }

        return {
            path: path,
            distance: totalDist,
            time: totalTime
        };
    }
}
