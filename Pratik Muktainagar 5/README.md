# ERRO - Emergency Response Route Optimizer

**Intelligent Emergency Routing & Response Management System**

## Project Overview
ERRO is a real-time emergency command center simulation designed for a hackathon demonstrating **TS-1: Enhancing emergency response mechanisms for accidents on highways around metro cities**. The system simulates detecting an accident, identifying the nearest available emergency vehicles, calculating the fastest route using dynamic traffic weights, and dispatching the vehicle to the optimal hospital.

This prototype features a custom map engine based on the city of **Jalgaon, Maharashtra**.

## Features
- **Accident Simulation**: Randomly generates incidents with varying severity (LOW, MEDIUM, CRITICAL).
- **Intelligent Dispatch**: Selects ambulances based on ETA and availability, rather than just geographical proximity.
- **Dynamic Routing**: Calculates the fastest route considering base distances, road condition, and real-time traffic updates.
- **Hospital Triage**: Prioritizes trauma units and ICU availability for critical accidents.
- **Interactive UI**: A futuristic, dark-themed operations center layout built without external UI frameworks.
- **Live Demo Mode**: Fully automated end-to-end presentation mode for hackathon demonstrations.
- **Command Center Mode**: Enlarges the map for projector viewing.
- **Analytics Dashboard**: Tracks response time trends, severity breakdowns, and overall efficiency.

## Technology Stack
- **Frontend**: HTML5, CSS3 (Custom Glassmorphism design), Vanilla JavaScript.
- **Graphics Engine**: HTML Canvas for the interactive graph map (Offline-first, no Google Maps API).
- **Core Algorithms**: C implementation of Dijkstra's Shortest Path algorithm (Targeted for WebAssembly compilation).
- **Data**: Static JSON-like mock objects for full offline support.

## System Architecture
The application runs entirely in the browser and maintains state through a series of decoupled managers:
1. **MapEngine (`map.js`)**: Handles Canvas rendering, coordinate scaling, and vehicle animation.
2. **RoutingEngine (`wasm-loader.js`)**: Wraps the routing algorithms. Includes a JavaScript fallback implementation of Dijkstra if WASM fails to load.
3. **SimulationManager (`simulation.js`)**: Orchestrates the main flow (Accident -> Dispatch -> En Route -> Hospital -> Finish).
4. **TrafficController (`traffic.js`)**: Modifies graph edge weights and triggers global re-routing events.

## C Algorithm Explanation
The core routing algorithm is implemented in C (`c/dijkstra.c`). 
### Graph Representation
The graph is represented using an adjacency list where each node has a fixed array of outward edges.
### Dijkstra Implementation
The algorithm uses a standard greedy approach:
1. Initialize distances to all nodes as Infinity (`INF`), except the start node which is 0.
2. Iteratively pick the unvisited node with the smallest distance.
3. Update the distances of its neighbors if a shorter path is found.
4. Keep track of the `prev` array to reconstruct the optimal path backward.

## WebAssembly Integration
The C code is designed to be compiled via Emscripten using a command like:
```bash
emcc c/dijkstra.c -s WASM=1 -s EXPORTED_FUNCTIONS="['_c_calculate_route']" -o wasm/routing.js
```
*Note: Due to hackathon environment constraints and to ensure 100% offline reliability without requiring a local development server, the application currently gracefully falls back to a pure-JavaScript implementation of Dijkstra's algorithm inside `wasm-loader.js`.*

## Installation & How to Run
1. Clone or download the repository.
2. Ensure you have a modern web browser.
3. Because the mock data is embedded as JS objects, **you do not need a local server**. Simply double-click `index.html` to open the application.
4. Click **ENTER COMMAND CENTER**.

## Demo Instructions (For Hackathon Judges)
1. **Start Live Demo**: Click the "▶ START LIVE DEMO" button. This will automatically simulate an accident, dispatch an ambulance, simulate a traffic jam (which forces a route recalculation), and complete the transport to a hospital.
2. **Manual Simulation**: Use the "🚨 SIMULATE ACCIDENT" button to run a manual scenario.
3. **Command Center Mode**: Click "🎬 COMMAND CENTER MODE" to hide sidebars and show a large map suitable for a projector display.
4. **Traffic Simulation**: While an ambulance is moving, toggle the Traffic Controls (LOW, NORM, HIGH) to watch the route glow change dynamically.

## Future Scope
- Integration with live GPS APIs for actual ambulance tracking.
- Integration with smart city traffic light APIs for automated priority routing.
- Real-time hospital bed capacity sensors using IoT.

---
*Built for the Hackathon*
