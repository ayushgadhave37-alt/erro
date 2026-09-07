class AmbulanceSelector {
    constructor(mapEngine, routingEngine) {
        this.mapEngine = mapEngine;
        this.routingEngine = routingEngine;
    }

    selectBestAmbulance(incidentNode) {
        let bestAmbulance = null;
        let minScore = Infinity;
        let bestRoute = null;

        this.mapEngine.ambulances.forEach(amb => {
            if (amb.status !== 'AVAILABLE') return;

            const routeData = this.routingEngine.calculateOptimalRoute(amb.node, incidentNode);
            
            if (routeData.path.length > 0) {
                // Response score based heavily on estimated travel time (distance + traffic)
                const score = routeData.time;
                if (score < minScore) {
                    minScore = score;
                    bestAmbulance = amb;
                    bestRoute = routeData;
                }
            }
        });

        return { ambulance: bestAmbulance, route: bestRoute };
    }
}
