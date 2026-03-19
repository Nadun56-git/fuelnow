const http = require('http');

http.get('http://localhost:5000/api/stations/nearby?lat=6.9271&lng=79.8612&radius=50', (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log('Status code:', res.statusCode);
            console.log(JSON.stringify(parsedData, null, 2));
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
