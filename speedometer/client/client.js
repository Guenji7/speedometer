import alt from 'alt-client';
import * as native from 'natives';

let speedometerWebView;
let updateInterval;
let isEngineOn = false;
let canToggleEngine = true;

alt.on('connectionComplete', () => {
    speedometerWebView = new alt.WebView('http://resource/client/speedometer/index.html'); // Fixed URL
    speedometerWebView.on('load', () => {
        speedometerWebView.emit('show', { visible: false });
    });
});

alt.on('enteredVehicle', (vehicle, seat) => {
    if (seat === 1 && vehicle) { // Changed seat check to 1 (driver seat)
        speedometerWebView.emit('show', { visible: true });
        startUpdates(vehicle);
        native.setVehicleEngineOn(vehicle.scriptID, false, true, true); // Turn off the engine when entering the vehicle
        isEngineOn = false;
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

alt.on('keydown', (key) => {
    if (key === 17 && canToggleEngine) { // 17 is the keycode for the Control key
        const vehicle = alt.Player.local.vehicle;
        if (vehicle && alt.Player.local.seat === 1) { // Check if the player is in the vehicle and in the driver's seat
            isEngineOn = !isEngineOn;
            native.setVehicleEngineOn(vehicle.scriptID, isEngineOn, true, true);
            
            if (isEngineOn) {
                alt.emitServer('vehicleEngineState', vehicle, true);
            } else {
                alt.emitServer('vehicleEngineState', vehicle, false);
                canToggleEngine = false;
                alt.setTimeout(() => {
                    canToggleEngine = true;
                }, 1000); // 1-second delay
            }
        }
    }
});

// Prevent vehicle from starting when pressing the gas pedal (W key)
alt.on('gameTick', () => {
    const vehicle = alt.Player.local.vehicle;
    if (vehicle && alt.Player.local.seat === 1 && !isEngineOn) {
        if (native.getIsVehicleEngineRunning(vehicle.scriptID)) {
            native.setVehicleEngineOn(vehicle.scriptID, false, true, true);
        }
    }
});

alt.on('disconnect', () => {
    stopUpdates();
    if (speedometerWebView) {
        speedometerWebView.destroy();
        speedometerWebView = null;
    }
});