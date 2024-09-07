const express = require('express');
const bodyParser = require('body-parser');
const compileRun = require('compile-run');

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

app.post('/compile', (req, res) => {
    const { code, language } = req.body;

    let resultPromise;
    if (language === 'javascript') {
        resultPromise = compileRun.runSource(code, { language: 'node' });
    } else if (language === 'python') {
        resultPromise = compileRun.runSource(code, { language: 'python' });
    } else if (language === 'java') {
        resultPromise = compileRun.runSource(code, { language: 'java' });
    } else if (language === 'c') {
        resultPromise = compileRun.runSource(code, { language: 'c' });
    } else if (language === 'cpp') {
        resultPromise = compileRun.runSource(code, { language: 'cpp' });
    } else {
        return res.status(400).send('Unsupported language');
    }

    resultPromise
        .then(result => {
            res.send(result.stdout);
        })
        .catch(err => {
            res.status(500).send(err.stderr);
        });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
