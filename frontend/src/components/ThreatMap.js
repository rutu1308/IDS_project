import React, { useEffect, useRef } from 'react';

const ThreatMap = ({ threatData }) => {
    const mapRef = useRef(null);

    useEffect(() => {
        if (!threatData || !mapRef.current) return;

        // In a real implementation, you would initialize a map library here
        // such as Leaflet.js or Google Maps to display the threat data geographically
        // For now, we'll just display a placeholder message

        const mapContainer = mapRef.current;
        mapContainer.innerHTML = `
      <div class="placeholder-map">
        <h3>Threat Map Visualization</h3>
        <p>Geographic visualization of ${threatData.length} detected threats</p>
        <p>A real implementation would use a mapping library to display threats by location</p>
      </div>
    `;
    }, [threatData]);

    return (
        <div className="threat-map" ref={mapRef} style={{ height: '300px', background: '#f5f5f5', borderRadius: '8px' }}>
            <div className="loading">Loading threat map...</div>
        </div>
    );
};

export default ThreatMap;