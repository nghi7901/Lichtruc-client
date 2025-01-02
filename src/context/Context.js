import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

// Create Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null); 
    const [accessToken, setAccessToken] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedIsAuthenticated = localStorage.getItem('isAuthenticated');
        
        if (storedUser && storedIsAuthenticated === 'true') {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
            setAccessToken(JSON.parse(storedUser).accessToken);
        }
    }, []);

    const login = async (credentials) => {
        const redirectUrl = encodeURIComponent(location.state?.from || '/dashboard');
        window.location.href = `${process.env.REACT_APP_SERVER_URL}/auth?redirect=${redirectUrl}`;
        try {
            const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/auth/callback`, credentials, { withCredentials: true });
            const userData = response.data.user;
            if (userData.isActive) {
                setIsAuthenticated(true);
                setUser(userData);
                setAccessToken(userData.accessToken)

                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('accessToken', JSON.stringify(userData).accessToken);

                window.location.href = redirectUrl; 
            } else {
                navigate('/lockout');
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const logout = async () => {
        await axios.get(`${process.env.REACT_APP_SERVER_URL}/logout`, { withCredentials: true });
        setIsAuthenticated(false);
        setUser(null);
        setAccessToken(null);

        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('accessToken');

        window.location.href = '/login'; 
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, setIsAuthenticated, setUser, accessToken, setAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    return useContext(AuthContext);
};