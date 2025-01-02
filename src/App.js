import './index.css';
import './App.css';
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Menu } from './components/Menu';
import User from './pages/User';
import React, { useState, useEffect } from 'react';
import OpenAttendance from './pages/OpenAttendance';
import Login from './pages/Login';
import { useAuth } from './context/Context';
import { Header } from './components/Header';
import Dashboard from './pages/Dashboard';
import PersonalProfile from './pages/PersonalProfile';
import RegisterFace from './pages/RegisterFace';
import Camera from './pages/Camera';
import ProtectedRoute from './context/ProtectedRoute';
import UserFace from './pages/UserFace';
import SchedulerCalendar from './pages/SchedulerCalendar';
import HistoryOnCall from './pages/HistoryOnCall';
import Lockout from './pages/Lockout';
import DetailOpenAttendance from './pages/DetailOpenAttendance';
import RequestSchedule from './pages/RequestSchedule';
import AdministrativeStatistics from './pages/AdministrativeStatistics';
import OverallStatictics from './pages/OverallStatictics';
import LateStatistics from './pages/LateStatistics';

function App() {
    const [visible, setVisible] = useState(true);
    const [activeRoute, setActiveRoute] = useState('/');
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        setActiveRoute(location.pathname);
    }, [location]);

    useEffect(() => {
        if (isAuthenticated && user && !user.isActive) {
            navigate('/lock-out'); 
        }
    }, [isAuthenticated, user, navigate]);

    const toggleMenu = () => {
        setVisible((prev) => !prev);
    };


    const isLoginPage = location.pathname === '/login' 
    const isLockoutPage = location.pathname === '/lock-out';

    return (
        <>
            {!isLoginPage && !isLockoutPage && (
                <div className="layout">
                    <div className={`sidebar ${visible ? 'show' : 'hide'}`}>
                        <Menu visible={visible} activeRoute={activeRoute} />
                    </div>
                    <div className='main-content'>
                        <Header visible={visible} toggleMenu={toggleMenu} />
                        <Routes>
                            <Route path="/dashboard" element={<ProtectedRoute requiredRoles={["Thư ký", "Quản trị", "Ban chủ nhiệm", "Giảng viên"]}><Dashboard /></ProtectedRoute>} />
                            <Route path="/" element={<ProtectedRoute requiredRoles={["Thư ký", "Quản trị", "Ban chủ nhiệm", "Giảng viên"]}><Dashboard /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute requiredRoles={["Thư ký", "Quản trị", "Ban chủ nhiệm", "Giảng viên"]}><PersonalProfile /></ProtectedRoute>} />
                            <Route path="/users" element={<ProtectedRoute requiredRoles={["Quản trị"]}> <User /></ProtectedRoute>} />
                            <Route path="/open-attendance" element={<ProtectedRoute requiredRoles={["Thư ký", "Quản trị", "Ban chủ nhiệm", "Giảng viên"]}><OpenAttendance /></ProtectedRoute>} />
                            <Route path="/faceid-register" element={<ProtectedRoute requiredRoles={["Giảng viên"]}><RegisterFace /></ProtectedRoute>} />
                            <Route path="/users/images" element={<ProtectedRoute requiredRoles={["Thư ký", "Quản trị"]}><UserFace /></ProtectedRoute>} />
                            <Route path="/camera" element={<ProtectedRoute requiredRoles={["Quản trị"]}><Camera /></ProtectedRoute>} />
                            <Route path="/schedule" element={<ProtectedRoute requiredRoles={["Giảng viên"]}><SchedulerCalendar /></ProtectedRoute>} />
                            <Route path="/history-schedule" element={<ProtectedRoute requiredRoles={["Thư ký", "Quản trị"]}><HistoryOnCall /></ProtectedRoute>} />
                            <Route path="/open-attendance/details" element={<ProtectedRoute requiredRoles={["Thư ký", "Quản trị", "Ban chủ nhiệm", "Giảng viên"]}><DetailOpenAttendance /></ProtectedRoute>} />
                            <Route path="/request-schedule" element={<ProtectedRoute requiredRoles={["Giảng viên", "Ban chủ nhiệm", "Quản trị"]}><RequestSchedule /></ProtectedRoute>} />
                            <Route path="/statistics/overall" element={<ProtectedRoute requiredRoles={["Thư ký", "Quản trị", "Ban chủ nhiệm"]}><OverallStatictics /></ProtectedRoute>} />
                            <Route path="/statistics/administrative" element={<ProtectedRoute requiredRoles={["Thư ký", "Quản trị", "Ban chủ nhiệm"]}><AdministrativeStatistics /></ProtectedRoute>} />
                            <Route path="/statistics/no-checkout" element={<ProtectedRoute requiredRoles={["Thư ký", "Quản trị", "Ban chủ nhiệm"]}><LateStatistics /></ProtectedRoute>} />
                        </Routes>
                    </div>
                </div>
            )}

            {isLockoutPage && (
                <div className="lockout-layout">
                    <Header visible={true} toggleMenu={toggleMenu} />
                    <Routes>
                        <Route path="/lock-out" element={<Lockout />} />
                    </Routes>
                </div>
            )}

            {isLoginPage && (
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            )}
        </>
    );
}

export default App;
