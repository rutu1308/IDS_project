import React, { useState } from 'react';
import axios from 'axios';
import { FaCog, FaBell, FaDatabase, FaSyncAlt, FaSlidersH } from 'react-icons/fa';
import '../styles/Settings.css';

const Settings = () => {
    const [retraining, setRetraining] = useState(false);
    const [retrainingResult, setRetrainingResult] = useState(null);
    const [retrainingError, setRetrainingError] = useState(null);
    const [anomalyThreshold, setAnomalyThreshold] = useState(0.75);

    const handleRetrainModel = async () => {
        try {
            setRetraining(true);
            setRetrainingResult(null);
            setRetrainingError(null);

            const response = await axios.post('http://localhost:5000/api/retrain_model');
            setRetrainingResult(response.data.message);
            setRetraining(false);
        } catch (error) {
            console.error('Error retraining model:', error);
            setRetrainingError('Failed to retrain model. Check server logs for details.');
            setRetraining(false);
        }
    };

    return (
        <div className="settings-page">
            <h1 className="page-title"><FaCog /> System Settings</h1>

            <div className="settings-grid">

                {/* Model Management */}
                <div className="settings-card animate-fade-in">
                    <h2><FaSyncAlt /> Model Management</h2>

                    <div className="setting-group">
                        <h3>🔄 Retraining</h3>
                        <p>Retrain the anomaly detection model with the latest data to improve accuracy.</p>
                        <button
                            className={`retrain-btn ${retraining ? 'loading' : ''}`}
                            onClick={handleRetrainModel}
                            disabled={retraining}
                        >
                            {retraining ? '⏳ Retraining...' : '🚀 Retrain Model'}
                        </button>

                        {retrainingResult && (
                            <div className="result-message success">
                                ✅ {retrainingResult}
                            </div>
                        )}

                        {retrainingError && (
                            <div className="result-message error">
                                ❌ {retrainingError}
                            </div>
                        )}
                    </div>

                    <div className="setting-group">
                        <h3>📊 Anomaly Threshold</h3>
                        <p>Adjust sensitivity of anomaly detection (lower values increase sensitivity).</p>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={anomalyThreshold}
                            onChange={(e) => setAnomalyThreshold(e.target.value)}
                        />
                        <div className="range-labels">
                            <span>🔍 Sensitive</span>
                            <span>🔒 Less Sensitive</span>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="settings-card animate-fade-in delay-200">
                    <h2><FaBell /> Notification Settings</h2>

                    <div className="setting-group">
                        <h3>📢 Alert Notifications</h3>

                        {['Browser Notifications', 'Email Notifications', 'Sound Alerts'].map((label, index) => (
                            <div className="checkbox-setting" key={index}>
                                <input type="checkbox" id={label.replace(' ', '-').toLowerCase()} defaultChecked={index !== 1} />
                                <label htmlFor={label.replace(' ', '-').toLowerCase()}>{label}</label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Configuration */}
                <div className="settings-card animate-fade-in delay-400">
                    <h2><FaDatabase /> System Configuration</h2>

                    <div className="setting-group">
                        <h3>📡 Packet Capture</h3>
                        <div className="input-setting">
                            <label>Capture Interface</label>
                            <select defaultValue="eth0">
                                {['eth0', 'eth1', 'wlan0'].map((iface) => (
                                    <option value={iface} key={iface}>{iface}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="setting-group">
                        <h3>🗂️ Database Settings</h3>
                        <div className="input-setting">
                            <label>Data Retention (days)</label>
                            <input type="number" defaultValue="30" min="1" max="365" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
