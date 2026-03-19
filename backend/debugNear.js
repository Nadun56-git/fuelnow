const mongoose = require('mongoose');
require('dotenv').config();
const Station = require('./models/Station');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const res = await Station.find({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [79.8775333, 6.8047134] },
                    $maxDistance: 5000
                }
            }
        });
        console.log('OK', res.length);
    } catch (err) {
        console.log('ERROR:', err.message);
    } finally {
        mongoose.disconnect();
    }
}
test();
