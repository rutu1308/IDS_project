import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import TrafficChart from '../components/TrafficChart';
import AnomalyDistribution from '../components/AnamolyDistribution';
import ThreatMap from '../components/ThreatMap';
import '../styles/Dashboard.css';
import { FaNetworkWired, FaExclamationTriangle, FaShieldAlt, FaChartLine } from 'react-icons/fa';
import axios from 'axios';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalPackets: 0,
        totalAnomalies: 0,
        anomalyPercentage: 0
    });

    const [trafficData, setTrafficData] = useState({
        labels: [],
        normalTraffic: [],
        anomalousTraffic: []
    });

    const [threatData, setThreatData] = useState([]);
    const [attackDistribution, setAttackDistribution] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch traffic analysis data
        const fetchTrafficAnalysis = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/traffic_analysis');
                setStats({
                    totalPackets: response.data.total_packets,
                    totalAnomalies: response.data.total_anomalies,
                    anomalyPercentage: response.data.anomaly_percentage
                });
            } catch (error) {
                console.error('Error fetching traffic analysis:', error);
            }
        };

        // Fetch threat classification data
        const fetchThreatClassification = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/threat_classification');
                if (response.data.classified_threats) {
                    setThreatData(response.data.classified_threats);

                    // Calculate distribution of attack types
                    const distribution = response.data.classified_threats.reduce((acc, threat) => {
                        acc[threat.threat_type] = (acc[threat.threat_type] || 0) + 1;
                        return acc;
                    }, {});

                    setAttackDistribution(distribution);
                }
            } catch (error) {
                console.error('Error fetching threat classification:', error);
            }
        };

        // Generate mock traffic data for chart demonstration
        const generateMockTrafficData = () => {
            const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
            const normalTraffic = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100) + 20);
            const anomalousTraffic = Array.from({ length: 24 }, () => Math.floor(Math.random() * 20));

            setTrafficData({
                labels,
                normalTraffic,
                anomalousTraffic
            });
        };

        Promise.all([fetchTrafficAnalysis(), fetchThreatClassification()])
            .then(() => {
                setLoading(false);
                generateMockTrafficData();
            });

        // Refresh data every 30 seconds
        const interval = setInterval(() => {
            fetchTrafficAnalysis();
            fetchThreatClassification();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading dashboard data...</p>
            </div>
        );
    }
    

    return (
        <div className="dashboard">
            <h1>Network Security Dashboard</h1>

            <div className="stats-container">
                <StatCard
                    title="Total Packets"
                    value={stats.totalPackets.toLocaleString()}
                    icon={<FaNetworkWired />}
                    color="#3498db"
                />
                <StatCard
                    title="Anomalies Detected"
                    value={stats.totalAnomalies.toLocaleString()}
                    icon={<FaExclamationTriangle />}
                    color="#e74c3c"
                />
                <StatCard
                    title="Anomaly Percentage"
                    value={`${stats.anomalyPercentage}%`}
                    icon={<FaChartLine />}
                    color="#f39c12"
                />
                <StatCard
                    title="Threat Types"
                    value={Object.keys(attackDistribution).length}
                    icon={<FaShieldAlt />}
                    color="#2ecc71"
                />
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card">
                    <h2>Network Traffic</h2>
                    <TrafficChart data={trafficData} />
                </div>
                <div className="dashboard-card">
                    <h2>Attack Distribution</h2>
                    <AnomalyDistribution data={attackDistribution} />
                </div>
            </div>

            <div className="dashboard-row">
                <div className="dashboard-card full-width">
                    <h2>Threat Geographic Distribution</h2>
                    <ThreatMap threatData={threatData} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;