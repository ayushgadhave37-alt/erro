class TrafficController {
    constructor(mapEngine) {
        this.mapEngine = mapEngine;
        this.buttons = document.querySelectorAll('.traffic-btn');
        this.setupListeners();
    }

    setupListeners() {
        this.buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const level = btn.getAttribute('data-level');
                this.mapEngine.setTrafficLevel(level);
                
                // Trigger global event for re-routing if needed
                window.dispatchEvent(new CustomEvent('traffic-changed'));
            });
        });
    }
}
