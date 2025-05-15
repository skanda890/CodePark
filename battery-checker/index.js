const fetch = require("node-fetch");
const ping = require("ping");
const scanner = require("network-scanner");

async function getBatteryStatus(ip) {
    try {
        const response = await fetch(`http://${ip}:PORT/battery`); // Adjust the PORT where the API exposes battery info
        const data = await response.json();
        console.log(`Battery for ${ip}: ${data.level}%`);
    } catch (error) {
        console.log(`Could not fetch battery data for ${ip}`);
    }
}

async function getAllDevicesBattery() {
    console.log("Scanning network for active devices...");
    const devices = await scanner.scan("192.168.1.1/24"); // Adjust subnet accordingly
    for (const device of devices) {
        if (await ping.promise.probe(device.ip)) {
            await getBatteryStatus(device.ip);
        }
    }
}

const command = process.argv[2];

if (command === "single") {
    const ipAddress = process.argv[3];
    if (!ipAddress) {
        console.log("Usage: node index.js single <IP-Address>");
    } else {
        getBatteryStatus(ipAddress);
    }
} else if (command === "all") {
    getAllDevicesBattery();
} else {
    console.log("Usage:");
    console.log("  node index.js single <IP-Address>  # Check battery of a single device");
    console.log("  node index.js all                  # Check battery of all devices on the network");
}
