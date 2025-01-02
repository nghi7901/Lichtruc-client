import React, { useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Context';
import LogoVLU from  '../assets/img/logoVLU.png'
import bgLogin from '../assets/img/bg-login.jpg';
import useDocumentTitle from '../config/useDocumentTitle';

const Login = () => {
    useDocumentTitle('Đăng nhập');
    const { isAuthenticated, setIsAuthenticated, setUser, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = () => {
        login()
        
    };

    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/user`, { withCredentials: true });
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
            fetchUserData();
        }
    }, [isAuthenticated, navigate]);

    
    const styles = {
        section: {
            padding: '2rem 0',
            backgroundSize: 'cover',
            position: 'relative',
            display: 'grid',
            alignItems: 'center',
            minHeight: '100vh',
            zIndex: 0,
            textAlign: 'center',
            backgroundImage: `url(${bgLogin})`,
        },
        image: {
            margin: '0 auto',
            width: '100px',
            padding: '30px 0',
        },
    };
    return (
        <div>
            <style>
                {`
                body,
                html {
                    margin: 0;
                    padding: 0;
                    font-family: "Roboto", "Helvetica Neue", Arial, sans-serif;
                    font-weight: 400;
                }

                * {
                    box-sizing: border-box;
                }

                .d-grid {
                    display: grid;
                }

                .d-flex {
                    display: flex;
                    display: -webkit-flex;
                }

                .text-center {
                    text-align: center;
                }

                .text-left {
                    text-align: left;
                }

                .text-right {
                    text-align: right;
                }

                button,
                input,
                select {
                    -webkit-appearance: none;
                    outline: none;
                }

                button,
                .btn,
                select {
                    cursor: pointer;
                }

                .title-login {
                    color: white;
                }

                .title-login-page {
                    color: #5d171c;
                    font-size: 30px;
                }

                .btn,
                button,
                .actionbg,
                input {
                    border-radius: 4px;
                }

                .btn:hover,
                button:hover {
                    transition: 0.5s ease;
                }

                /*--/wrapper--*/
                .wrapper {
                    width: 100%;
                    padding-right: 15px;
                    padding-left: 15px;
                    margin-right: auto;
                    margin-left: auto;
                }

                @media (min-width: 576px) {
                    .wrapper {
                        max-width: 540px;
                    }
                }

                @media (min-width: 768px) {
                    .wrapper {
                        max-width: 720px;
                    }
                }

                @media (min-width: 992px) {
                    .wrapper {
                        max-width: 960px;
                    }
                }

                @media (min-width: 1200px) {
                    .wrapper {
                        max-width: 1140px;
                    }
                }

                .wrapper-full {
                    width: 100%;
                    padding-right: 15px;
                    padding-left: 15px;
                    margin-right: auto;
                    margin-left: auto;
                }

                /*--//wrapper--*/
                /*-- login --*/
                .main-content h1 {
                    margin-bottom: 40px;
                    font-size: 40px;
                    color: #fff;
                    margin-top: -15px;
                }

                .section {
                    padding: 2rem 0;
                    background-size: cover;
                    position: relative;
                    display: grid;
                    align-items: center;
                    min-height: 100vh;
                    z-index: 0;
                    text-align: center;
                }

                .section:before {
                    content: "";
                    background: rgba(107, 25, 45, 0.4);
                    position: absolute;
                    top: 0;
                    min-height: 100%;
                    left: 0;
                    right: 0;
                    z-index: -1;
                }

                .main-content .login-form {
                    background: rgba(0, 0, 0, .6);
                    box-shadow: 0 10px 30px 0 rgba(17, 17, 17, 0.09);
                    margin: 0 auto;
                    max-width: 430px;
                    text-align: center;
                    border-radius: 0 0 6px 6px;
                }

                .main-content .login-form h6 {
                    font-size: 24px;
                    line-height: 30px;
                    color: #fff;
                    padding-top: 5em;
                    padding-bottom: 2em;
                }

                .main-content .login-form form .input-form {
                    font-size: 16px;
                    border: none;
                    width: 100%;
                    padding: 15px 15px;
                    margin-bottom: 12px;
                    border: 1px solid #dedddd;
                    outline: none;
                    background: transparent;
                }

                .main-content .login-form form .input-form:focus {
                    background: rgba(43, 32, 34, 0.09);
                    border: 1px solid #2B2022;
                }

                .main-content .login-form p {
                    margin-top: 20px;
                    font-size: 16px;
                    font-weight: normal;
                }

                .main-content .btn.loginhny-btn {
                    width: 100%;
                    padding: 20px 120px;
                    color: #fff;
                    font-size: 18px;
                    text-decoration: none;
                    display: inline-block;
                    text-align: center;
                    font-weight: 600;
                    line-height: 24px;
                    text-transform: uppercase;
                    border: none;
                    background: #d51c29;
                    border-radius: 4px;
                    margin-top: 12px;
                }

                .main-content .first-look {
                    border-radius: 50%;
                    margin: 0 auto;
                    background: #fff;
                    width: 60px;
                    height: 60px;
                    border: 4px solid rgba(99, 85, 87, 0.19);
                }

                .main-content .first-look img {
                    margin-top: 12px;
                    text-align: center;
                }

                .main-content .bottom-content {
                    padding: 0 35px 30px;
                }

                .main-content .speci-login {
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: -30px;
                }

                .main-content .login-form h6 {
                    font-size: 24px;
                    line-height: 30px;
                    color: #fff;
                    padding-top: 5em;
                    padding-bottom: 2em;
                }

                .main-content .login-form h6.sec-one {
                    padding-top: 5em;
                    padding-bottom: 2.8em;
                    margin-bottom: 1em;
                }

                /*/copy-right*/
                .copy-right.text-center {
                    margin-top: 2em;
                }

                .copy-right p {
                    font-size: 18px;
                    line-height: 29px;
                    color: #fff;
                }

                .copy-right p a {
                    color: #bd783a;
                }

                .copy-right p a:hover {
                    color: #fff;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }

                @media all and (max-width: 667px) {
                    .main-content h1 {
                        font-size: 32px;
                    }
                }

                @media all and (max-width: 440px) {
                    .main-content .login-form h6 {
                        padding-top: 4em;
                    }

                    .main-content h1 {
                        font-size: 30px;
                    }
                }

                @media all and (max-width: 410px) {
                    .main-content .login-form h6.sec-one {
                        padding-top: 3.5em;
                    }

                    .main-content .bottom-content {
                        padding: 35px 20px;
                    }
                }
                `}
            </style>
            <section className="section" style={styles.section}>
                <div className="main-content">
                    <div className="wrapper">
                        <h2 className="title-login-page">TRANG QUẢN LÝ</h2>
                        <h1>LỊCH TRỰC KHOA CÔNG NGHỆ THÔNG TIN</h1>
                        <div className="d-grid">
                            <div className="login-form">
                                <div className="main-bg">
                                    <img src={LogoVLU} style={{ margin: '0 auto', width: '100px', padding: '30px 0' }} />
                                    <h3 className="title-login">Đăng nhập với tài khoản Văn Lang</h3>
                                </div>
                                <div className="bottom-content">
                                    <a className="loginhny-btn btn" onClick={handleLogin}>Đăng nhập</a>
                                </div>
                            </div>
                        </div>
                        <div className="copy-right text-center">
                            <p>
                                &copy; 2024 - Bản Quyền Thuộc Khoa Công nghệ thông tin, Trường Đại Học Văn Lang.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Login;