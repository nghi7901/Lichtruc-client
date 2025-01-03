import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './Context';
import axios from 'axios';

const ProtectedRoute = ({ children, requiredRoles }) => {
    const { isAuthenticated, setIsAuthenticated, setUser, user } = useAuth();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(!isAuthenticated);

    const fetchUserData = async (token) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                withCredentials: true,
            });
            if (response.status === 200) {
                const userData = response.data.user;
                setUser(userData);
                setIsAuthenticated(true);
                sessionStorage.setItem('user', JSON.stringify(userData));
                sessionStorage.setItem('isAuthenticated', 'true');
                sessionStorage.setItem('accessToken', token); 
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');

        if (token) {
            fetchUserData(token);
        } else {
            const storedUser = sessionStorage.getItem('user');
            const storedIsAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
            const storedToken = sessionStorage.getItem('accessToken');

            if (storedIsAuthenticated && storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
                setIsLoading(false);
            } else if (!isAuthenticated) {
                setIsLoading(false);
            }
        }
    }, [isAuthenticated, setIsAuthenticated, setUser, location.search]);

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
