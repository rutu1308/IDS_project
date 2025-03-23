import React from 'react';
import '../styles/PacketTable.css';

const PacketTable = ({ packets, loading }) => {
    if (loading) {
        return <div className="loading">Loading packets...</div>;
    }

    return (
        <div className="packet-table-container">
            <table className="packet-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Source IP</th>
                        <th>Destination IP</th>
                        <th>Src Port</th>
                        <th>Dst Port</th>
                        <th>Protocol</th>
                        <th>Anomaly</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {packets.length > 0 ? (
                        packets.map((packet, index) => (
                            <tr key={index} className={packet.anomaly === "Yes" ? "anomaly-row" : ""}>
                                <td>{new Date(packet.timestamp).toLocaleString()}</td>
                                <td>{packet.src_ip}</td>
                                <td>{packet.dst_ip}</td>
                                <td>{packet.src_port}</td>
                                <td>{packet.dst_port}</td>
                                <td>{packet.protocol}</td>
                                <td className={packet.anomaly === "Yes" ? "anomaly-cell" : "normal-cell"}>
                                    {packet.anomaly}
                                </td>
                                <td>{packet.anomaly_score ? packet.anomaly_score.toFixed(2) : "N/A"}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="no-data">No packets found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PacketTable;