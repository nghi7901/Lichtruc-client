import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { useAuth } from '../context/Context';
import UserIcon from '../assets/img/user.png';
import bgLogin from '../assets/img/bg-login.jpg';

import { Button } from 'primereact/button';
import { set } from 'date-fns';

const positions = ['Trưởng khoa', 'Phó khoa', 'Thư ký', 'Giảng viên', 'Trợ lý CTSV Khoa', 'Phụ trách Bộ môn'];

const styles = {
    container: {
        backgroundColor: '#f4f5f7',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '91vh',
    },
    card: {
        width: '100%',
        maxWidth: '600px',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    header: {
        position: 'relative',
        backgroundImage: 'linear-gradient(to right, #ff9a9e, #fad0c4, #fad0c4)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        color: '#000',
        textAlign: 'center',
        padding: '20px',
        overflow: 'hidden',
    },
    headerContent: {
        position: 'relative',
        zIndex: 2
    },
    avatar: {
        width: '80px',
        borderRadius: '50%',
        margin: '10px 0'
    },
    formContainer: {
        padding: '20px'
    },
    formRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '20px',
        gap: '20px'
    },
    formGroup: {
        flex: 1
    },
    input: {
        width: '100%',
        padding: '8px',
        borderRadius: '0.25rem',
        border: '1px solid #ced4da',
        fontSize: '1rem'
    },
    text: {
        color: '#6c757d',
        margin: '5px 0'
    },
    heading: {
        marginBottom: '8px',
        fontWeight: 600
    },
    divider: {
        margin: '15px 0',
        border: 0,
        borderTop: '1px solid #eee'
    }
};

export default function PersonalProfile() {
    const { user, isAuthenticated, setUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState({
        fullName: '',
        email: '',
        codeProfessional: '',
        phoneNumber: '',
        position: ''
    });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            const redirectUrl = encodeURIComponent(location.pathname);
            navigate(`/login?redirect=${redirectUrl}`);
        }
    }, [isAuthenticated, navigate, location.pathname]);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedUser({
            fullName: user.fullName,
            email: user.email,
            codeProfessional: user.codeProfessional,
            phoneNumber: user.phoneNumber,
            position: user.position
        });
    };

    const handleSave = async () => {
        const phoneRegex = /^[0-9]{8,15}$/;
        if (!editedUser.email.trim() || !editedUser.fullName.trim() || (editedUser.phoneNumber.trim() !== '' && !phoneRegex.test(editedUser.phoneNumber))) {
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/users/${user._id}`, {
                credentials: 'include',
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...editedUser,
                    role: user.role.role_name
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            setUser(prevUser => ({
                ...prevUser,
                ...editedUser,
                role: prevUser.role
            }));

            toast.current.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật thông tin thành công',
                life: 3000
            });
        } catch (error) {
            console.error('Error:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Cập nhật thông tin thất bại',
                life: 3000
            });
        }
        setIsEditing(false);
    };

    const [phoneError, setPhoneError] = useState('');
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phoneNumber') {
            const phoneRegex = /^[0-9]{8,15}$/;

            if (value.trim() !== '' && !phoneRegex.test(value)) {
                setPhoneError('Số điện thoại không hợp lệ. Vui lòng nhập từ 8 đến 15 chữ số!');
            } else {
                setPhoneError('');
            }
        }

        setEditedUser(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div style={styles.container}>
            <Toast ref={toast} />
            <div style={styles.card}>
                <div style={{ ...styles.header }}>
                    <div style={styles.headerContent}>
                        <img src={UserIcon} alt="Avatar" style={styles.avatar} />
                        <h5 style={{ margin: '10px 0' }}>{user?.fullName}</h5>
                        <p style={{ margin: '5px 0', opacity: 0.9 }}>{user?.role?.role_name}</p>
                    </div>
                </div>

                <div style={styles.formContainer}>
                    <h4 style={styles.heading}>Thông tin cá nhân</h4>
                    <hr style={styles.divider} />

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <h5 style={styles.heading}>Họ và tên</h5>
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={editedUser.fullName}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                    {submitted && !editedUser.fullName.trim() && (
                                        <small className="p-error">Không để trống trường này!</small>
                                    )}
                                </>
                            ) : (
                                <p style={styles.text}>{user?.fullName}</p>
                            )}
                        </div>
                        <div style={styles.formGroup}>
                            <h5 style={styles.heading}>Email</h5>
                            {isEditing ? (
                                <input
                                    type="email"
                                    name="email"
                                    value={editedUser.email}
                                    onChange={handleChange}
                                    disabled
                                    style={styles.input}
                                />
                            ) : (
                                <p style={styles.text}>{user?.email}</p>
                            )}
                        </div>
                    </div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <h5 style={styles.heading}>Mã CB-GV-NV</h5>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="codeProfessional"
                                    value={editedUser.codeProfessional}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            ) : (
                                <p style={styles.text}>{user?.codeProfessional || 'N/A'}</p>
                            )}
                        </div>
                        <div style={styles.formGroup}>
                            <h5 style={styles.heading}>Số điện thoại</h5>
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={editedUser.phoneNumber}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                    {phoneError && (
                                        <small className="p-error">{phoneError}</small>
                                    )}
                                </>
                            ) : (
                                <p style={styles.text}>{user?.phoneNumber || 'N/A'}</p>
                            )}
                        </div>
                    </div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <h5 style={styles.heading}>Chức vụ</h5>
                            {isEditing ? (
                                <Dropdown
                                    id="position"
                                    value={editedUser.position ?? ''}
                                    options={positions.map(role => ({ label: role, value: role }))}
                                    onChange={(e) => handleChange({ target: { name: 'position', value: e.value } })}
                                    placeholder="Chọn chức vụ"
                                    required
                                />
                            ) : (
                                <p style={styles.text}>{user?.position || 'N/A'}</p>
                            )}
                        </div>
                    </div>

                    <Button label={isEditing ? 'Lưu' : 'Chỉnh sửa'}
                        icon={isEditing ? "pi pi-check" : "pi pi-user-edit"}
                        severity={isEditing ? "success" : "warning"}
                        className='small-button d-flex m-auto'
                        onClick={isEditing ? handleSave : handleEdit} />
                </div>
            </div>
        </div>
    );
}