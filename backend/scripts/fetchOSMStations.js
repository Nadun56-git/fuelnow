/**
 * fetchOSMStations.js  
 * 
 * Step 1 – Queries the free OpenStreetMap Overpass API for every fuel station
 *           in Sri Lanka.
 * Step 2 – POSTs them to the running FuelNow backend (/api/stations) so the
 *           backend's existing MongoDB connection is used (avoids DNS quirks
 *           when running a standalone script against Atlas SRV records).
 *
 * Usage:
 *   Make sure the backend is running on port 5000 first, then:
 *   node scripts/fetchOSMStations.js
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Sri Lanka bounding box: south, west, north, east
const SL_BBOX = '5.9,79.5,9.9,82.0';

//─── Overpass query ─────────────────────────────────────────────────────────────
// Uses a bounding box covering all of Sri Lanka — more reliable than area lookup
const OVERPASS_QUERY = `
[out:json][timeout:90];
(
  node["amenity"="fuel"](${SL_BBOX});
  way["amenity"="fuel"](${SL_BBOX});
);
out center tags;
`;

//─── Generic HTTP helpers ────────────────────────────────────────────────────────
function httpPost(urlStr, body, isJson = false) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const payload = isJson ? JSON.stringify(body) : `data=${encodeURIComponent(body)}`;
        const lib = url.protocol === 'https:' ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': isJson ? 'application/json' : 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(payload),
                'User-Agent': 'FuelNow/1.0',
            },
        };

        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });

        req.setTimeout(100_000, () => req.destroy(new Error('Timeout')));
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function httpDelete(urlStr) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const lib = url.protocol === 'https:' ? https : http;
        const options = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname,
            method: 'DELETE',
            headers: { 'User-Agent': 'FuelNow/1.0' },
        };
        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => resolve({ status: res.statusCode }));
        });
        req.on('error', reject);
        req.end();
    });
}

//─── OSM → Station converter ─────────────────────────────────────────────────────
function osmToStation(el) {
    const tags = el.tags || {};
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) return null;

    const name = (
        tags.name ||
        tags['name:en'] ||
        tags.operator ||
        tags.brand ||
        'Fuel Station'
    ).trim().slice(0, 100);

    const addrParts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:suburb'],
        tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    ].filter(Boolean);

    const address = (
        addrParts.length > 0 ? addrParts.join(', ') + ', Sri Lanka' : `${name}, Sri Lanka`
    ).slice(0, 300);

    return { name, address, lat: parseFloat(lat), lng: parseFloat(lon) };
}

//─── Seed via backend API ────────────────────────────────────────────────────────
async function clearExistingStations() {
    // This only works if you add a DELETE /api/stations/all admin route.
    // For now we skip this step; the backend's POST will create new docs.
    // You can manually clear via MongoDB Atlas if needed.
}

async function main() {
    console.log('🌐 Querying Overpass API for Sri Lanka fuel stations…');
    console.log('   (This may take 20–60 seconds)\n');

    let osmData;
    try {
        const res = await httpPost('https://overpass-api.de/api/interpreter', OVERPASS_QUERY);
        osmData = res.body;
    } catch (err) {
        console.error('❌ Overpass API error:', err.message);
        process.exit(1);
    }

    const elements = osmData.elements || [];
    console.log(`📦 Received ${elements.length} OSM elements`);

    const stations = elements.map(osmToStation).filter(Boolean);
    console.log(`🗺️  Valid stations: ${stations.length}\n`);

    if (stations.length === 0) {
        console.log('⚠️  No stations found.');
        return;
    }

    // Clear existing stations via the admin endpoint
    console.log('🧹 Clearing existing stations…');
    try {
        const clearRes = await httpDelete(`${BACKEND_URL}/api/stations/all`);
        if (clearRes.status === 200) {
            console.log(`   ✅ Cleared existing stations\n`);
        } else {
            console.log(`   ⚠️  Clear returned status ${clearRes.status} — continuing anyway\n`);
        }
    } catch (err) {
        console.log(`   ⚠️  Could not clear: ${err.message} — continuing anyway\n`);
    }

    // Post each station to the backend
    console.log(`🚀 Importing via backend API at ${BACKEND_URL} …\n`);
    let ok = 0, fail = 0;

    for (let i = 0; i < stations.length; i++) {
        const s = stations[i];
        try {
            const res = await httpPost(`${BACKEND_URL}/api/stations`, s, true);
            if (res.status === 201) {
                ok++;
            } else {
                fail++;
                if (fail <= 5) {
                    console.warn(`   ⚠️  Failed [${res.status}]: ${s.name} — ${JSON.stringify(res.body).slice(0, 80)}`);
                }
            }
        } catch (err) {
            fail++;
        }

        // Progress every 20 stations
        if ((i + 1) % 20 === 0 || i === stations.length - 1) {
            process.stdout.write(`   ✔ ${i + 1}/${stations.length} (${ok} ok, ${fail} failed)\r`);
        }
    }

    console.log(`\n\n✅ Import complete!`);
    console.log(`   Inserted : ${ok}`);
    console.log(`   Failed   : ${fail}`);
    if (fail > 0) console.log('   (Failures are usually duplicates or validation errors — safe to ignore)');
    console.log('\n🎉 Refresh the app to see real fuel stations across Sri Lanka!');
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
