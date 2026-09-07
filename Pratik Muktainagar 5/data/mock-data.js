/*
 * ERRO — Jalgaon City Graph Data
 * Real locations from Jalgaon, Maharashtra mapped onto a 1000x1000 coordinate grid.
 * Coordinates approximate the relative geographic positions of these landmarks.
 */
const MockData = {
    nodes: [
        // --- National Highway / Bypass belt (top of city) ---
        { id: 0,  name: "NH-6 Bypass West (Paldhi Naka)",       x: 60,   y: 120,  type: "junction" },
        { id: 1,  name: "NH-6 Ajanta Chowk",                    x: 280,  y: 100,  type: "junction" },
        { id: 2,  name: "NH-6 Akashwani Chowk",                 x: 480,  y: 90,   type: "junction" },
        { id: 3,  name: "NH-6 Ring Road (MIDC Jn)",              x: 700,  y: 80,   type: "junction" },
        { id: 4,  name: "NH-6 East (Bhusawal Phata)",            x: 920,  y: 100,  type: "junction" },

        // --- Northern Residential ---
        { id: 5,  name: "Nehru Chowk",                          x: 350,  y: 220,  type: "junction" },
        { id: 6,  name: "Pimprala Road",                         x: 160,  y: 240,  type: "junction" },

        // --- City Core ---
        { id: 7,  name: "Jilhapeth (Civil Hospital)",           x: 430,  y: 340,  type: "hospital" },
        { id: 8,  name: "Jalgaon Railway Station",               x: 540,  y: 400,  type: "landmark" },
        { id: 9,  name: "Bus Stand (ST Stand)",                  x: 440,  y: 440,  type: "landmark" },
        { id: 10, name: "Ramdas Colony",                         x: 620,  y: 310,  type: "junction" },
        { id: 11, name: "M.J. College Circle",                   x: 350,  y: 420,  type: "junction" },

        // --- Mid-city Hospitals / Key Areas ---
        { id: 12, name: "Khadke Accident Hospital",              x: 500,  y: 300,  type: "hospital" },
        { id: 13, name: "Orchid Superspeciality Hosp",           x: 680,  y: 430,  type: "hospital" },
        { id: 14, name: "Sanjeevan Heart Hospital",              x: 300,  y: 350,  type: "hospital" },

        // --- MG Road / 100ft Road Corridor ---
        { id: 15, name: "Mahatma Gandhi Road",                  x: 420,  y: 550,  type: "junction" },
        { id: 16, name: "100ft Road (Shahu Nagar)",              x: 270,  y: 560,  type: "junction" },
        { id: 17, name: "Shivaji Nagar",                        x: 600,  y: 530,  type: "junction" },

        // --- Southern Belt ---
        { id: 18, name: "Adarsh Nagar",                         x: 200,  y: 470,  type: "junction" },
        { id: 19, name: "Ganesh Colony",                         x: 580,  y: 460,  type: "junction" },
        { id: 20, name: "Pratap Nagar",                          x: 320,  y: 680,  type: "junction" },
        { id: 21, name: "Siddhivinayak Hospital Area",           x: 640,  y: 620,  type: "hospital" },
        { id: 22, name: "Arogyadeep Hospital",                   x: 520,  y: 620,  type: "hospital" },

        // --- Outer South / Landmarks ---
        { id: 23, name: "Gandhi Teerth",                         x: 180,  y: 780,  type: "landmark" },
        { id: 24, name: "Mehrun Lake",                           x: 750,  y: 720,  type: "landmark" },
        { id: 25, name: "Ring Road South",                       x: 460,  y: 770,  type: "junction" },
        { id: 26, name: "Asoda-Tarsod Road",                    x: 820,  y: 580,  type: "junction" },
        { id: 27, name: "MIDC Industrial Area",                  x: 840,  y: 230,  type: "junction" },

        // --- Extra nodes for realistic density ---
        { id: 28, name: "Malti Accident Hospital",               x: 380,  y: 260,  type: "hospital" },
        { id: 29, name: "Khandesh Mill Complex",                 x: 470,  y: 490,  type: "junction" },

        // --- Police / Fire Stations (informational markers) ---
        { id: 30, name: "Jalgaon City Police Stn",              x: 460,  y: 370,  type: "police" },
        { id: 31, name: "Fire Station (Jilhapeth)",             x: 400,  y: 380,  type: "fire" }
    ],

    // Undirected edges — distance in km, time in minutes at free flow
    edges: [
        // NH-6 Bypass (top artery)
        { source: 0,  target: 1,  distance: 3.5, time: 3.0, roadType: "highway" },
        { source: 1,  target: 2,  distance: 3.0, time: 2.5, roadType: "highway" },
        { source: 2,  target: 3,  distance: 3.5, time: 3.0, roadType: "highway" },
        { source: 3,  target: 4,  distance: 4.0, time: 3.5, roadType: "highway" },

        // NH-6 to city entries
        { source: 0,  target: 6,  distance: 2.0, time: 3.0, roadType: "main" },
        { source: 1,  target: 5,  distance: 1.5, time: 2.5, roadType: "main" },
        { source: 1,  target: 28, distance: 1.8, time: 3.0, roadType: "main" },
        { source: 2,  target: 12, distance: 2.0, time: 3.5, roadType: "main" },
        { source: 3,  target: 27, distance: 2.0, time: 2.5, roadType: "main" },
        { source: 3,  target: 10, distance: 2.5, time: 4.0, roadType: "main" },
        { source: 4,  target: 27, distance: 2.0, time: 2.5, roadType: "highway" },

        // Northern grid
        { source: 6,  target: 14, distance: 2.0, time: 3.5, roadType: "main" },
        { source: 6,  target: 18, distance: 2.5, time: 4.0, roadType: "local" },
        { source: 5,  target: 28, distance: 1.0, time: 2.0, roadType: "local" },
        { source: 5,  target: 7,  distance: 1.8, time: 3.0, roadType: "main" },
        { source: 28, target: 12, distance: 1.5, time: 2.5, roadType: "main" },
        { source: 28, target: 7,  distance: 1.2, time: 2.0, roadType: "local" },

        // Core city cluster
        { source: 14, target: 11, distance: 1.0, time: 2.0, roadType: "local" },
        { source: 14, target: 7,  distance: 1.5, time: 2.5, roadType: "main" },
        { source: 7,  target: 30, distance: 0.5, time: 1.0, roadType: "local" },
        { source: 30, target: 31, distance: 0.5, time: 1.0, roadType: "local" },
        { source: 31, target: 9,  distance: 0.8, time: 1.5, roadType: "local" },
        { source: 7,  target: 12, distance: 1.2, time: 2.0, roadType: "main" },
        { source: 12, target: 10, distance: 1.5, time: 2.5, roadType: "main" },
        { source: 12, target: 8,  distance: 1.0, time: 2.0, roadType: "main" },
        { source: 10, target: 13, distance: 1.5, time: 3.0, roadType: "main" },
        { source: 10, target: 27, distance: 3.0, time: 4.0, roadType: "main" },
        { source: 8,  target: 9,  distance: 1.2, time: 2.5, roadType: "local" },
        { source: 8,  target: 19, distance: 1.0, time: 2.0, roadType: "local" },
        { source: 9,  target: 29, distance: 0.8, time: 1.5, roadType: "local" },
        { source: 9,  target: 11, distance: 1.2, time: 2.5, roadType: "local" },

        // Mid city connections
        { source: 11, target: 18, distance: 1.5, time: 3.0, roadType: "local" },
        { source: 11, target: 16, distance: 1.2, time: 2.0, roadType: "main" },
        { source: 18, target: 16, distance: 1.5, time: 2.5, roadType: "local" },
        { source: 19, target: 13, distance: 1.2, time: 2.5, roadType: "main" },
        { source: 19, target: 17, distance: 1.0, time: 2.0, roadType: "local" },
        { source: 29, target: 15, distance: 1.0, time: 2.0, roadType: "local" },
        { source: 29, target: 19, distance: 1.5, time: 2.5, roadType: "local" },

        // MG Road / 100ft corridor
        { source: 16, target: 15, distance: 2.0, time: 3.0, roadType: "main" },
        { source: 15, target: 17, distance: 2.0, time: 3.0, roadType: "main" },
        { source: 15, target: 22, distance: 1.5, time: 2.5, roadType: "main" },
        { source: 17, target: 21, distance: 1.5, time: 2.5, roadType: "main" },
        { source: 17, target: 13, distance: 2.0, time: 3.5, roadType: "main" },
        { source: 13, target: 26, distance: 2.5, time: 4.0, roadType: "main" },

        // Southern belt
        { source: 16, target: 20, distance: 2.0, time: 3.5, roadType: "local" },
        { source: 20, target: 23, distance: 2.5, time: 4.0, roadType: "local" },
        { source: 20, target: 25, distance: 2.0, time: 3.0, roadType: "main" },
        { source: 22, target: 25, distance: 2.0, time: 3.0, roadType: "main" },
        { source: 22, target: 21, distance: 1.5, time: 2.0, roadType: "local" },
        { source: 21, target: 24, distance: 2.0, time: 3.0, roadType: "local" },
        { source: 21, target: 26, distance: 2.5, time: 4.0, roadType: "main" },
        { source: 25, target: 23, distance: 3.5, time: 5.0, roadType: "local" },
        { source: 25, target: 24, distance: 3.5, time: 5.0, roadType: "local" },
        { source: 26, target: 24, distance: 2.5, time: 3.5, roadType: "local" },
        { source: 26, target: 27, distance: 3.5, time: 5.0, roadType: "main" },
        { source: 27, target: 4,  distance: 2.0, time: 2.5, roadType: "highway" }
    ],

    ambulances: [
        { id: "AMB-01", node: 7,  status: "AVAILABLE", affiliation: "Civil Hospital",      capacity: 2, speed: 60 },
        { id: "AMB-02", node: 13, status: "AVAILABLE", affiliation: "Orchid Hospital",      capacity: 2, speed: 65 },
        { id: "AMB-03", node: 14, status: "AVAILABLE", affiliation: "Sanjeevan Heart Hosp", capacity: 1, speed: 55 },
        { id: "AMB-04", node: 12, status: "AVAILABLE", affiliation: "Khadke Accident Hosp", capacity: 2, speed: 60 },
        { id: "AMB-05", node: 4,  status: "AVAILABLE", affiliation: "108 Emergency",        capacity: 3, speed: 70 },
        { id: "AMB-06", node: 23, status: "AVAILABLE", affiliation: "108 Emergency",        capacity: 2, speed: 65 },
        { id: "AMB-07", node: 21, status: "AVAILABLE", affiliation: "Siddhivinayak Hosp",   capacity: 2, speed: 60 },
        { id: "AMB-08", node: 0,  status: "AVAILABLE", affiliation: "108 Emergency",        capacity: 3, speed: 70 }
    ],

    hospitals: [
        { id: "HOSP-01", name: "Civil Hospital, Jilhapeth",         node: 7,  trauma: true,  icu: true,  beds: 200, capacity: 68 },
        { id: "HOSP-02", name: "Orchid Superspeciality Hospital",    node: 13, trauma: true,  icu: true,  beds: 120, capacity: 55 },
        { id: "HOSP-03", name: "Sanjeevan Heart Hospital",          node: 14, trauma: false, icu: true,  beds: 80,  capacity: 72 },
        { id: "HOSP-04", name: "Khadke Accident Hospital",          node: 12, trauma: true,  icu: false, beds: 60,  capacity: 45 },
        { id: "HOSP-05", name: "Siddhivinayak Multispeciality Hosp",node: 21, trauma: false, icu: true,  beds: 90,  capacity: 60 },
        { id: "HOSP-06", name: "Arogyadeep Hospital",               node: 22, trauma: false, icu: false, beds: 40,  capacity: 30 },
        { id: "HOSP-07", name: "Malti Accident Hospital",           node: 28, trauma: true,  icu: false, beds: 50,  capacity: 40 },
        { id: "HOSP-08", name: "Tapadia Diagnostic Centre",         node: 10, trauma: false, icu: false, beds: 30,  capacity: 20 }
    ],

    incidents: [
        { id: "INC-2048", type: "Multi-vehicle Highway Collision",  severity: "CRITICAL", node: 2,  patients: 3, description: "3-car pileup near Akashwani Chowk on NH-6" },
        { id: "INC-2049", type: "Truck Overturned on NH-6",         severity: "CRITICAL", node: 4,  patients: 4, description: "Goods truck overturned near Bhusawal Phata" },
        { id: "INC-2050", type: "Bike-Auto Collision",              severity: "MEDIUM",   node: 15, patients: 2, description: "Two-wheeler collided with autorickshaw on MG Road" },
        { id: "INC-2051", type: "Minor Fender-Bender",              severity: "LOW",      node: 27, patients: 1, description: "Minor collision in MIDC Industrial Area" },
        { id: "INC-2052", type: "Pedestrian Hit by Car",            severity: "MEDIUM",   node: 5,  patients: 1, description: "Pedestrian struck near Nehru Chowk" },
        { id: "INC-2053", type: "Bus Brake Failure Accident",       severity: "CRITICAL", node: 0,  patients: 5, description: "ST Bus brake failure near Paldhi Naka" },
        { id: "INC-2054", type: "Motorcycle Skid on Wet Road",      severity: "LOW",      node: 20, patients: 1, description: "Rider skidded near Pratap Nagar in rain" },
        { id: "INC-2055", type: "Tempo-Car Head-on Collision",      severity: "CRITICAL", node: 3,  patients: 3, description: "Head-on collision at MIDC Junction on Ring Road" },
        { id: "INC-2056", type: "Chain Collision on 100ft Road",    severity: "MEDIUM",   node: 16, patients: 2, description: "3-vehicle chain collision near Shahu Nagar" },
        { id: "INC-2057", type: "School Van Accident",              severity: "CRITICAL", node: 25, patients: 6, description: "School van collision on Ring Road South" }
    ]
};
