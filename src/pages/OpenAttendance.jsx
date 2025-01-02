import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { format } from 'date-fns'
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useAuth } from "../context/Context";
import { useLocation, useNavigate } from 'react-router-dom';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { FilterMatchMode } from 'primereact/api';
import useDocumentTitle from '../config/useDocumentTitle';
import { OpenAttendanceService } from '../service/OpenAttendanceService';
import { MdAppRegistration } from "react-icons/md";

const OpenAttendance = () => {
    useDocumentTitle('Quản lý lịch trực giảng viên');

    let emptyOpenAttendance = {
        semester: '',
        startDay: '',
        endDay: '',
        schoolYear: '',
        time_In_S: '07:30',
        time_Out_S: '12:00',
        time_In_C: '12:30',
        time_Out_C: '17:30'
    };
    const { user } = useAuth();
    const isSecretary = user?.role?.role_name === 'Thư ký';
    const isLecturer = user?.role?.role_name === 'Giảng viên';
    const isAdmin = user?.role?.role_name === 'Quản trị';
    const isFaculty = user?.role?.role_name === 'Ban chủ nhiệm';

    const [openAttendances, setOpenAttendances] = useState(null);
    const [openAttendance, setOpenAttendance] = useState(emptyOpenAttendance);
    const [semesterSchoolYearPairs, setSemesterSchoolYearPairs] = useState([]);

    const [openAttendanceDialog, setOpenAttendanceDialog] = useState(false);
    const [unlockRegisterDialog, setUnlockRegisterDialog] = useState(false);
    const [deleteOpenAttendanceDialog, setDeleteOpenAttendanceDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [filteredData, setFilteredData] = useState([]);

    const [filters, setFilters] = useState({
        'statusId': { value: null, matchMode: FilterMatchMode.EQUALS },
    });

    const toast = useRef(null);
    const dt = useRef(null);

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let _filters = { ...filters };

        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        if (!isAuthenticated) {
            const redirectUrl = encodeURIComponent(location.pathname);
            navigate(`/login?redirect=${redirectUrl}`);
        }
    }, [isAuthenticated, navigate, location.pathname]);

    const [statuses] = useState([
        { label: 'Chưa mở', value: 1 },
        { label: 'Đang mở', value: 2 },
        { label: 'Đã đóng', value: 3 },
        { label: 'Đã duyệt', value: 4 },
    ]);

    const getStatus = (val) => {
        switch (val) {
            case 1:
                return 'primary';
            case 2:
                return 'warning';
            case 3:
                return 'danger';
            case 4:
                return 'success';

            default:
                return null;
        }
    };

    const semesterOptions = [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' }
    ];

    const schoolYearOptions = Array.from({ length: 3 }, (_, i) => {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 1 + i;
        const endYear = startYear + 1;
        const label = `${startYear}-${endYear}`;
        return { label, value: label };
    });

    // Validate ngày tháng
    const validateDates = (start, end) => {
        if (start && end && start > end) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Ngày bắt đầu không thể lớn hơn ngày kết thúc', life: 3000 });
            return false;
        }
        return true;
    };
    const handleStartDayChange = (e) => {
        const newStartDay = new Date(e.target.value).toISOString().split('T')[0];
        if (validateDates(newStartDay, openAttendance.endDay)) {
            setOpenAttendance((prev) => ({ ...prev, startDay: newStartDay }));
        }
    };
    const handleEndDayChange = (e) => {
        const newEndDay = new Date(e.target.value).toISOString().split('T')[0];
        if (validateDates(openAttendance.startDay, newEndDay)) {
            setOpenAttendance((prev) => ({ ...prev, endDay: newEndDay }));
        }
    };
    // 

    const handleUnlockRegister = async () => {
        const attendanceData = {
            statusId: 2,
        };
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/open-attendance/statusId/${openAttendance._id}`, {
                credentials: 'include',
                method: 'PUT',
                headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(attendanceData),
            });

            const result = await response.json();
            setFilteredData((prevOpenAttendances) => {
                return prevOpenAttendances.map((attendance) =>
                    attendance._id === result._id ? result : attendance
                );
            });
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Mở đăng ký lịch trực thành công', life: 3000 });
            setUnlockRegisterDialog(false);
            setOpenAttendance(emptyOpenAttendance);

        } catch (error) {
            console.error('Error:', error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi mở đăng ký', life: 3000 });
        }
    };

    const getStatusLabel = (val) => {
        const status = statuses.find(status => status.value === val);
        return status ? status.label : null;
    };

    const statusBodyTemplate = (rowData) => {
        return (
            <Tag
                value={getStatusLabel(rowData.statusId)}
                severity={getStatus(rowData.statusId)}
            />
        );
    };

    const hideUnlockRegisterDialog = () => {
        setUnlockRegisterDialog(false);
    };

    const hideDeleteOpenAttendanceDialog = () => {
        setDeleteOpenAttendanceDialog(false);
    };

    const unlockRegisterDialogFooter = (
        <>
            <Button label="Hủy bỏ" icon="pi pi-times" outlined onClick={hideUnlockRegisterDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={handleUnlockRegister} />
        </>
    );

    const confirmUnlockRegister = (openAttendance) => {
        setOpenAttendance(openAttendance);
        setUnlockRegisterDialog(true);
    };

    const handleRegister = (rowData) => {
        const url = `/open-attendance/details?openId=${encodeURIComponent(rowData._id)}`;
        navigate(url, { state: { isRegisterClicked: true } });
    };

    const handleView = (rowData) => {
        const url = `/open-attendance/details?openId=${encodeURIComponent(rowData._id)}`;
        navigate(url);
    };

    const actionBodyTemplate = (rowData) => {
        const buttons = [];

        // Xem chi tiết cho isSecretary hoặc isFaculty
        if (isSecretary || isFaculty || isAdmin) {
            buttons.push(
                <Button
                    key="view"
                    label="Chi tiết"
                    icon="pi pi-calendar"
                    onClick={() => handleView(rowData)}
                    className="small-button"
                />
            );
        }

        if (isSecretary) {
            switch (rowData.statusId) {
                case 1:
                    buttons.push(
                        <React.Fragment key="status-1">
                            &nbsp;
                            <Button
                                label="Cập nhật"
                                icon="pi pi-file-edit"
                                severity="warning"
                                onClick={() => openEditAttendanceDialog(rowData)}
                                className="small-button"
                            />
                            &nbsp;
                            <Button
                                label="Mở đăng ký"
                                icon="pi pi-lock-open"
                                severity="success"
                                onClick={() => confirmUnlockRegister(rowData)}
                                className="small-button"
                            />
                            &nbsp;
                            <Button
                                label="Xóa"
                                icon="pi pi-trash"
                                severity="danger"
                                onClick={() => confirmDeleteOpenAttendance(rowData)}
                                className="small-button"
                            />
                        </React.Fragment>
                    );
                    break;
                case 2:
                    buttons.push(
                        <React.Fragment key="status-2">
                            &nbsp;
                            <Button
                                label="Cập nhật"
                                icon="pi pi-file-edit"
                                severity="warning"
                                onClick={() => openEditAttendanceDialog(rowData)}
                                className="small-button"
                            />
                            &nbsp;
                            <Button
                                key="status-2"
                                label="Đóng đăng ký"
                                icon="pi pi-lock"
                                severity="warning"
                                onClick={() => openLockOpenAttendanceDialog(rowData)}
                                className="small-button"
                            />
                        </React.Fragment>
                    );
                    break;
                case 3:
                    buttons.push(
                        <React.Fragment key="status-3">
                            &nbsp;
                            <Button
                                label="Cập nhật"
                                icon="pi pi-file-edit"
                                severity="warning"
                                onClick={() => openEditAttendanceDialog(rowData)}
                                className="small-button"
                            />
                            &nbsp;
                            <Button
                                key="status-3"
                                label="Mở đăng ký"
                                icon="pi pi-lock-open"
                                severity="success"
                                onClick={() => confirmUnlockRegister(rowData)}
                                className="small-button"
                            />
                        </React.Fragment>
                    );
                    break;
                default:
                    break;
            }
        }

        if (isFaculty) {
            switch (rowData.statusId) {
                case 1:
                    buttons.push(
                        <React.Fragment key="status-1">
                            &nbsp;
                            <Button
                                label="Cập nhật"
                                icon="pi pi-file-edit"
                                severity="warning"
                                onClick={() => openEditAttendanceDialog(rowData)}
                                className="small-button"
                            />
                        </React.Fragment>
                    );
                    break;
                case 2:
                    buttons.push(
                        <React.Fragment key="status-1">
                            &nbsp;
                            <Button
                                label="Cập nhật"
                                icon="pi pi-file-edit"
                                severity="warning"
                                onClick={() => openEditAttendanceDialog(rowData)}
                                className="small-button"
                            />
                        </React.Fragment>
                    );
                    break;
                case 3:
                    buttons.push(
                        <React.Fragment key="status-3">
                            &nbsp;
                            <Button
                                label="Cập nhật"
                                icon="pi pi-file-edit"
                                severity="warning"
                                onClick={() => openEditAttendanceDialog(rowData)}
                                className="small-button"
                            />
                            &nbsp;
                            <Button
                                label="Duyệt lịch trực"
                                icon="pi pi-verified"
                                severity="success"
                                onClick={() => openVerifiedOpenAttendanceDialog(rowData)}
                                className="small-button"
                            />
                        </React.Fragment>
                    );
                    break;
                default:
                    break;
            }
        }

        if (isLecturer && rowData.statusId === 2) {
            buttons.push(
                <Button
                    key="register"
                    label="Đăng ký"
                    icon={MdAppRegistration}
                    severity="primary"
                    onClick={() => handleRegister(rowData)}
                    className="small-button"
                    style={{
                        textDecoration: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                    }}
                />
            );
        }

        if (isAdmin) {
            switch (rowData.statusId) {
                case 1:
                    buttons.push(
                        <React.Fragment key="status-1">
                            &nbsp;
                            <Button
                                label="Cập nhật"
                                icon="pi pi-file-edit"
                                severity="warning"
                                onClick={() => openEditAttendanceDialog(rowData)}
                                className="small-button"
                            />
                            &nbsp;
                            <Button
                                label="Mở đăng ký"
                                icon="pi pi-lock-open"
                                severity="success"
                                onClick={() => confirmUnlockRegister(rowData)}
                                className="small-button"
                            />
                            &nbsp;
                            <Button
                                label="Xóa"
                                icon="pi pi-trash"
                                severity="danger"
                                onClick={() => confirmDeleteOpenAttendance(rowData)}
                                className="small-button"
                            />
                        </React.Fragment>
                    );
                    break;
                case 2:
                    buttons.push(
                        <React.Fragment key="status-2">
                            &nbsp;
                            <Button
                                label="Cập nhật"
                                icon="pi pi-file-edit"
                                severity="warning"
                                onClick={() => openEditAttendanceDialog(rowData)}
                                className="small-button"
                            />
                            &nbsp;
                            <Button
                                key="status-2"
                                label="Đóng đăng ký"
                                icon="pi pi-lock"
                                severity="warning"
                                onClick={() => openLockOpenAttendanceDialog(rowData)}
                                className="small-button"
                            />
                        </React.Fragment>
                    );
                    break;
                case 3:
                    buttons.push(
                        <React.Fragment key="status-3">
                            &nbsp;
                            <Button
                                label="Cập nhật"
                                icon="pi pi-file-edit"
                                severity="warning"
                                onClick={() => openEditAttendanceDialog(rowData)}
                                className="small-button"
                            />
                            &nbsp;
                            <Button
                                key="status-3"
                                label="Mở đăng ký"
                                icon="pi pi-lock-open"
                                severity="success"
                                onClick={() => confirmUnlockRegister(rowData)}
                                className="small-button"
                            />
                            &nbsp;
                            <Button
                                label="Duyệt lịch trực"
                                icon="pi pi-verified"
                                severity="success"
                                onClick={() => openVerifiedOpenAttendanceDialog(rowData)}
                                className="small-button"
                            />
                        </React.Fragment>
                    );
                    break;
                default:
                    break;
            }
        }

        return <div>{buttons}</div>;
    };


    const confirmDeleteOpenAttendance = (openAttendance) => {
        setOpenAttendance(openAttendance);
        setDeleteOpenAttendanceDialog(true);
    };

    const openNew = () => {
        setOpenAttendance(emptyOpenAttendance);
        setSubmitted(false);
        setOpenAttendanceDialog(true);
    };

    const saveOpenAttendance = async () => {
        setSubmitted(true);

        // Validate required fields
        if (openAttendance.semester.trim() && openAttendance.startDay && openAttendance.endDay && openAttendance.schoolYear.trim()) {
            const attendanceData = {
                userId: user._id,
                semester: openAttendance.semester,
                startDay: openAttendance.startDay,
                endDay: openAttendance.endDay,
                schoolYear: openAttendance.schoolYear,
                time_In_S: openAttendance.time_In_S,
                time_Out_S: openAttendance.time_Out_S,
                time_In_C: openAttendance.time_In_C,
                time_Out_C: openAttendance.time_Out_C,
            };

            const isDuplicate = semesterSchoolYearPairs.some(
                (pair) =>
                    pair.semester === openAttendance.semester &&
                    pair.schoolYear === openAttendance.schoolYear
            );

            if (isDuplicate) {
                toast.current.show({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: `Học kỳ ${openAttendance.semester} của năm học ${openAttendance.schoolYear} đã tồn tại.`,
                    life: 3000,
                });
                return;
            }

            try {
                let response;

                response = await fetch(`${process.env.REACT_APP_SERVER_URL}/open-attendance`, {
                    credentials: 'include',
                    method: 'POST',
                    headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(attendanceData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    if (response.status === 400 && errorData.message) {
                        toast.current.show({
                            severity: 'warn',
                            summary: 'Cảnh báo',
                            detail: errorData.message,
                            life: 3000,
                        });
                    } else {
                        throw new Error('Network response was not ok');
                    }
                    return;
                }

                const result = await response.json();
                setFilteredData((prevOpenAttendances) => [result, ...prevOpenAttendances]);
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Lịch trực đã được tạo', life: 3000 });

                setOpenAttendanceDialog(false);
                setOpenAttendance(emptyOpenAttendance);
            } catch (error) {
                console.error('Error:', error);
                toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi tạo lịch trực', life: 3000 });
            }
        }
    };

    const deleteOpenAttendance = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/open-attendance/${openAttendance._id}`, {
                credentials: 'include',
                method: 'DELETE',
                headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
            });
            setFilteredData((prevOpenAttendances) => prevOpenAttendances.filter(us => us._id !== openAttendance._id));
            setDeleteOpenAttendanceDialog(false);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Lịch trực đã bị xóa khỏi hệ thống', life: 3000 });

        } catch (error) {
            console.error('Error:', error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi xóa lịch trực', life: 3000 });
        }
    };

    const deleteOpenAttendanceDialogFooter = (
        <>
            <Button label="Hủy bỏ" icon="pi pi-times" outlined onClick={hideDeleteOpenAttendanceDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="danger" onClick={deleteOpenAttendance} />
        </>
    );
    useEffect(() => {
        if (isAuthenticated) {
            OpenAttendanceService.getOpenAttendances().then((data) => { setOpenAttendances(data.openAttendances); setFilteredData(data.openAttendances); setSemesterSchoolYearPairs(data.semesterSchoolYearPairs) });
        }
    }, [isAuthenticated]);

    const StatusFilter = ({ options, onChange, value }) => {
        return (
            <Dropdown
                options={options}
                onChange={(e) => onChange(e.value)}
                placeholder="Lọc theo trạng thái"
                value={value}
            />
        );
    };

    const handleRoleFilterChange = (value) => {
        setStatusFilter(value);
        const newData = openAttendances.filter(item => {
            return value ? item.statusId === value : true;
        });
        setFilteredData(newData);
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <span className="text-xl text-900 font-bold">Danh sách lịch trực có thể đăng ký</span>
            <div>
                <StatusFilter
                    options={statuses} // Mảng các vai trò
                    onChange={handleRoleFilterChange} // Hàm xử lý thay đổi
                    value={statusFilter}
                />
                &nbsp;&nbsp;
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Nhập từ khóa tìm kiếm" />
            </div>
        </div>
    );


    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="Thêm mới" icon="pi pi-calendar-plus" severity="success" onClick={openNew} />
                {/* <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedUsers || !selectedUsers.length} /> */}
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        // return <Button label="Export" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} />;
    };

    const hideDialog = () => {
        setSubmitted(false);
        setOpenAttendanceDialog(false);
    };

    const openAttendanceDialogFooter = (
        <>
            <Button label="Hủy bỏ" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" severity='success' onClick={saveOpenAttendance} />
        </>
    );

    const statusTemplate = (option) => {
        return <Tag value={option.label} severity={getStatus(option.value)} />;
    };

    const statusRowFilterTemplate = (options) => {
        return (
            <Dropdown
                value={options.value}
                options={statuses}
                itemTemplate={statusTemplate}
                onChange={(e) => options.filterApplyCallback(e.value)}
                placeholder="Trạng thái"
                className="p-column-filter"
                showClear
                style={{ width: '12rem' }}
            />
        );
    };

    // Đóng đăng ký lịch trực
    const handleLockRegister = async () => {
        const attendanceData = {
            statusId: 3,
        };
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/open-attendance/statusId/${openAttendance._id}`, {
                credentials: 'include',
                method: 'PUT',
                headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(attendanceData),
            });

            const result = await response.json();
            setFilteredData((prevOpenAttendances) => {
                return prevOpenAttendances.map((attendance) =>
                    attendance._id === result._id ? result : attendance
                );
            });

            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Đóng đăng ký lịch trực thành công', life: 3000 });
            setLockOpenAttendanceDialog(false);

        } catch (error) {
            console.error('Error:', error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi đóng đăng ký', life: 3000 });
        }
    };
    const [lockOpenAttendanceDialog, setLockOpenAttendanceDialog] = useState(false);
    const openLockOpenAttendanceDialog = (rowData) => {
        setLockOpenAttendanceDialog(true);
        setOpenAttendance(rowData)
    };
    const hideLockOpenAttendanceDialog = () => {
        setLockOpenAttendanceDialog(false);
    };
    const lockOpenAttendanceDialogFooter = (
        <>
            <Button label="Đóng" icon="pi pi-times" outlined onClick={hideLockOpenAttendanceDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={handleLockRegister} />
        </>
    );

    // Duyệt lịch trực
    const [isProcessing, setIsProcessing] = useState(false);
    const handleVerifiedRegister = async () => {
        setIsProcessing(true);
        const attendanceData = {
            statusId: 4,
        };
        try {
            setVerifiedOpenAttendanceDialog(false);
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/open-attendance/statusId/${openAttendance._id}`, {
                credentials: 'include',
                method: 'PUT',
                headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(attendanceData),
            });
            const result = await response.json();
            setFilteredData((prevOpenAttendances) => {
                return prevOpenAttendances.map((attendance) =>
                    attendance._id === result._id ? result : attendance
                );
            });

            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Duyệt lịch trực thành công', life: 3000 });
        } catch (error) {
            console.error('Error:', error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi duyệt lịch trực', life: 3000 });
        } finally {
            setIsProcessing(false);
        }
    };
    const [verifiedOpenAttendanceDialog, setVerifiedOpenAttendanceDialog] = useState(false);
    const openVerifiedOpenAttendanceDialog = (rowData) => {
        setVerifiedOpenAttendanceDialog(true);
        setOpenAttendance(rowData)
    };
    const hideVerifiedOpenAttendanceDialog = () => {
        setVerifiedOpenAttendanceDialog(false);
    };
    const verifiedOpenAttendanceDialogFooter = (
        <>
            <Button label="Đóng" icon="pi pi-times" outlined onClick={hideVerifiedOpenAttendanceDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={handleVerifiedRegister} />
        </>
    );

    // Cập nhật thông tin lịch trực
    const handleChangeTime = async () => {
        setSubmitted(true);

        // Validate required fields
        if (openAttendance.semester.trim() && openAttendance.startDay && openAttendance.endDay && openAttendance.schoolYear.trim()) {
            const attendanceData = {
                userId: user._id,
                semester: openAttendance.semester,
                startDay: openAttendance.startDay,
                endDay: openAttendance.endDay,
                schoolYear: openAttendance.schoolYear,
                time_In_S: openAttendance.time_In_S,
                time_Out_S: openAttendance.time_Out_S,
                time_In_C: openAttendance.time_In_C,
                time_Out_C: openAttendance.time_Out_C,
            };

            const isDuplicate = semesterSchoolYearPairs.some(
                (pair) =>
                    pair.semester === openAttendance.semester &&
                    pair.schoolYear === openAttendance.schoolYear &&
                    pair._id !== openAttendance._id
            );

            if (isDuplicate) {
                toast.current.show({
                    severity: 'warn',
                    summary: 'Cảnh báo',
                    detail: `Học kỳ ${openAttendance.semester} của năm học ${openAttendance.schoolYear} đã tồn tại.`,
                    life: 3000,
                });
                return;
            }
            try {
                const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/open-attendance/statusId/${openAttendance._id}`, {
                    credentials: 'include',
                    method: 'PUT',
                    headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(attendanceData),
                });
                const result = await response.json();

                setFilteredData((prevOpenAttendances) => {
                    return prevOpenAttendances.map((attendance) =>
                        attendance._id === result._id ? result : attendance
                    );
                });
                toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật lịch trực thành công', life: 3000 });

                setEditAttendanceDialog(false);

            } catch (error) {
                console.error('Error:', error);
                toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra trong quá trình cập nhật', life: 3000 });
            }
        };
    }
    const [editAttendanceDialog, setEditAttendanceDialog] = useState(false);
    const openEditAttendanceDialog = (rowData) => {
        setEditAttendanceDialog(true);
        setOpenAttendance(rowData)
    };
    const hideEditAttendanceDialog = () => {
        setEditAttendanceDialog(false);
    };
    const editAttendanceDialogFooter = (
        <>
            <Button label="Đóng" icon="pi pi-times" outlined onClick={hideEditAttendanceDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={handleChangeTime} />
        </>
    );

    return (
        <div>
            <style>
                {`
                .field {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .field label {
                    flex: 0 0 150px;
                    margin-right: 1rem;
                    text-align: left; 

                .field input,
                .field .p-dropdown {
                    flex: 1; 
                }
                `}
            </style>
            <Toast ref={toast} />
            <div className="card">
                {!isLecturer &&
                    <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
                }

                <DataTable ref={dt} value={filteredData}
                    dataKey="_id"
                    globalFilter={globalFilter}
                    header={header}
                    paginator rows={5} rowsPerPageOptions={[5, 10, 25]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Hiển thị {first} tới {last} trong tổng số {totalRecords} lịch trực"
                    headerStyle={{ backgroundColor: '#ffffff' }}
                    emptyMessage="Không có dữ liệu">
                    <Column
                        header="STT"
                        body={(rowData, { rowIndex }) => rowIndex + 1} // Incrementing index
                    ></Column>
                    <Column field="semester" header="Học kỳ"></Column>
                    <Column field="schoolYear" sortable header="Năm học"></Column>
                    <Column field="startDay" header="Ngày bắt đầu"
                        body={(rowData) => {
                            const date = new Date(rowData.startDay);
                            return format(date, 'dd-MM-yyyy'); // Format the date to dd-mm-yyyy
                        }} ></Column>
                    <Column field="endDay" header="Ngày kết thúc"
                        body={(rowData) => {
                            const date = new Date(rowData.endDay);
                            return format(date, 'dd-MM-yyyy'); // Format the date to dd-mm-yyyy
                        }} ></Column>
                    <Column field="statusId" header="Trạng thái" body={statusBodyTemplate}
                        showFilterMenu={false} filterMenuStyle={{ width: '12rem' }}
                        style={{ width: '12rem' }}
                        filter filterElement={statusRowFilterTemplate}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                </DataTable>

                <Dialog visible={unlockRegisterDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={unlockRegisterDialogFooter} onHide={hideUnlockRegisterDialog}>
                    <div className="confirmation-content">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>Bạn chắc chắn muốn mở đăng ký lịch trực này ?</span>
                    </div>
                </Dialog>
                <Dialog visible={deleteOpenAttendanceDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={deleteOpenAttendanceDialogFooter} onHide={hideDeleteOpenAttendanceDialog}>
                    <div className="confirmation-content">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>Bạn chắc chắn muốn xóa lịch trực này ?</span>
                    </div>
                </Dialog>
                <Dialog visible={openAttendanceDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                    header="Thông tin lịch trực " modal className="p-fluid"
                    footer={openAttendanceDialogFooter} onHide={hideDialog}>
                    <div className="field">
                        <label htmlFor="semester" className="font-bold">Học Kỳ</label>
                        <Dropdown
                            id="semester"
                            value={openAttendance.semester}
                            options={semesterOptions}
                            onChange={(e) => setOpenAttendance((prev) => ({ ...prev, semester: e.value }))}
                            required
                            placeholder="Chọn học kỳ"
                            className={classNames({ 'p-invalid': submitted && !openAttendance.semester })}
                        />
                        {submitted && !openAttendance.semester && <small className="p-error">Vui lòng chọn học kỳ</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="schoolYear" className="font-bold">Năm Học</label>
                        <Dropdown
                            id="schoolYear"
                            value={openAttendance.schoolYear}
                            options={schoolYearOptions}
                            onChange={(e) => setOpenAttendance((prev) => ({ ...prev, schoolYear: e.value }))}
                            required
                            placeholder="Chọn năm học"
                        />
                        {submitted && !openAttendance.schoolYear && <small className="p-error">Vui lòng chọn năm học</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="startDay" className="font-bold">Ngày Bắt Đầu</label>
                        <InputText
                            id="startDay"
                            type="date"
                            value={openAttendance.startDay}
                            onChange={handleStartDayChange}
                            required
                        />
                        {submitted && !openAttendance.startDay && <small className="p-error">Vui lòng chọn ngày bắt đầu</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="endDay" className="font-bold">Ngày Kết Thúc</label>
                        <InputText
                            id="endDay"
                            type="date"
                            value={openAttendance.endDay}
                            onChange={handleEndDayChange}
                            required
                        />
                        {submitted && !openAttendance.endDay && <small className="p-error">Vui lòng chọn ngày kết thúc</small>}
                    </div>
                    <hr />
                    <div className="field">
                        <label htmlFor="time_In_S" className="font-bold">Giờ vào ca sáng</label>
                        <InputText
                            id="time_In_S"
                            type="time"
                            value={openAttendance.time_In_S}
                            onChange={(e) => setOpenAttendance((prev) => ({ ...prev, time_In_S: e.target.value }))}
                            required
                        />
                        {submitted && !openAttendance.time_In_S && <small className="p-error">Vui lòng chọn giờ vào ca sáng</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="time_Out_S" className="font-bold">Giờ ra ca sáng</label>
                        <InputText
                            id="time_Out_S"
                            type="time"
                            value={openAttendance.time_Out_S}
                            onChange={(e) => setOpenAttendance((prev) => ({ ...prev, time_Out_S: e.target.value }))}
                            required
                        />
                        {submitted && !openAttendance.time_Out_S && <small className="p-error">Vui lòng chọn giờ ra ca sáng</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="time_In_C" className="font-bold">Giờ vào ca chiều</label>
                        <InputText
                            id="time_In_C"
                            type="time"
                            value={openAttendance.time_In_C}
                            onChange={(e) => setOpenAttendance((prev) => ({ ...prev, time_In_C: e.target.value }))}
                            required
                        />
                        {submitted && !openAttendance.time_In_C && <small className="p-error">Vui lòng chọn giờ vào ca chiều</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="time_Out_C" className="font-bold">Giờ ra ca chiều</label>
                        <InputText
                            id="time_Out_C"
                            type="time"
                            value={openAttendance.time_Out_C}
                            onChange={(e) => setOpenAttendance((prev) => ({ ...prev, time_Out_C: e.target.value }))}
                            required
                        />
                        {submitted && !openAttendance.time_Out_C && <small className="p-error">Vui lòng chọn giờ ra ca chiều</small>}
                    </div>
                </Dialog>
            </div>

            {/* Xác nhận đóng đăng ký */}
            <Dialog visible={lockOpenAttendanceDialog}
                style={{ width: '32rem' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Confirm"
                modal footer={lockOpenAttendanceDialogFooter}
                onHide={hideLockOpenAttendanceDialog}>
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Xác nhận đóng đăng ký lịch trực ?</span>
                </div>
            </Dialog>

            {/* Xác nhận duyệt lịch trực */}
            <Dialog visible={verifiedOpenAttendanceDialog}
                style={{ width: '32rem' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Confirm"
                modal footer={verifiedOpenAttendanceDialogFooter}
                onHide={hideVerifiedOpenAttendanceDialog}>
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Xác nhận duyệt lịch trực ?</span>
                </div>
            </Dialog>

            {/* Thay đổi thông tin lịch trực */}
            <Dialog
                visible={editAttendanceDialog}
                style={{ width: '32rem' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Sửa thông tin lịch trực"
                modal
                className="p-fluid"
                footer={editAttendanceDialogFooter}
                onHide={hideEditAttendanceDialog}
            >
                <div className="field">
                    <label htmlFor="semester" className="font-bold">Học Kỳ</label>
                    <Dropdown
                        id="semester"
                        value={openAttendance.semester}
                        options={semesterOptions}
                        onChange={(e) => setOpenAttendance((prev) => ({ ...prev, semester: e.value }))}
                        required
                        placeholder="Chọn học kỳ"
                        className={classNames({ 'p-invalid': submitted && !openAttendance.semester })}
                    />
                    {submitted && !openAttendance.semester && <small className="p-error">Vui lòng chọn học kỳ</small>}
                </div>
                <div className="field">
                    <label htmlFor="schoolYear" className="font-bold">Năm Học</label>
                    <Dropdown
                        id="schoolYear"
                        value={openAttendance.schoolYear}
                        options={schoolYearOptions}
                        onChange={(e) => setOpenAttendance((prev) => ({ ...prev, schoolYear: e.value }))}
                        required
                        placeholder="Chọn năm học"
                    />
                    {submitted && !openAttendance.schoolYear && <small className="p-error">Vui lòng chọn năm học</small>}
                </div>
                <div className="field">
                    <label htmlFor="startDay" className="font-bold">Ngày Bắt Đầu</label>
                    <InputText
                        id="startDay"
                        type="date"
                        value={openAttendance.startDay ? new Date(openAttendance.startDay).toISOString().split('T')[0] : ''}
                        onChange={handleStartDayChange}
                    />
                    {submitted && !openAttendance.startDay && <small className="p-error">Vui lòng chọn ngày bắt đầu</small>}
                </div>
                <div className="field">
                    <label htmlFor="endDay" className="font-bold">Ngày Kết Thúc</label>
                    <InputText
                        id="endDay"
                        type="date"
                        value={openAttendance.endDay ? new Date(openAttendance.endDay).toISOString().split('T')[0] : ''}
                        onChange={handleEndDayChange}
                        required
                    />
                    {submitted && !openAttendance.endDay && <small className="p-error">Vui lòng chọn ngày kết thúc</small>}
                </div>
                <hr />
                <div className="field">
                    <label htmlFor="time_In_S" className="font-bold">Giờ vào ca sáng</label>
                    <InputText
                        id="time_In_S"
                        type="time"
                        value={openAttendance.time_In_S}
                        onChange={(e) => setOpenAttendance((prev) => ({ ...prev, time_In_S: e.target.value }))}
                        required
                    />
                    {submitted && !openAttendance.time_In_S && <small className="p-error">Vui lòng chọn giờ vào ca sáng</small>}
                </div>
                <div className="field">
                    <label htmlFor="time_Out_S" className="font-bold">Giờ ra ca sáng</label>
                    <InputText
                        id="time_Out_S"
                        type="time"
                        value={openAttendance.time_Out_S}
                        onChange={(e) => setOpenAttendance((prev) => ({ ...prev, time_Out_S: e.target.value }))}
                        required
                    />
                    {submitted && !openAttendance.time_Out_S && <small className="p-error">Vui lòng chọn giờ ra ca sáng</small>}
                </div>
                <div className="field">
                    <label htmlFor="time_In_C" className="font-bold">Giờ vào ca chiều</label>
                    <InputText
                        id="time_In_C"
                        type="time"
                        value={openAttendance.time_In_C}
                        onChange={(e) => setOpenAttendance((prev) => ({ ...prev, time_In_C: e.target.value }))}
                        required
                    />
                    {submitted && !openAttendance.time_In_C && <small className="p-error">Vui lòng chọn giờ vào ca chiều</small>}
                </div>
                <div className="field">
                    <label htmlFor="time_Out_C" className="font-bold">Giờ ra ca chiều</label>
                    <InputText
                        id="time_Out_C"
                        type="time"
                        value={openAttendance.time_Out_C}
                        onChange={(e) => setOpenAttendance((prev) => ({ ...prev, time_Out_C: e.target.value }))}
                        required
                    />
                    {submitted && !openAttendance.time_Out_C && <small className="p-error">Vui lòng chọn giờ ra ca chiều</small>}
                </div>
            </Dialog>

        </div>
    );
}

export default OpenAttendance;