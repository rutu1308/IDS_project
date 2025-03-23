import React from 'react';

const StatCard = ({ title, value, icon, color }) => {
    return (
        <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
            <div className="stat-icon" style={{ color }}>
                {icon}
            </div>
            <div className="stat-info">
                <h3>{title}</h3>
                <h2>{value}</h2>
            </div>
        </div>
    );
};

export default StatCard;