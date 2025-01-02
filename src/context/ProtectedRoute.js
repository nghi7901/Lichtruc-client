import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Context';

const ProtectedRoute = ({ children, requiredRoles }) => {
    const { isAuthenticated, setIsAuthenticated, setUser, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(!isAuthenticated);
    
    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/user`, { withCredentials: true });
            if (response.status === 200) {
                const userData = response.data.user;
                setUser(userData); // Cập nhật context
                setIsAuthenticated(true); // Cập nhật trạng thái
                sessionStorage.setItem('user', JSON.stringify(userData)); // Lưu vào sessionStorage
                sessionStorage.setItem('isAuthenticated', 'true');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false); 
        }
    };

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        const storedIsAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';

        if (storedIsAuthenticated && storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
            setIsLoading(false); 
        } else if (!isAuthenticated) {
            fetchUserData();
        }
    }, [isAuthenticated, setIsAuthenticated, setUser]);

    if (isLoading) {
        return <div>Loading...</div>; 
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    
    if (requiredRoles && !requiredRoles.includes(user?.role?.role_name)) {
        return <Navigate to="/dashboard" />;
    }
    
    return children;
};

export default ProtectedRoute;
