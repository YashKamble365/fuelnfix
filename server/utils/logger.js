const fs = require('fs');
const path = require('path');

const logToFile = (message) => {
    try {
        const logPath = path.join(__dirname, '../server_debug.log');
        const timestamp = new Date().toISOString();
        if (!fs.existsSync(logPath)) {
            fs.writeFileSync(logPath, '');
        }
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
        console.error("Logger Failed:", e);
    }
};

exports.logToFile = logToFile;
