import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Reports.css';

const Reports = () => {
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [schedule, setSchedule] = useState('');

    const handleGenerateReport = async () => {
        try {
            setGenerating(true);
            setError(null);

            // Generate report
            const response = await axios.get('http://localhost:5000/generate_report', {
                responseType: 'blob',
                params: { startDate, endDate },
            });

            // Create a download link for the PDF
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'intrusion_report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();

            setGenerating(false);
        } catch (error) {
            console.error('Error generating report:', error);
            setError('Failed to generate report. Please try again.');
            setGenerating(false);
        }
    };

    const handleScheduleChange = (e) => {
        setSchedule(e.target.value);
    };

    const handleSaveSchedule = () => {
        alert(`Report scheduled: ${schedule}`);
    };

    return (
        <div className="reports-page">
            <h1 className="page-title">📊 Security Reports</h1>

            <div className="report-options">

                {/* Network Intrusion Report Card */}
                <div className="report-card animate-fade-in">
                    <h2>📄 Network Intrusion Report</h2>
                    <p>
                        Generate a detailed report of network traffic, detected anomalies, and preventive measures.
                    </p>

                    <div className="date-filters">
                        <div className="date-input">
                            <label>Start Date (Optional)</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="date-input">
                            <label>End Date (Optional)</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        className={`generate-btn ${generating ? 'loading' : ''}`}
                        onClick={handleGenerateReport}
                        disabled={generating}
                    >
                        {generating ? '⏳ Generating...' : '📝 Generate Report'}
                    </button>

                    {error && <p className="error-message">{error}</p>}
                </div>

                {/* Scheduled Reports Card */}
                <div className="report-card animate-fade-in delay-200">
                    <h2>⏰ Scheduled Reports</h2>
                    <p>
                        Automate report generation on a daily, weekly, or monthly basis.
                    </p>

                    <div className="schedule-options">
                        {['daily', 'weekly', 'monthly'].map((option) => (
                            <label key={option} className="schedule-option">
                                <input
                                    type="radio"
                                    value={option}
                                    checked={schedule === option}
                                    onChange={handleScheduleChange}
                                />
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </label>
                        ))}
                    </div>

                    <button className="save-btn" onClick={handleSaveSchedule}>
                        💾 Save Schedule
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Reports;
