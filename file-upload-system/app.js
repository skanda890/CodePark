const http = require('http');
const formidable = require('formidable');

http.createServer((req, res) => {
    if (req.url === '/fileupload') {
        const form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            // Handle the uploaded file here
            // You can access it via `files.filetoupload`
            res.write('File uploaded successfully!');
            res.end();
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<form action="/fileupload" method="post" enctype="multipart/form-data">');
        res.write('<input type="file" name="filetoupload"><br>');
        res.write('<input type="submit">');
        res.write('</form>');
        res.end();
    }
}).listen(8080);
