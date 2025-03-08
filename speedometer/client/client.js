import alt from 'alt-client';
import * as native from 'natives';

let speedometerWebView;
let updateInterval;

alt.on('connectionComplete', () => {
    speedometerWebView = new alt.WebView('http://resource/client/speedometer/index.html'); // Fixed URL
    speedometerWebView.on('load', () => {
        speedometerWebView.emit('show', { visible: false });
    });
});

alt.on('enteredVehicle', (vehicle, seat) => {
    if (seat === 0 && vehicle) { // Changed seat check to 0 (driver seat)
        speedometerWebView.emit('show', { visible: true });
        startUpdates(vehicle);
    }
});

alt.on('leftVehicle', () => {
    speedometerWebView.emit('show', { visible: false });
    stopUpdates();
});

function startUpdates(vehicle) {
    stopUpdates();
    
    updateInterval = alt.setInterval(() => {
        if (!vehicle || !vehicle.valid) return;
        
        const speed = native.getEntitySpeed(vehicle.scriptID) * 3.6;
        const rpm = native.getVehicleCurrentRpm(vehicle.scriptID) || 0; // Verify actual native
        
        speedometerWebView.emit('update', {
            speed: Math.round(speed),
            rpm: rpm
        });
    }, 50);
}

function stopUpdates() {
    if (updateInterval) {
        alt.clearInterval(updateInterval);
        updateInterval = null;
    }
}

alt.on('disconnect', () => {
    stopUpdates();
    if (speedometerWebView) {
        speedometerWebView.destroy();
        speedometerWebView = null;
    }
});