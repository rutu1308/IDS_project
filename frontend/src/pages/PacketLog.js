import React, { useState, useEffect } from 'react';
import PacketTable from '../components/PacketTable';
import axios from 'axios';
import '../styles/PacketLog.css'; // Import the CSS file
import { FiRefreshCw } from 'react-icons/fi'; // Optional: for refresh icon

const PacketLog = () => {
    const [packets, setPackets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'normal', 'anomaly'
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchPackets = async () => {
        try {
            setRefreshing(true);
            const response = await axios.get('http://localhost:5000/api/packets');
            setPackets(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching packets:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPackets();

        // Refresh data every 10 seconds
        const interval = setInterval(fetchPackets, 10000);
        return () => clearInterval(interval);
    }, []);

    const filteredPackets = packets.filter(packet => {
        // Filter by anomaly status
        if (filter === 'normal' && packet.anomaly === 'Yes') return false;
        if (filter === 'anomaly' && packet.anomaly === 'No') return false;

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                packet.src_ip?.toLowerCase().includes(term) ||
                packet.dst_ip?.toLowerCase().includes(term) ||
                packet.src_port?.toString().includes(term) ||
                packet.dst_port?.toString().includes(term) ||
                packet.protocol?.toLowerCase().includes(term)
            );
        }

        return true;
    });

    const handleManualRefresh = () => {
        fetchPackets();
    };

    return (
        <div className="packet-log">
            <h1>
                Network Traffic Monitor
                {refreshing && <span className="refresh-icon"><FiRefreshCw size={18} /></span>}
            </h1>

            <div className="filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by IP, port or protocol..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-buttons">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        All Packets
                    </button>
                    <button
                        className={filter === 'normal' ? 'active' : ''}
                        onClick={() => setFilter('normal')}
                    >
                        Normal Traffic
                    </button>
                    <button
                        className={filter === 'anomaly' ? 'active' : ''}
                        onClick={() => setFilter('anomaly')}
                    >
                        Anomalies Only
                    </button>
                    <button onClick={handleManualRefresh}>
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-indicator">
                    <p>Loading packet data...</p>
                </div>
            ) : filteredPackets.length === 0 ? (
                <div className="empty-state">
                    <p>No packets found matching your criteria.</p>
                    <button onClick={handleManualRefresh}>Refresh Data</button>
                </div>
            ) : (
                <PacketTable packets={filteredPackets} />
            )}
        </div>
    );
};

export default PacketLog;