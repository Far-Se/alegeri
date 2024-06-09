
// nodemon server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const baseDirectory = path.join(__dirname, ''); 
const serveFile = (filePath, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`<h1>404 Not Found</h1> ${JSON.stringify(err)}`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Server Error</h1>');
      }
    } else {
      
      const ext = path.extname(filePath).toLowerCase();
      const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.geojson': 'application/geojson',
        '.png': 'image/png', 
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif'
      }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data); 
    } 
  });
};
const server = http.createServer((req, res) => {
  
  const safeSuffix = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(baseDirectory, safeSuffix);
  if (req.url === '/') {
    filePath = path.join(baseDirectory, 'index.html');
  }
  serveFile(filePath, res);
});
const port = 3000;
server.listen(port, () => {});