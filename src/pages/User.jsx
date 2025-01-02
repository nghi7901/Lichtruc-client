import React, { useState, useEffect, useRef } from 'react';
import { classNames } from 'primereact/utils';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { UserService } from '../service/UserService';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { FilterMatchMode } from 'primereact/api';
import { Toolbar } from 'primereact/toolbar';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { format } from 'date-fns'
import { useAuth } from "../context/Context";
import { useLocation, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../config/useDocumentTitle';

const User = () => {
    useDocumentTitle('Quản lý phân quyền tài khoản');

    let emptyUser = {
        email: '',
        fullName: '',
        role: { role_name: '' },
        isActive: true,
        phoneNumber: '',
        position: '',
    };

    const [isEditing, setIsEditing] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        if (!isAuthenticated) {
            const redirectUrl = encodeURIComponent(location.pathname);
            navigate(`/login?redirect=${redirectUrl}`);
        }
    }, [isAuthenticated, navigate, location.pathname]);

    const [users, setUsers] = useState(null);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [userDialog, setUserDialog] = useState(false);
    const [deleteUserDialog, setDeleteUserDialog] = useState(false);
    const [newUser, setNewUser] = useState(emptyUser);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);
    const toast = useRef(null);
    const dt = useRef(null);
    const [roleFilter, setRoleFilter] = useState('');
    const [viewDialog, setViewDialog] = useState(false);

    const [roles] = useState(['Quản trị', 'Giảng viên', 'Ban chủ nhiệm', 'Thư ký', 'Người dùng']);
    const [positions] = useState(['Trưởng khoa', 'Phó khoa', 'Thư ký', 'Giảng viên', 'Trợ lý CTSV Khoa', 'Phụ trách Bộ môn']);
    const [statuses] = useState([
        { label: 'Vô hiệu hóa', value: false },
        { label: 'Đã kích hoạt', value: true }
    ]);
    const [filters, setFilters] = useState({
        'role.role_name': { value: null, matchMode: FilterMatchMode.EQUALS },
    });
    const [globalFilterValue, setGlobalFilterValue] = useState('');



    useEffect(() => {
        if (isAuthenticated) {
            UserService.getUsers().then((data) => {
                setUsers(data)
                setFilteredUsers(data);
            });
        }
    }, [isAuthenticated]);


    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };

        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const handleStatusChange = async (rowData, newStatus) => {

        const userData = {
            fullName: rowData.fullName,
            role: rowData.role.role_name,
            isActive: newStatus
        };
        console.log('Dữ liệu gửi đi:', userData);

        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/users/${rowData._id}`, {
                credentials: 'include',
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const result = await response.json();
            setUsers((prevUsers) => {
                const updatedUsers = prevUsers.map((u) => (u._id === result._id ? result : u));
                setFilteredUsers(updatedUsers);
                return updatedUsers;
            });
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Tài khoản đã được cập nhật', life: 3000 });
            setUserDialog(false);
            setNewUser(emptyUser);

        } catch (error) {
            console.error('Error:', error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể cập nhật tài khoản', life: 3000 });
        }
    }

    const updateUser = async () => {
        setSubmitted(true);

        if (
            !newUser.email.trim() ||
            !newUser.fullName.trim() ||
            !newUser.role?.role_name ||
            !newUser.position
        ) {
            return;
        }

        const userData = {
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role.role_name,
            isActive: newUser.isActive,
            phoneNumber: newUser.phoneNumber,
            codeProfessional: newUser.codeProfessional,
            position: newUser.position,
        };

        try {

            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/users/${newUser._id}`, {
                credentials: 'include',
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (response.status === 409) {
                const errorData = await response.json();
                toast.current.show({ severity: 'error', summary: 'Lỗi', detail: errorData.message, life: 3000 });
                return;
            }
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            setUsers((prevUsers) => {
                const updatedUsers = prevUsers
                    .map((u) => (u._id === result._id ? result : u))
                    .filter((u) => u._id !== result._id);
                updatedUsers.unshift(result);
                setFilteredUsers(updatedUsers);
                return updatedUsers;
            });
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Người dùng đã được cập nhật', life: 3000 });

            setUserDialog(false);
            setNewUser(emptyUser);
        } catch (error) {
            console.error('Error:', error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể cập nhật người dùng', life: 3000 });
        }
    };

    const openDialogForEdit = (userToEdit) => {
        setNewUser(userToEdit);
        setIsEditing(true);
        setUserDialog(true);
    };

    const openDialogForAdd = () => {
        setNewUser(emptyUser);
        setIsEditing(false);
        setUserDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setUserDialog(false);
    };

    const hideViewDialog = () => {
        setViewDialog(false);
    };

    const hideDeleteUserDialog = () => {
        setDeleteUserDialog(false);
    };

    const saveUser = async () => {
        setSubmitted(true);

        const phoneRegex = /^[0-9]{8,15}$/;
        if (
            !newUser.email.trim() ||
            !newUser.fullName.trim() ||
            !newUser.role?.role_name ||
            !newUser.position || 
            (newUser.phoneNumber.trim() && !phoneRegex.test(newUser.phoneNumber))
        ) {
            setSubmitted(false);
            return;
            
        }

        const userData = {
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role.role_name,
            codeProfessional: newUser.codeProfessional,
            phoneNumber: newUser.phoneNumber,
            position: newUser.position,
        };

        try {
            let response;

            response = await fetch(`${process.env.REACT_APP_SERVER_URL}/users`, {
                credentials: 'include',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (response.status === 409) {
                const errorData = await response.json();
                toast.current.show({ severity: 'error', summary: 'Lỗi', detail: errorData.message, life: 3000 });
                return;
            }

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            setUsers((prevUsers) => {
                const updatedUsers = [result, ...prevUsers];
                setFilteredUsers(updatedUsers);
                return updatedUsers;
            });
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Tài khoản đã được tạo', life: 3000 });

            setUserDialog(false);
            setNewUser(emptyUser);
        } catch (error) {
            console.error('Error:', error);
        }

    };

    const confirmDeleteUser = (user) => {
        setNewUser(user);
        setDeleteUserDialog(true);
    };

    const deleteUser = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/users/${newUser._id}`, {
                credentials: 'include',
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            setUsers((prevUsers) => {
                const updatedUsers = prevUsers.filter(us => us._id !== newUser._id);
                setFilteredUsers(updatedUsers);
                return updatedUsers;
            });
            setDeleteUserDialog(false);
            setNewUser(emptyUser);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Tài khoản đã bị xóa khỏi hệ thống', life: 3000 });

        } catch (error) {
            console.error('Error:', error);
        }
    };

    const exportCSV = () => {
        dt.current.exportCSV();
    };

    const RoleFilter = ({ options, onChange, value }) => {
        return (
            <Dropdown
                options={options.map(role => ({ label: role, value: role }))}
                onChange={(e) => onChange(e.value)}
                placeholder="Lọc theo vai trò"
                value={value}
            />
        );
    };

    const handleRoleFilterChange = (value) => {
        setRoleFilter(value);
        const newData = users.filter(item => {
            return value ? item.role.role_name === value : true; // Nếu không có vai trò, hiển thị tất cả
        });
        setFilteredUsers(newData);
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <span className="text-xl text-900 font-bold">Tài khoản</span>
            <div>
                <RoleFilter
                    options={roles}
                    onChange={handleRoleFilterChange}
                    value={roleFilter}
                />
                &nbsp;&nbsp;
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Nhập từ khóa tìm kiếm" />
            </div>
        </div>
    );

    const userDialogFooter = (
        <>
            <Button label="Hủy bỏ" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" severity="success" onClick={isEditing ? updateUser : saveUser} />
        </>
    );

    const viewDialogFooter = (
        <>
            <Button label="Đóng" icon="pi pi-times" outlined onClick={hideViewDialog} />
        </>
    );

    const deleteUserDialogFooter = (
        <>
            <Button label="Hủy bỏ" icon="pi pi-times" outlined onClick={hideDeleteUserDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={deleteUser} />
        </>
    );
    const openDialogForDetails = (userToView) => {
        setNewUser(userToView);
        setViewDialog(true);
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button
                    label="Chi tiết"
                    icon="pi pi-eye"
                    severity="primary"
                    onClick={() => openDialogForDetails(rowData)}
                    className="small-button"
                />
                &nbsp;
                {user?._id !== rowData._id && (
                    <>
                        <Button
                            label="Cập nhật"
                            icon="pi pi-user-edit"
                            severity="warning"
                            onClick={() => openDialogForEdit(rowData)}
                            className="small-button"
                        />
                        &nbsp;
                        <Button
                            label="Xóa"
                            icon="pi pi-trash"
                            severity="danger"
                            onClick={() => confirmDeleteUser(rowData)}
                            className="small-button"
                        />
                    </>
                )}
            </React.Fragment>
        );
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="Thêm mới" icon="pi pi-plus" severity="success" onClick={openDialogForAdd} />
            </div>
        );
    };

    const rightToolbarTemplate = () => {
    };

    const getStatus = (val) => {
        switch (val) {
            case true:
                return 'success';
            case false:
                return 'danger';

            default:
                return null;
        }
    };

    const statusBodyTemplate = (rowData) => {
        const isDisabled = user?._id === rowData._id;
        return <Dropdown
            value={rowData.isActive}
            options={[
                { label: 'Đã kích hoạt', value: true },
                { label: 'Vô hiệu hóa', value: false }
            ]}
            severity={getStatus(rowData.isActive)}
            onChange={(e) => handleStatusChange(rowData, e.value)}
            placeholder="Chọn trạng thái"
            disabled={isDisabled}
        />
    };


    return (
        <div>
            <Toast ref={toast} />
            <div className="card">
                <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

                <DataTable ref={dt} value={filteredUsers}
                    dataKey="id" paginator rows={5} rowsPerPageOptions={[5, 10, 25]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Hiển thị {first} tới {last} trong tổng số {totalRecords} tài khoản"
                    globalFilter={globalFilter} header={header}
                    emptyMessage="Không có dữ liệu"
                >
                    <Column field="email" header="Email" sortable style={{ minWidth: '12rem', fontSize: '0.9rem' }}
                    ></Column>
                    <Column field="fullName" header="Họ và tên" sortable style={{ minWidth: '12rem', fontSize: '0.9rem' }}
                    ></Column>
                    <Column field="role.role_name" header="Vai trò"
                        style={{ minWidth: '10rem', fontSize: '0.9rem' }}
                    ></Column>
                    <Column field="isActive" header="Trạng thái" body={statusBodyTemplate} style={{ minWidth: '12rem' }}
                    ></Column>
                    <Column field="lastAccessed" header="Lần truy cập cuối" style={{ fontSize: '0.9rem' }}
                        body={(rowData) => {
                            if (rowData.lastAccessed === "N/A") {
                                return <span>Chưa bao giờ</span>;
                            }
                            const date = new Date(rowData.lastAccessed);
                            return format(date, 'dd-MM-yyyy');
                        }} ></Column>

                    <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                </DataTable>
            </div>

            <Dialog visible={userDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Thông tin tài khoản" modal className="p-fluid"
                footer={userDialogFooter} onHide={hideDialog}>
                <div className="field">
                    <label htmlFor="username" className="font-bold">Email</label>
                    <InputText id="username" value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required autoFocus
                        className={classNames({ 'p-invalid': submitted && !newUser.email })}
                        disabled={isEditing ? true : false} />
                    {submitted && !newUser.email.trim() && <small className="p-error">Không để trống trường này!</small>}
                </div>
                <div className="field">
                    <label htmlFor="name" className="font-bold">Họ và tên</label>
                    <InputText id="name" value={newUser.fullName}
                        required
                        onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} />
                    {submitted && !(newUser.fullName.trim()) && <small className="p-error">Không để trống trường này!</small>}
                </div>
                <div className="field">
                    <label htmlFor="role" className="font-bold">Vai trò</label>
                    <Dropdown
                        id="role"
                        value={newUser.role?.role_name ?? ''}
                        options={roles.map(role => ({ label: role, value: role }))}
                        onChange={(e) => setNewUser({ ...newUser, role: { role_name: e.value } })}
                        placeholder="Chọn vai trò"
                        required
                    />
                    {submitted && !(newUser.role?.role_name) && <small className="p-error">Vui lòng chọn vai trò của người dùng trong hệ thống</small>}
                </div>
                <div className="field">
                    <label htmlFor="codeProfessional" className="font-bold">Mã CB-GV-NV</label>
                    <InputText id="codeProfessional" value={newUser.codeProfessional} onChange={(e) => setNewUser({ ...newUser, codeProfessional: e.target.value })} required />
                </div>
                <div className="field">
                    <label htmlFor="phoneNumber" className="font-bold">Số điện thoại</label>
                    <InputText id="phoneNumber" value={newUser.phoneNumber} onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })} required />
                    {submitted && (newUser.phoneNumber.trim() && !/^[0-9]{8,15}$/.test(newUser.phoneNumber)) && <small className="p-error">Số điện thoại không hợp lệ. Vui lòng nhập từ 8 đến 15 chữ số! </small>}
                </div>
                <div className="field">
                    <label htmlFor="position" className="font-bold" required>Chức vụ</label>
                    <Dropdown
                        id="position"
                        value={newUser.position ?? ''}
                        options={positions.map(role => ({ label: role, value: role }))}
                        onChange={(e) => setNewUser({ ...newUser, position: e.value })}
                        placeholder="Chọn chức vụ"
                        required
                    />
                    {submitted && !(newUser.position) && <small className="p-error">Vui lòng chọn vai trò của người dùng trong hệ thống</small>}
                </div>
            </Dialog>

            <Dialog visible={deleteUserDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={deleteUserDialogFooter} onHide={hideDeleteUserDialog}>
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {newUser && <span>Bạn chắc chắn muốn xóa tài khoản <b>{newUser.email}</b>?</span>}
                </div>
            </Dialog>

            <style>
                {`
                .user-profile-container {
                    display: flex;
                    justify-content: center;
                    padding: 1.75rem;
                    }

                .user-profile-card {
                width: 100%;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                background-color: #fff;
                }

                .user-profile-body {
                padding: 1.25rem;
                }

                .user-profile-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 1.5rem;
                }

                .user-profile-label {
                font-weight: bold;
                }

                .user-profile-value {
                color: #6c757d; /* Màu xám cho giá trị */
                }
                `}
            </style>
            <Dialog
                visible={viewDialog}
                style={{ width: '40rem' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Thông tin tài khoản"
                modal
                className="p-fluid"
                footer={viewDialogFooter}
                onHide={hideViewDialog}
            >
                <div className="user-profile-container">
                    <div className="user-profile-card">
                        <div className="user-profile-body">
                            <div className="user-profile-row">
                                <div className="user-profile-label">Email</div>
                                <div className="user-profile-value text-muted">{newUser.email}</div>
                            </div>
                            <hr />
                            <div className="user-profile-row">
                                <div className="user-profile-label">Họ và tên</div>
                                <div className="user-profile-value text-muted">{newUser.fullName}</div>
                            </div>
                            <hr />
                            <div className="user-profile-row">
                                <div className="user-profile-label">Vai trò</div>
                                <div className="user-profile-value text-muted">{newUser.role.role_name}</div>
                            </div>
                            <hr />
                            <div className="user-profile-row">
                                <div className="user-profile-label">Lần cuối truy cập</div>
                                <div className="user-profile-value text-muted">
                                    {newUser.lastAccessed === "N/A" ? (
                                        <span>Chưa bao giờ</span>
                                    ) : (
                                        // Kiểm tra xem user.lastAccessed có phải là một giá trị hợp lệ không
                                        !isNaN(new Date(newUser.lastAccessed).getTime()) ? (
                                            format(new Date(newUser.lastAccessed), 'dd-MM-yyyy')
                                        ) : (
                                            <span>Ngày không hợp lệ</span> // Thông báo nếu ngày không hợp lệ
                                        )
                                    )}
                                </div>
                            </div>
                            <hr />
                            <div className="user-profile-row">
                                <div className="user-profile-label">Mã CB-GV-NV</div>
                                <div className="user-profile-value text-muted">{newUser.codeProfessional}</div>
                            </div>
                            <hr />
                            <div className="user-profile-row">
                                <div className="user-profile-label">Số điện thoại</div>
                                <div className="user-profile-value text-muted">{newUser.phoneNumber}</div>
                            </div>
                            <hr />
                            <div className="user-profile-row">
                                <div className="user-profile-label">Chức vụ</div>
                                <div className="user-profile-value text-muted">{newUser.position}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}

export default User;