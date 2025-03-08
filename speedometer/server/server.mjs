import alt from 'alt-server';

alt.onClient('vehicleEngineState', (vehicle, state) => {
    if (vehicle && vehicle.valid) {
        vehicle.setSyncedMeta('engineState', state);
    }
});