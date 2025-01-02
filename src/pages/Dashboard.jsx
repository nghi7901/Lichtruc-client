import React, { useEffect } from 'react';
import useDocumentTitle from '../config/useDocumentTitle';
import axios from 'axios';
import Clock from '../components/Clock';
import BgVideo from '../assets/img/file.mp4'
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Context';

const Dashboard = () => {
    useDocumentTitle('Trang chủ');
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });
            if (response.status === 200) {
                localStorage.getItem('user');
                localStorage.getItem('isAuthenticated');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/dashboard';
            navigate(redirectUrl);
        } else {
            fetchUserData()
        }
    }, [isAuthenticated, navigate]);

    return (
        <div style={{ position: 'relative', height: 'calc(100vh - 60px)' }}>
            <video
                className="home-video"
                autoPlay
                loop
                muted
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                }}
            >
                <source src={BgVideo} type="video/mp4" />
            </video>
            <div
                style={{
                    backgroundColor: 'rgba(8, 45, 72, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: '600px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: 'white'
                    }}
                >
                    <h3>HỆ THỐNG QUẢN LÝ LỊCH TRỰC VÀ ĐI LÀM</h3>
                    <h3>KHOA CÔNG NGHỆ THÔNG TIN - TRƯỜNG ĐẠI HỌC VĂN LANG</h3>
                    <h1>XIN CHÀO</h1>
                    <h2>CHÚC BẠN MỘT NGÀY LÀM VIỆC TỐT LÀNH.</h2>
                    <Clock />
                </div>
            </div>
        </div>

    );
};

export default Dashboard;
