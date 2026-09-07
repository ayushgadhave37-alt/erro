class HospitalSelector {
    constructor(mapEngine, routingEngine) {
        this.mapEngine = mapEngine;
        this.routingEngine = routingEngine;
    }

    selectBestHospital(incidentNode, severity) {
        let bestHospital = null;
        let minScore = Infinity;
        let bestRoute = null;

        // First pass: prefer hospitals with trauma AND icu for CRITICAL
        this.mapEngine.hospitals.forEach(hosp => {
            if (severity === 'CRITICAL' && !hosp.trauma) return;

            const routeData = this.routingEngine.calculateOptimalRoute(incidentNode, hosp.node);
            if (routeData.path.length > 0) {
                // Score: time is primary, bonus for having both trauma+icu
                let score = routeData.time;
                if (hosp.trauma && hosp.icu) score *= 0.8; // prefer fully equipped
                if (score < minScore) {
                    minScore = score;
                    bestHospital = hosp;
                    bestRoute = routeData;
                }
            }
        });

        // Fallback: if no hospital found (e.g. all filtered), try any hospital
        if (!bestHospital) {
            this.mapEngine.hospitals.forEach(hosp => {
                const routeData = this.routingEngine.calculateOptimalRoute(incidentNode, hosp.node);
                if (routeData.path.length > 0 && routeData.time < minScore) {
                    minScore = routeData.time;
                    bestHospital = hosp;
                    bestRoute = routeData;
                }
            });
        }

        return { hospital: bestHospital, route: bestRoute };
    }
}
