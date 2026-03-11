import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children, allowedRole }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) return <Navigate to="/login" />;
    if (allowedRole && role !== allowedRole) return <Navigate to="/" />;

    return children;
};

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen">
                <Navbar />
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route
                        path="/patient/*"
                        element={
                            <PrivateRoute allowedRole="patient">
                                <PatientDashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/doctor/*"
                        element={
                            <PrivateRoute allowedRole="dermatologist">
                                <DoctorDashboard />
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
