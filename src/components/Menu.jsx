import React, { useState } from 'react';
import { useAuth } from '../context/Context';
import LogoVLU from '../assets/img/logoVLU.png';
import { Link } from 'react-router-dom';
import FaceIdIcon from '../assets/img/face-id.svg';

export const Menu = ({ visible, activeRoute }) => {
    const { user } = useAuth();
    const [showStatisticsSubmenu, setShowStatisticsSubmenu] = useState(false);

    const toggleStatisticsSubmenu = () => {
        setShowStatisticsSubmenu((prev) => !prev);
    };

    const isSecretary = user?.role?.role_name === 'Thư ký';
    const isLecturer = user?.role?.role_name === 'Giảng viên';
    const isAdmin = user?.role?.role_name === 'Quản trị';
    const isFaculty = user?.role?.role_name === 'Ban chủ nhiệm';

    return (
        <div>
            <style>
                {`
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
                .menu-content, .menu-content a, .menu-content span, .menu-content i {
                    color: #ffffff;
                }
                .menu-content ul li a:hover {
                    background-color: rgba(255, 255, 255, 0.2); 
                    transition: background-color 0.3s ease; 
                }
                .submenu {
                    display: none;
                    padding-left: 20px;
                }

                .submenu.show {
                    display: block;
                }

                .submenu li a {
                    font-size: 0.9rem;
                    padding-left: 25px !important; 
                }
                `}
            </style>
            <div className={`sidebar ${visible ? 'show' : 'hide'} section`}>
                <div className="menu-content">
                    <div className="flex align-items-center justify-content-between px-4 pt-3 flex-shrink-0">
                        <span className="inline-flex align-items-center gap-2">
                            <img src={LogoVLU} alt="logo" width="35" height="35" />
                            <span className="font-semibold text-2xl">VLU-OAM</span>
                        </span>
                    </div>
                    <div className="overflow-y-auto flex-grow">
                        <ul className="list-none p-3 m-0">
                            <li>
                                <ul className="list-none p-0 m-0 overflow-hidden">
                                    <li className={activeRoute === '/dashboard' ? 'active' : ''}>
                                        <Link to='/dashboard'
                                            className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                            <i className="pi pi-home mr-2"></i>
                                            <span className="font-medium">Trang chủ</span>
                                        </Link>
                                    </li>
                                    {isAdmin && (
                                        <li className={activeRoute === '/users' ? 'active' : ''}>
                                            <Link to='/users'
                                                className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                                <i className="pi pi-user mr-2"></i>
                                                <span className="font-medium">Tài khoản</span>
                                            </Link>
                                        </li>
                                    )}
                                    <li className={activeRoute === '/open-attendance' ? 'active' : ''}>
                                        <Link to='/open-attendance'
                                            className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                            <i className="pi pi-calendar mr-2"></i>
                                            <span className="font-medium">Lịch trực</span>
                                        </Link>
                                    </li>
                                    {isLecturer && (
                                        <li className={activeRoute === '/schedule' ? 'active' : ''}>
                                            <Link to='/schedule'
                                                className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                                <i className="pi pi-calendar mr-2"></i>
                                                <span className="font-medium">Lịch trực cá nhân</span>
                                            </Link>
                                        </li>
                                    )}
                                    {(isSecretary || isAdmin) && (
                                        <li className={activeRoute === '/history-schedule' ? 'active' : ''}>
                                            <Link to='/history-schedule'
                                                className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                                <i className="pi pi-calendar mr-2"></i>
                                                <span className="font-medium">Lịch sử trực</span>
                                            </Link>
                                        </li>
                                    )}
                                    {(isLecturer) && (
                                        <li className={activeRoute === '/faceid-register' ? 'active' : ''}>
                                            <Link to='/faceid-register'
                                                className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                                <img
                                                    src={FaceIdIcon}
                                                    alt="Face ID"
                                                    className="mr-2"
                                                    style={{ width: '20px', height: '20px', filter: 'invert(100%)' }} />
                                                <span className="font-medium">Face Id</span>
                                            </Link>
                                        </li>
                                    )}
                                    {(isSecretary || isAdmin) && (
                                        <li className={activeRoute === '/users/images' ? 'active' : ''}>
                                            <Link to='/users/images'
                                                className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                                <i className="pi pi-list mr-2"></i>
                                                <span className="font-medium">Face Id</span>
                                            </Link>
                                        </li>
                                    )}
                                    {(isAdmin) && (
                                        <li className={activeRoute === '/camera' ? 'active' : ''}>
                                            <Link to='/camera'
                                                className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                                <i className="pi pi-calendar mr-2"></i>
                                                <span className="font-medium">Camera</span>
                                            </Link>
                                        </li>
                                    )}
                                    {(isLecturer || isFaculty || isAdmin) && (
                                        <li className={activeRoute === '/request-schedule' ? 'active' : ''}>
                                            <Link to='/request-schedule'
                                                className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                                <i className="pi pi-calendar mr-2"></i>
                                                <span className="font-medium">Yêu cầu</span>
                                            </Link>
                                        </li>
                                    )}
                                    {(!isLecturer) && (
                                        <li>

                                            <div
                                                onClick={toggleStatisticsSubmenu}
                                                className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full"
                                            >
                                                <i className="pi pi-calendar mr-2"></i>
                                                <span className="font-medium">Thống kê</span>
                                                <i
                                                    className={`pi ${showStatisticsSubmenu ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto mr-1`}
                                                ></i>
                                            </div>
                                            <ul className={`submenu ${showStatisticsSubmenu ? 'show' : ''} list-none p-0 m-0`}>
                                                <li className={activeRoute === '/statistics/overall' ? 'active' : ''}>
                                                    <Link to='/statistics/overall'
                                                        className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                                        <i className="pi pi-calendar mr-2"></i>
                                                        <span className="font-medium">Thống kê chung</span>
                                                    </Link>
                                                </li>
                                                <li className={activeRoute === '/statistics/administrative' ? 'active' : ''}>
                                                    <Link to='/statistics/administrative'
                                                        className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                                        <i className="pi pi-calendar mr-2"></i>
                                                        <span className="font-medium">Thống kê hành chính</span>
                                                    </Link>
                                                </li>
                                                <li className={activeRoute === '/statistics/no-checkout' ? 'active' : ''}>
                                                    <Link to='/statistics/no-checkout'
                                                        className="p-ripple flex align-items-center cursor-pointer p-3 border-round transition-duration-150 transition-colors w-full">
                                                        <i className="pi pi-calendar mr-2"></i>
                                                        <span className="font-medium">Thống kê điểm danh</span>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </li>
                                    )}

                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
