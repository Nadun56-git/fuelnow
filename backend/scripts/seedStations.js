/**
 * Seed Script for FuelNow
 * Inserts sample fuel stations into the database
 * Run with: node scripts/seedStations.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import Station model
const Station = require('../models/Station');

// Sample fuel stations data (Sri Lankan locations)
const sampleStations = [
  {
    name: 'Ceypetco Fuel - Negombo North',
    address: '161, Main Street, Negombo, Sri Lanka',
    location: {
      type: 'Point',
      coordinates: [79.8359, 7.2083] // [lng, lat]
    },
    fuel: generateRandomFuelStatus()
  },
  {
    name: 'IOC Petrol Station - Wattala',
    address: 'Negombo Road, Wattala, Sri Lanka',
    location: {
      type: 'Point',
      coordinates: [79.8936, 6.9909]
    },
    fuel: generateRandomFuelStatus()
  },
  {
    name: 'Ceypetco Fuel - Colombo Fort',
    address: 'Janadhipathi Mawatha, Colombo 01, Sri Lanka',
    location: {
      type: 'Point',
      coordinates: [79.8429, 6.9353]
    },
    fuel: generateRandomFuelStatus()
  },
  {
    name: 'IOC Fuel Station - Dehiwala',
    address: 'Galle Road, Dehiwala, Sri Lanka',
    location: {
      type: 'Point',
      coordinates: [79.8608, 6.8530]
    },
    fuel: generateRandomFuelStatus()
  },
  {
    name: 'Ceypetco - Mount Lavinia',
    address: 'Galle Road, Mount Lavinia, Sri Lanka',
    location: {
      type: 'Point',
      coordinates: [79.8655, 6.8329]
    },
    fuel: generateRandomFuelStatus()
  },
  {
    name: 'Lanka IOC - Nugegoda',
    address: 'High Level Road, Nugegoda, Sri Lanka',
    location: {
      type: 'Point',
      coordinates: [79.8999, 6.8649]
    },
    fuel: generateRandomFuelStatus()
  },
  {
    name: 'Ceypetco Fuel - Maharagama',
    address: 'High Level Road, Maharagama, Sri Lanka',
    location: {
      type: 'Point',
      coordinates: [79.9250, 6.8483]
    },
    fuel: generateRandomFuelStatus()
  },
  {
    name: 'IOC Petrol Station - Kandy Road',
    address: 'Kandy Road, Kadawatha, Sri Lanka',
    location: {
      type: 'Point',
      coordinates: [79.9503, 7.0936]
    },
    fuel: generateRandomFuelStatus()
  },
  {
    name: 'Ceypetco - Galle Face',
    address: 'Galle Road, Colombo 03, Sri Lanka',
    location: {
      type: 'Point',
      coordinates: [79.8448, 6.9256]
    },
    fuel: generateRandomFuelStatus()
  },
  {
    name: 'Lanka IOC - Bambalapitiya',
    address: 'Galle Road, Bambalapitiya, Colombo 04, Sri Lanka',
    location: {
      type: 'Point',
      coordinates: [79.8566, 6.8940]
    },
    fuel: generateRandomFuelStatus()
  }
];

/**
 * Generate random fuel availability status for seeding
 */
function generateRandomFuelStatus() {
  const fuelTypes = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
  const status = {};
  
  fuelTypes.forEach(type => {
    const rand = Math.random();
    let available;
    if (rand < 0.3) {
      available = true; // 30% chance available
    } else if (rand < 0.6) {
      available = false; // 30% chance unavailable
    } else {
      available = null; // 40% chance unknown
    }
    
    status[type] = {
      available,
      lastUpdated: available !== null ? getRandomRecentDate() : null,
      updatedBy: available !== null ? 'seed-script' : null
    };
  });
  
  return status;
}

/**
 * Get a random date within the last 24 hours
 */
function getRandomRecentDate() {
  const now = new Date();
  const hoursAgo = Math.floor(Math.random() * 24);
  return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
}

/**
 * Seed the database
 */
async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/fuelnow';
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing stations (optional - remove if you want to keep existing data)
    console.log('🧹 Clearing existing stations...');
    await Station.deleteMany({});
    console.log('✅ Cleared existing stations');
    
    // Insert sample stations
    console.log('🌱 Seeding stations...');
    const result = await Station.insertMany(sampleStations);
    console.log(`✅ Successfully inserted ${result.length} stations`);
    
    // Log inserted stations
    console.log('\n📍 Inserted Stations:');
    result.forEach((station, index) => {
      console.log(`  ${index + 1}. ${station.name}`);
      console.log(`     📍 ${station.location.coordinates[1]}, ${station.location.coordinates[0]}`);
      console.log(`     ⛽ Status: ${getStatusSummary(station.fuel)}`);
    });
    
    console.log('\n🎉 Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

/**
 * Get a summary of fuel status for display
 */
function getStatusSummary(fuel) {
  const types = ['superDiesel', 'diesel', 'superPetrol', 'petrol'];
  const available = types.filter(t => fuel[t]?.available === true).length;
  const unavailable = types.filter(t => fuel[t]?.available === false).length;
  const unknown = types.filter(t => fuel[t]?.available === null).length;
  return `${available}✓ ${unavailable}✗ ${unknown}?`;
}

// Run the seed function
seedDatabase();
