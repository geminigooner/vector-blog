const http = require('http');
const req = http.request('http://localhost:3000/api/parse-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/pdf' }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', data));
});
req.write(Buffer.from('%PDF-1.4 test'));
req.end();
