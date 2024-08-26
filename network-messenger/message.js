const dgram = require('dgram');
const localDevices = require('local-devices');

const message = Buffer.from('Hello, network device!');
const PORT = 41234;

// Function to send messages to all devices on the network
async function sendMessageToAllDevices() {
    try {
        const devices = await localDevices();
        const client = dgram.createSocket('udp4');

        devices.forEach(device => {
            client.send(message, 0, message.length, PORT, device.ip, (err) => {
                if (err) {
                    console.error(`Failed to send message to ${device.name} (${device.ip}):`, err);
                } else {
                    console.log(`Message sent to ${device.name} (${device.ip})`);
                }
            });
        });

        client.close();
    } catch (error) {
        console.error('Error fetching devices:', error);
    }
}

sendMessageToAllDevices();
