const mongoose = require('mongoose');

const srvUri = 'mongodb+srv://Nadun:2002@cluster.hdc7bci.mongodb.net/?retryWrites=true&w=majority';
const standardUri = 'mongodb://Nadun:2002@ac-jqzyxyw-shard-00-00.hdc7bci.mongodb.net:27017,ac-jqzyxyw-shard-00-01.hdc7bci.mongodb.net:27017,ac-jqzyxyw-shard-00-02.hdc7bci.mongodb.net:27017/test?authSource=admin&replicaSet=atlas-yt4z87-shard-0&tls=true&retryWrites=true&w=majority';

async function testConnection() {
    console.log('Testing standard URI...');
    try {
        await mongoose.connect(standardUri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Standard URI worked!');
        process.exit(0);
    } catch (err) {
        console.log('❌ Standard URI failed:', err.message);
    }

    console.log('Testing SRV URI...');
    try {
        await mongoose.connect(srvUri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ SRV URI worked!');
    } catch (err) {
        console.log('❌ SRV URI failed:', err.message);
    }
    process.exit(1);
}

testConnection();
