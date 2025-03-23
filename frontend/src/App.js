// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PacketLog from './pages/PacketLog';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './App.css';
import io from 'socket.io-client';

function App() {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Establish WebSocket connection
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'], // Ensure websocket for better performance
    });
    setSocket(newSocket);

    // Listen for new notifications
    newSocket.on('new_notification', (data) => {
      setNotifications((prev) => [data, ...prev].slice(0, 5));

      // Play notification sound (ensure it's preloaded for better performance)
      const audio = new Audio('/notification.mp3');
      audio.play().catch((e) => console.warn('Audio play failed:', e));
    });

    return () => newSocket.disconnect(); // Cleanup on unmount
  }, []);

  return (
    <Router>
      <div className="app">
        <Navbar notifications={notifications} />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/packets" element={<PacketLog />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<h2>404 - Page Not Found</h2>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
