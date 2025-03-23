import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Nav, Container, Badge, Dropdown } from 'react-bootstrap';
import { FaBell, FaChartBar, FaList, FaCog, FaFileAlt } from 'react-icons/fa';
import '../styles/Navbar.css'; // Custom styling

const IDSNavbar = ({ notifications }) => {
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <Navbar expand="lg" bg="dark" variant="dark" sticky="top" className="custom-navbar">
            <Container>
                {/* Logo & Home Link */}
                <Navbar.Brand as={Link} to="/" className="logo-text">
                    IDS Dashboard
                </Navbar.Brand>

                {/* Toggle Button for Mobile View */}
                <Navbar.Toggle aria-controls="navbar-nav" />

                <Navbar.Collapse id="navbar-nav">
                    <Nav className="ms-auto nav-links">
                        <Nav.Link as={Link} to="/">
                            <FaChartBar className="nav-icon" /> Dashboard
                        </Nav.Link>
                        <Nav.Link as={Link} to="/packets">
                            <FaList className="nav-icon" /> Packet Log
                        </Nav.Link>
                        <Nav.Link as={Link} to="/reports">
                            <FaFileAlt className="nav-icon" /> Reports
                        </Nav.Link>
                        <Nav.Link as={Link} to="/settings">
                            <FaCog className="nav-icon" /> Settings
                        </Nav.Link>

                        {/* Notifications Dropdown */}
                        <Dropdown
                            align="end"
                            show={showDropdown}
                            onToggle={(isOpen) => setShowDropdown(isOpen)}
                        >
                            <Dropdown.Toggle variant="link" className="notification-btn">
                                <FaBell className="nav-icon" />
                                {notifications.length > 0 && (
                                    <Badge bg="danger" className="notification-badge">
                                        {notifications.length}
                                    </Badge>
                                )}
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="notification-dropdown">
                                <Dropdown.Header>Recent Alerts</Dropdown.Header>

                                {notifications.length > 0 ? (
                                    notifications.slice(0, 5).map((notification, index) => (
                                        <Dropdown.Item key={index} className="notification-item">
                                            {notification.message}
                                        </Dropdown.Item>
                                    ))
                                ) : (
                                    <Dropdown.Item disabled>No new alerts</Dropdown.Item>
                                )}

                                <Dropdown.Divider />
                                <Dropdown.Item as={Link} to="/notifications">
                                    View All Alerts
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default IDSNavbar;
