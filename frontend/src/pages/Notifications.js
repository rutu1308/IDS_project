import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBell, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/api/notifications');
                setNotifications(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setLoading(false);
            }
        };

        fetchNotifications();

        // Refresh data every 10 seconds
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="notifications-page">
            <h1 className="page-title"><FaBell /> Security Notifications</h1>

            {loading ? (
                <div className="loading-container">Loading notifications...</div>
            ) : notifications.length > 0 ? (
                <div className="notification-list">
                    {notifications.map((notification, index) => (
                        <div key={index} className={`notification-card ${notification.severity}`}>
                            <div className="notification-header">
                                <span className="notification-icon">
                                    {notification.severity === 'critical' ? <FaExclamationTriangle /> : <FaCheckCircle />}
                                </span>
                                <span className="notification-time">
                                    {new Date(notification.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <div className="notification-message">{notification.message}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-notifications">
                    <p>No security alerts detected. Your network appears to be secure. ✅</p>
                </div>
            )}
        </div>
    );
};

export default Notifications;
