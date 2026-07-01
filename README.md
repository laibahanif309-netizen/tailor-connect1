# TailorConnect - Tailor/Designer Marketplace App

A mobile marketplace connecting customers with local tailors/designers, enabling portfolio browsing, order placement, real-time communication, and home visit bookings.

## Project Structure

```
TailorApp/
├── frontend/          # Expo React Native App
├── backend/           # Node.js Express API
└── package.json       # Root workspace config
```

## Tech Stack

### Frontend
- React Native with Expo (~51.0.0)
- Expo Router for navigation
- Gluestack UI for components
- Zustand for state management
- React Query for data fetching
- Socket.io Client for real-time features

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.io for real-time communication
- JWT for authentication
- Multer for file uploads

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Expo Go app on your mobile device

### Installation

1. Install root dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

#### Frontend (Expo)
```bash
cd frontend
npm start
```

Then scan the QR code with Expo Go app on your mobile device.

#### Backend (API Server)
```bash
cd backend
npm run dev
```

The server will run on `http://localhost:5000` (default).

### Environment Variables

Create a `.env` file in the `backend` directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tailorconnect
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```



## License

ISC


