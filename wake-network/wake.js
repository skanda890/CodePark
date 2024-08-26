const wol = require('wake_on_lan');
const localDevices = require('local-devices');

// Function to wake all devices on the network
async function wakeAllDevices() {
    try {
        const devices = await localDevices();
        devices.forEach(device => {
            wol.wake(device.mac, function(error) {
                if (error) {
                    console.error(`Failed to wake device ${device.name} (${device.mac}):`, error);
                } else {
                    console.log(`Sent wake signal to ${device.name} (${device.mac})`);
                }
            });
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
    }
}

wakeAllDevices();
