# ⛽ FuelNow

Real-time fuel availability tracking at nearby fuel stations. A crowdsourced platform that helps drivers find fuel stations with available fuel types.

![FuelNow Screenshot](https://via.placeholder.com/800x400/0F172A/F59E0B?text=FuelNow+App)

## Features

- 🗺️ **Interactive Map** - View fuel stations on an interactive Leaflet map with OpenStreetMap tiles
- 📍 **Real-time Location** - Automatically detect and center on your current location
- ⛽ **Fuel Availability** - Check availability for Super Diesel, Diesel, Super Petrol, and Petrol
- 🔄 **Live Updates** - Socket.io powered real-time updates when availability changes
- 📱 **Mobile-first** - Responsive design optimized for mobile and desktop
- 🔒 **Proximity Validation** - Users must be within 500m of a station to update availability
- 🔍 **Search & Filter** - Find stations by name, address, or availability status

## Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API server
- **MongoDB** + **Mongoose** - Database with geospatial queries
- **Socket.io** - Real-time bidirectional communication
- **express-validator** - Input validation
- **Nominatim API** - Address geocoding

### Frontend
- **React 18** + **Vite** - Modern React build tool
- **React Router v6** - Client-side routing
- **Leaflet.js** + **React-Leaflet** - Interactive maps
- **Tailwind CSS** - Utility-first styling
- **Socket.io-client** - Real-time updates
- **Axios** - HTTP client

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- MongoDB (local or Atlas)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd fuelnow
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and other settings

# Seed sample data (optional)
npm run seed

# Start development server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if your backend runs on a different port

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fuelnow
ALLOWED_ORIGIN=http://localhost:5173
PROXIMITY_RADIUS_KM=0.5
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## API Endpoints

### Stations
- `GET /api/stations` - Get all stations (optional: `?lat=&lng=&radius=`)
- `GET /api/stations/nearby?lat=&lng=&radius=` - Get nearby stations
- `GET /api/stations/:id` - Get single station
- `POST /api/stations` - Create new station
- `PUT /api/stations/:id` - Update station
- `DELETE /api/stations/:id` - Delete station

### Fuel Updates
- `PATCH /api/stations/:id/fuel` - Update fuel availability (requires proximity)
- `PATCH /api/stations/:id/fuel/batch` - Batch update multiple fuel types
- `GET /api/stations/:id/fuel/history` - Get update history
- `GET /api/stations/:id/fuel/stats` - Get update statistics

## Folder Structure

```
fuelnow/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── socket/          # Socket.io handlers
│   ├── utils/           # Utility functions
│   ├── scripts/         # Seed scripts
│   └── server.js        # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── components/  # React components
│   │   ├── context/     # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Page components
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
│
└── README.md
```

## How It Works

### Fuel Availability Status

Stations are color-coded on the map based on fuel availability:
- 🟢 **Green** - All fuel types available
- 🔴 **Red** - No fuel types available
- 🟡 **Yellow** - Mixed availability
- ⚪ **Gray** - Unknown/No updates yet

### Updating Fuel Availability

1. Navigate to a station on the map or list
2. Click "Update Availability"
3. Select availability for each fuel type
4. Submit (requires being within 500m of the station)

### Real-time Updates

When a user updates fuel availability:
1. Server validates proximity (within 500m)
2. Update is saved to database
3. Socket.io broadcasts update to all connected clients
4. All clients see the update instantly without refreshing

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Linting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

## Deployment

### Backend Deployment (e.g., Railway, Render, Heroku)

1. Set environment variables in your hosting platform
2. Connect your MongoDB Atlas cluster
3. Deploy from Git repository

### Frontend Deployment (e.g., Vercel, Netlify)

```bash
cd frontend
npm run build
```

Upload the `dist/` folder to your static hosting provider.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) - Free map tiles
- [Nominatim](https://nominatim.org/) - Free geocoding service
- [Leaflet](https://leafletjs.com/) - Interactive maps library

---

Built with ❤️ for drivers everywhere
