# VisualLab MERN 🔬

VisualLab is a high-performance, collaborative 2D physics sandbox designed for university-level education and experimental research. Built on the MERN stack, it combines the deterministic physics of **Matter.js** with real-time synchronization via **Socket.io**.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Nodejs](https://img.shields.io/badge/Node.js-LTS-339933?logo=node.js)
![Matter.js](https://img.shields.io/badge/Physics-Matter.js-EF4444)

## ✨ Key Features

- **Collaborative Workspace**: Build and test mechanical systems with others in real-time.
- **Advanced Physics Library**:
  - **Dynamic Bodies**: Circles and Rectangles with adjustable mass/friction.
  - **Constraints**: Strings, Springs, and rigid links.
  - **Mechanical Components**: Functional Pulleys, Ropes, and Motors.
- **Real-Time Analytics**: Live tracking of kinetic energy, velocity, and world complexity.
- **Scenario Templates**: Save your experiments to a MongoDB cloud/local database and reload them instantly.
- **Cinematic UI**: A sleek, dark-noir aesthetic optimized for focus and visibility.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Matter.js, Lucide-react, Chart.js.
- **Backend**: Node.js, Express, MongoDB, Mongoose.
- **Real-time**: Socket.io (Room-based synchronization).

## 🛠️ Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/visuallab-mern.git
cd visuallab-mern
```

### 2. Setup Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=3002
MONGODB_URI=mongodb://127.0.0.1:27017/visuallab
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
```

## 🏃 Running the Application

### The Easy Way (Windows)
Simply run the included batch file in the root directory:
```bash
start.bat
```

### Manual Way
**Start Backend:**
```bash
cd backend
node server.js
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```

Visit the app at `http://localhost:5173`.

## 🧪 Simulation Tools

- **Drag**: Interact with objects in real-time.
- **Spring**: Click and drag between two objects to create an elastic constraint.
- **Rope/Pulley**: Deploy pre-built mechanical systems.
- **Motor**: Add constant torque components to your machine.
- **Eraser**: Selectively remove bodies from the simulation.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
