import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { useAuth } from '../context/Context';
import { Dialog } from 'primereact/dialog';
import UserIcon from '../assets/img/user.png'
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export const Header = ({ visible, setVisible, toggleMenu }) => {
    const { user, logout } = useAuth();
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [logoutDialog, setLogoutDialog] = useState(false);

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    const handleLogout = async () => {
        // try {
        //     const response = await fetch('http://localhost:3000/api/logout', {
        //         method: 'GET',
        //         credentials: 'include',
        //     });

        //     if (response.ok) {
        //         console.log('Logout successful');
        //         window.location.href = '/login'; 
        //     } else {
        //         console.error('Logout failed');
        //     }
        // } catch (error) {
        //     console.error('Error during logout:', error);
        // }
        logout()
    };

    const hideLogoutDialog = () => {
        setLogoutDialog(false);
    };

    const logoutDialogFooter = (
        <>
            <Button label="Hủy bỏ" icon="pi pi-times" outlined onClick={hideLogoutDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={handleLogout} />
        </>
    );

    const confirmLogout = () => {
        setLogoutDialog(true);
    };

    return (
        <div className="header">
            <Button icon="pi pi-bars" severity="secondary" text onClick={toggleMenu} />
            <div className="nav-item dropdown">
                <span
                    style={{ cursor: 'pointer' }}
                    onClick={toggleDropdown}
                    className="nav-link dropdown-toggle"
                >
                    <img
                        className="rounded-circle me-lg-2"
                        src={UserIcon}
                        alt=""
                        style={{ width: '40px', height: '40px' }}
                    />
                    <div className="d-none d-lg-inline-flex flex-column">
                        <div style={{ fontSize: '1rem' }}>
                            {user ? user.fullName : 'Khách'}
                        </div>
                        {user && (
                            <span style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '4px' }}>
                                {user.role.role_name}
                            </span>
                        )}
                    </div>
                    <i className={`pi pi-chevron-down ${dropdownVisible ? 'rotate' : ''}`} style={{ marginLeft: '10px' }}></i>
                </span>
                {dropdownVisible && (
                    <div className="dropdown-menu dropdown-menu-end bg-light border-0 rounded-0 rounded-bottom m-0 show">

                        <Link
                            to={`/profile`}
                            className="dropdown-item cursor-pointer"
                        >
                            Hồ sơ
                        </Link>

                        <a onClick={confirmLogout} className="dropdown-item cursor-pointer">Đăng xuất</a>
                        <Dialog visible={logoutDialog} style={{ width: '32rem' }} header="Confirm" modal footer={logoutDialogFooter} onHide={hideLogoutDialog}>
                            <div className="confirmation-content">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {user && <span>Bạn chắc chắn muốn đăng xuất khỏi tài khoản?</span>}
                            </div>
                        </Dialog>
                    </div>
                )}
            </div>
        </div>
    );
};