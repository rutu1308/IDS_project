import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import '../styles/TrafficChart.css';

const TrafficChart = ({ data, title = "Network Traffic Analysis" }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Helper function to format timestamps
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        if (typeof timestamp === 'string' && isNaN(Number(timestamp))) {
            return timestamp; // Already formatted
        }

        const time = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
        if (!isNaN(time)) {
            const date = new Date(time);
            return !isNaN(date.getTime()) ? date.toTimeString().slice(0, 8) : timestamp;
        }
        return timestamp; // Fallback to original
    };

    useEffect(() => {
        if (!data || !chartRef.current) return;

        // Destroy existing chart to prevent duplicates
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const formattedLabels = data.labels.map((label) => formatTime(label));
        const ctx = chartRef.current.getContext('2d');

        // Create gradient for line fills
        const createGradient = (color) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, `${color}0.5)`);
            gradient.addColorStop(1, `${color}0.05)`);
            return gradient;
        };

        const normalGradient = createGradient('rgba(46, 142, 195, ');
        const anomalousGradient = createGradient('rgba(231, 76, 60, ');

        // Initialize Chart
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedLabels,
                datasets: [
                    {
                        label: 'Normal Traffic',
                        data: data.normalTraffic,
                        borderColor: 'rgba(46, 142, 195, 1)',
                        backgroundColor: normalGradient,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(46, 142, 195, 1)',
                        pointHoverRadius: 6,
                        tension: 0.3,
                        fill: true,
                    },
                    {
                        label: 'Anomalous Traffic',
                        data: data.anomalousTraffic,
                        borderColor: 'rgba(231, 76, 60, 1)',
                        backgroundColor: anomalousGradient,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(231, 76, 60, 1)',
                        pointHoverRadius: 6,
                        tension: 0.3,
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart',
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 20,
                            weight: '600',
                            family: "'Inter', sans-serif",
                        },
                        padding: {
                            top: 10,
                            bottom: 20,
                        },
                        color: '#2c3e50',
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        titleFont: {
                            size: 14,
                            family: "'Inter', sans-serif",
                        },
                        bodyFont: {
                            size: 12,
                            family: "'Inter', sans-serif",
                        },
                        padding: 12,
                        cornerRadius: 8,
                        usePointStyle: true,
                        callbacks: {
                            title: (tooltipItems) =>
                                formatTime(data.labels[tooltipItems[0].dataIndex]),
                            label: (context) =>
                                `${context.dataset.label}: ${context.raw.toLocaleString()} packets`,
                        },
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20,
                            font: {
                                size: 13,
                                family: "'Inter', sans-serif",
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false,
                        },
                        ticks: {
                            padding: 10,
                            callback: (value) => value.toLocaleString(),
                        },
                        title: {
                            display: true,
                            text: 'Packet Count',
                            font: {
                                size: 14,
                                family: "'Inter', sans-serif",
                            },
                        },
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 10,
                        },
                        title: {
                            display: true,
                            text: 'Time',
                            font: {
                                size: 14,
                                family: "'Inter', sans-serif",
                            },
                        },
                    },
                },
            },
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, title]);

    return (
        <div className="chart-card">
            <div className="chart-container">
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default TrafficChart;
