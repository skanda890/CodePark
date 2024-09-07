const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(bodyParser.json());

app.post('/compile', (req, res) => {
    const { code, language } = req.body;

    let command;
    if (language === 'javascript') {
        command = `node -e "${code}"`;
    } else if (language === 'python') {
        command = `python -c "${code}"`;
    } else {
        return res.status(400).send('Unsupported language');
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(stderr);
        }
        res.send(stdout);
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
