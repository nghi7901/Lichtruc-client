
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from "../context/Context";
import { useLocation, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../config/useDocumentTitle';

import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { OverlayPanel } from 'primereact/overlaypanel';

const DetailOpenAttendance = () => {
    const { user, isAuthenticated } = useAuth();
    useDocumentTitle('Chi tiết lịch trực');
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useRef(null);
    const overlayPanelRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const isSecretary = user?.role?.role_name === 'Thư ký';
    const isLecturer = user?.role?.role_name === 'Giảng viên';
    const isFaculty = user?.role?.role_name === 'Ban chủ nhiệm';
    const isAdmin = user?.role?.role_name === 'Quản trị';

    const [openAttendance, setOpenAttendance] = useState({});
    const [schedules, setSchedules] = useState({});
    const [sumWeek, setSumWeek] = useState(0);
    const [lstLecturerCount, setLstLecturerCount] = useState(0);
    const [registeredLecturers, setRegisteredLecturers] = useState(0);
    const [lecturers, setLecturers] = useState([]);
    const [registeredSessions, setRegisteredSessions] = useState([]);

    useEffect(() => {
        if (!isAuthenticated) {
            const redirectUrl = encodeURIComponent(location.pathname);
            navigate(`/login?redirect=${redirectUrl}`);
        }
    }, [isAuthenticated, navigate, location.pathname]);

    const getQueryParams = () => {
        const params = new URLSearchParams(location.search);
        const openId = params.get('openId');
        return { openId };
    };

    const totalLecturers = (day) => {
        return schedules[`${day}S`]?.length + schedules[`${day}C`]?.length || 0;
    };

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
    const getStatusLabel = (val) => {
        const status = statuses.find(status => status.value === val);
        return status ? status.label : null;
    };

    const { openId } = getQueryParams();

    // Lấy dữ liệu
    const fetchData = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/register-schedule?openId=${openId}&userId=${user._id}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            setOpenAttendance({
                schoolYear: data.schoolYear,
                semester: data.semester,
                startDay: data.startDay ? new Date(data.startDay) : null,
                endDay: data.endDay ? new Date(data.endDay) : null,
                statusId: data.statusId,
            });

            setSchedules(data.schedules);
            setTempSchedules(data.schedules);
            setSumWeek(data.totalWeeks);
            setLstLecturerCount(data.totalLecturers);
            setRegisteredLecturers(data.registeredLecturers);
            setLecturers(data.lecturers);
            setRegisteredSessions(data.registeredSessions);

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Đổi ngày tháng
    const handleChangeTime = async () => {
        const attendanceData = {
            startDay: openAttendance.startDay,
            endDay: openAttendance.endDay
        };
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/open-attendance/statusId/${openId}`, {
                credentials: 'include',
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(attendanceData),
            });

            const result = await response.json();
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật lịch trực thành công', life: 3000 });
            setChangeDateDialog(false);

        } catch (error) {
            console.error('Error:', error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra trong quá trình cập nhật', life: 3000 });
        }
    };

    // load lịch đăng ký của giảng viên được chọn
    const handleSelectedLecturer = async (option) => {
        const newLecturer = option.value;
        setSelectedLecturer(newLecturer);
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/register-schedule?openId=${openId}&userId=${newLecturer}`,
                {
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setRegisteredSessions(data.registeredSessions);
            setTempSchedules(data.schedules);

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải dữ liệu lịch trực',
                life: 3000
            });
        }
    };

    // Đăng ký lịch trực
    const handleRegister = async () => {
        if (!selectedLecturer) {
            toast.current.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng chọn giảng viên để đăng ký buổi trực.',
                life: 3000,
            });
            return;
        }

        if (registeredSessions.length === 0) {
            toast.current.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng chọn ít nhất một buổi trực để đăng ký.',
                life: 3000,
            });
            return;
        }

        const registerData = {
            listData: registeredSessions,
            openId: openId,
            userId: selectedLecturer,
            userTK: user._id,
        };

        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/register-schedule`, {
                credentials: 'include',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData),
            });

            if (!response.ok) {
                throw new Error('Có lỗi xảy ra trong quá trình kết nối với API.');
            }

            toast.current.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đăng ký buổi trực thành công!',
                life: 3000,
            });

            // Reset states and refresh data
            setSelectedLecturer(null);
            setRegisteredSessions([]);
            setTempSchedules({});

            hideRegisterDialog();
            await fetchData();

        } catch (error) {
            console.error('Error during API call:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Có lỗi xảy ra khi đăng ký buổi trực. Vui lòng thử lại.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };
    const handleRegisterForLecturer = async () => {
        if (!user || !user._id) {
            toast.current.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không xác định được giảng viên hiện tại.',
                life: 3000,
            });
            return;
        }

        // Dữ liệu đăng ký
        const registerData = {
            listData: registeredSessions,
            openId: openId,
            userId: user._id,
            userTK: user._id,
        };

        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/register-schedule`, {
                credentials: 'include',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData),
            });

            if (!response.ok) {
                throw new Error('Có lỗi xảy ra trong quá trình kết nối với API.');
            }

            // Hiển thị thông báo thành công
            toast.current.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đăng ký buổi trực thành công!',
                life: 3000,
            });

            setRegisteredSessions([]);
            setTempSchedules({});

            hideRegisterDialog();
            await fetchData();

        } catch (error) {
            console.error('Error during API call:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Có lỗi xảy ra khi đăng ký buổi trực. Vui lòng thử lại.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };


    // Xóa đăng ký
    const deleteSchedule = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/register-schedule/${selectedSchedule._id}`, {
                credentials: 'include',
                method: 'DELETE',
                headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
            });
            await fetchData()
            setDeleteScheduleDialog(false);
            setSelectedSchedule(null)
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Giảng viên đã bị xóa khỏi lịch trực', life: 3000 });

        } catch (error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, user, openId]);

    const validateDates = (start, end) => {
        if (start && end && start > end) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Ngày bắt đầu không thể lớn hơn ngày kết thúc', life: 3000 });
            return false;
        }
        return true;
    };

    const handleStartDayChange = (e) => {
        const newStartDay = new Date(e.target.value);
        if (validateDates(newStartDay, openAttendance.endDay)) {
            setOpenAttendance((prev) => ({ ...prev, startDay: newStartDay }));
        }
    };

    const handleEndDayChange = (e) => {
        const newEndDay = new Date(e.target.value);
        if (validateDates(openAttendance.startDay, newEndDay)) {
            setOpenAttendance((prev) => ({ ...prev, endDay: newEndDay }));
        }
    };


    // xem danh sách giảng viên
    const [viewLecturersDialog, setViewLecturersDialog] = useState(false);
    const openViewLecturers = () => {
        setViewLecturersDialog(true);
    };
    const hideViewLecturersDialog = () => {
        setViewLecturersDialog(false);
    };
    const viewLecturersDialogFooter = (
        <>
            <Button label="Đóng" icon="pi pi-times" outlined onClick={hideViewLecturersDialog} />
        </>
    );

    // Đổi thông tin lịch trực
    const [changeDateDialog, setChangeDateDialog] = useState(false);
    const openChangeDateDialog = () => {
        setChangeDateDialog(true);
    };
    const hideChangeDateDialog = () => {
        setChangeDateDialog(false);
    };
    const changeDateDialogFooter = (
        <>
            <Button label="Đóng" icon="pi pi-times" outlined onClick={hideChangeDateDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={handleChangeTime} />
        </>
    );

    // Đăng ký lịch trực
    const [selectedLecturer, setSelectedLecturer] = useState(null);
    const [registerDialog, setRegisterDialog] = useState(false);
    const [tempSchedules, setTempSchedules] = useState({});
    const openRegisterDialog = () => {
        setRegisterDialog(true);
    };
    const hideRegisterDialog = () => {
        setSelectedLecturer(null);
        setRegisteredSessions([]);
        setRegisterDialog(false);
    };
    const registerDialogFooter = (
        <>
            <Button label="Đóng" icon="pi pi-times" outlined onClick={hideRegisterDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={handleRegister} disabled={loading} />
        </>
    );
    const handleSessionClick = (sessionKey) => {
        if (!selectedLecturer) {
            toast.current.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Vui lòng chọn giảng viên trước khi đăng ký buổi trực',
                life: 3000
            });
            return;
        }

        const selectedLecturerInfo = lecturers.find(l => l._id === selectedLecturer);

        setTempSchedules(prev => {
            const newSchedules = { ...prev };
            const isAlreadyRegistered = registeredSessions.includes(sessionKey);

            if (isAlreadyRegistered) {
                if (newSchedules[sessionKey]) {
                    newSchedules[sessionKey] = newSchedules[sessionKey].filter(
                        l => l.userID !== selectedLecturer
                    );
                    if (newSchedules[sessionKey].length === 0) {
                        delete newSchedules[sessionKey];
                    }
                }
            } else {
                if (!newSchedules[sessionKey]) {
                    newSchedules[sessionKey] = [];
                }
                const isLecturerAlreadyInSession = newSchedules[sessionKey].some(
                    l => l.userID === selectedLecturer
                );
                if (!isLecturerAlreadyInSession) {
                    newSchedules[sessionKey].push({
                        userID: selectedLecturer,
                        lecturerName: selectedLecturerInfo.fullName,
                        lecturerShortName: selectedLecturerInfo.shortName,
                    });
                }
            }

            return newSchedules;
        });

        setRegisteredSessions(prevSessions => {
            const isAlreadyRegistered = prevSessions.includes(sessionKey);
            return isAlreadyRegistered
                ? prevSessions.filter(key => key !== sessionKey)
                : [...prevSessions, sessionKey];
        });
    };
    const handleSessionClickForLecturer = (sessionKey) => {
        if (!user || !user._id) {
            toast.current.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Không xác định được thông tin giảng viên hiện tại',
                life: 3000,
            });
            return;
        }

        // Tìm thông tin giảng viên từ danh sách lecturers dựa trên user._id
        const currentLecturerInfo = lecturers.find(l => l._id === user._id);

        if (!currentLecturerInfo) {
            toast.current.show({
                severity: 'warn',
                summary: 'Cảnh báo',
                detail: 'Thông tin giảng viên không hợp lệ hoặc không tồn tại',
                life: 3000,
            });
            return;
        }

        setTempSchedules(prev => {
            const newSchedules = { ...prev };
            const isAlreadyRegistered = registeredSessions.includes(sessionKey);

            if (isAlreadyRegistered) {
                // Xóa giảng viên khỏi buổi
                if (newSchedules[sessionKey]) {
                    newSchedules[sessionKey] = newSchedules[sessionKey].filter(
                        l => l.userID !== user._id
                    );
                    if (newSchedules[sessionKey].length === 0) {
                        delete newSchedules[sessionKey];
                    }
                }
            } else {
                // Đăng ký giảng viên cho buổi
                if (!newSchedules[sessionKey]) {
                    newSchedules[sessionKey] = [];
                }
                const isLecturerAlreadyInSession = newSchedules[sessionKey].some(
                    l => l.userID === user._id
                );
                if (!isLecturerAlreadyInSession) {
                    newSchedules[sessionKey].push({
                        userID: user._id,
                        lecturerName: currentLecturerInfo.fullName,
                        lecturerShortName: currentLecturerInfo.shortName,
                    });
                }
            }

            return newSchedules;
        });

        // Đồng bộ hóa `registeredSessions` sau khi cập nhật `tempSchedules`
        setRegisteredSessions(prevSessions => {
            const isAlreadyRegistered = prevSessions.includes(sessionKey);
            if (isAlreadyRegistered) {
                return prevSessions.filter(key => key !== sessionKey);
            } else {
                return [...prevSessions, sessionKey];
            }
        });
    };



    // Xóa giảng viên khỏi lịch trực
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [deleteScheduleDialog, setDeleteScheduleDialog] = useState(false);
    const handleButtonClick = (e, schedule) => {
        setSelectedSchedule(schedule);
        overlayPanelRef.current.toggle(e);
    };
    const confirmDeleteSchedule = () => {
        setDeleteScheduleDialog(true);
    };
    const hideDeleteScheduleDialog = () => {
        setViewLecturersDialog(false);
    };

    const deleteScheduleDialogFooter = (
        <>
            <Button label="Hủy bỏ" icon="pi pi-times" outlined onClick={hideDeleteScheduleDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={deleteSchedule} />
        </>
    );


    // Xuất file Excel
    const handleExportExcel = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/register-schedule/export-excel`, {
                credentials: 'include',
                method: 'POST',
                headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ openId })
            });

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Danhsachdangky.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Lỗi tải file:', error);
        }
    };

    return (
        <div>
            <Toast ref={toast} />
            <style>
                {`
                    table > tbody {
                        vertical-align: top !important;
                        max-width: 150px;
                    }

                    .fixTableHead {
                        overflow-y: auto;
                        height: 590px;
                        width: 100%;
                    }

                    .fixTableHead thead th {
                        position: sticky;
                        top: 0;
                    }

                    table > thead > tr > th {   
                        background-color: #13517a !important;
                        color: #fff !important;
                        font-weight: bold !important;
                        text-align: center;
                        align-items: center;
                    }

                    .morning {
                        background-color: #d4e1e9 !important; // #03a9f4
                        color: #4c307b ! important;
                        font-weight: bold !important;
                        text-align: center !important;
                    }

                    .afternoon {
                        background-color: #d4e1e9 !important; // #8bc34a
                        color: #4c307b !important;
                        font-weight: bold !important;
                        text-align: center !important;
                    }

                    .total {
                        height: 5%;
                        background-color: #f3f2f7;
                        color: black;
                    }

                    .custom-td {
                        display: flex;
                        flex-direction: column;
                        margin-bottom: 5px;
                    }
                    .registered {
                        background-color: #D3D3D3;
                        color: white;
                    }
                    .table {
                        border-collapse: collapse;
                        width: 100%; 
                    }

                    .table th, .table td {
                        border: 1px solid #bdccd6;
                        padding: 5px;
                        text-align: center; 
                    }
                    .magin-bottom-5px {
                        margin-bottom: 5px;
                    }

                    .width-70 {
                        width: 70%;
                    }

                    .form-inline {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: flex-start; 
                        gap: 20px;
                    }

                    .form-group {
                        display: flex;
                        flex-direction: row;
                        flex: 1; 
                        margin-bottom: 20px; 
                        width: 100%;
                        align-items: center;
                    }

                    .form-group label {
                        margin-right: 10px;
                        font-weight: bold;
                        text-align: right;
                    }

                    .form-group select {
                        padding: 5px;
                        border-radius: 4px;
                        border: 1px solid #ccc;
                        background-color: white;
                        color: black;
                    }
                    .config-alert {
                        padding: 7px !important;
                        margin-bottom: 10px !important;
                        margin-top: 5px !important;
                                    }
                    .alert-warning {
                        color: #8a6d3b;
                        background-color: #fcf8e3;
                        border-color: #faebcc;
                    }
                    .alert {
                        padding: 15px;
                        margin-bottom: 20px;
                        border: 1px solid transparent;
                        border-radius: 4px;
                    }
                    .customize-data {
                        display: flex;
                        flex-direction: column;
                        border: 1px solid;
                        width: 11rem;
                    }
                    .schedule-cell {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        margin: 10px auto;
                    }

                    .customize-data {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }

                    .schedule-name {
                        margin: 5px;
                        font-size: 0.8rem;
                    }

                    .schedule-tag {
                        color: #000;
                        border-radius: 0;
                        padding: 2px 5px;
                        width: 100%;
                    }
                `}
            </style>

            <div className="card">
                <div className="card-header border-bottom">
                    <h4>Thông Tin Đăng Ký</h4>
                    <div className="d-flex justify-content-between align-items-center row py-3 gap-3 gap-md-0">
                        <div className="col-md-2 user_role">
                            <label className="w-100px">Học kỳ</label>
                            <input
                                className="form-control"
                                style={{ backgroundColor: '#939191', color: 'white' }}
                                value={openAttendance?.semester || ''}
                                disabled={true}
                            />
                        </div>
                        <div className="col-md-3 user_role">
                            <label className="w-100px">Năm học</label>
                            <input
                                className="form-control"
                                style={{ backgroundColor: '#939191', color: 'white' }}
                                value={openAttendance?.schoolYear || ''}
                                disabled={true}
                            />
                        </div>
                        <div className="col-md-3 user_role">
                            <label className="w-full">Ngày bắt đầu trực</label>
                            <input
                                className="form-control"
                                type="date"
                                style={{ backgroundColor: '#939191', color: 'white' }}
                                value={openAttendance?.startDay ? openAttendance?.startDay.toISOString().split('T')[0] : ''}
                                disabled={true}
                            />
                        </div>
                        <div className="col-md-3 user_role">
                            <label className="w-100px">Ngày kết thúc trực</label>
                            <input
                                className="form-control"
                                type="date"
                                style={{ backgroundColor: '#939191', color: 'white' }}
                                value={openAttendance?.endDay ? openAttendance.endDay.toISOString().split('T')[0] : ''}
                                disabled={true}
                            />
                        </div>

                    </div>
                    <div className="d-flex justify-content-between align-items-center row py-3 gap-3 gap-md-0">
                        <div>
                            <label>Trạng thái:</label> &nbsp;
                            <Tag
                                value={getStatusLabel(openAttendance.statusId)}
                                severity={getStatus(openAttendance.statusId)}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', marginRight: '10px' }}>
                {(isFaculty || isSecretary || isAdmin) && (
                    <div>
                        <div style={{ float: 'left', marginTop: '5px' }}>
                            <b style={{ color: '#000' }}>Số lượng giảng viên đã đăng ký: </b>
                            <b style={{ color: '#28c76f' }}>{registeredLecturers}</b>
                            <b style={{ color: '#000' }}>/</b>
                            <b style={{ color: '#d51f35' }}>{lstLecturerCount}</b>
                        </div>
                        <div style={{ float: 'right', marginTop: '5px' }}>
                            {openAttendance?.statusId !== 1 && (
                                <Button
                                    onClick={() => openViewLecturers()}
                                    style={{ fontSize: '12px', color: '#fff' }}
                                    label="Danh sách giảng viên đăng ký"
                                    icon="pi pi-calendar"
                                    className='small-button'
                                />
                            )}
                            &nbsp;
                            <Button
                                onClick={handleExportExcel}
                                style={{ fontSize: '12px' }}
                                label="Xuất file Excel"
                                icon="pi pi-file-export"
                                severity="success"
                                className='small-button'
                            />
                            &nbsp;
                            {(!isLecturer && !(openAttendance?.statusId === 1)) && (
                                <Button
                                    onClick={openRegisterDialog}
                                    style={{ fontSize: '12px' }}
                                    label="Đăng ký lịch trực cho giảng viên"
                                    icon="pi pi-file-edit"
                                    severity="primary"
                                    className='small-button'
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-body">
                    <span className="user-guide">
                        Hướng dẫn:&ensp;
                        {isLecturer && (
                            <label>Nhấn chọn vào buổi muốn đăng ký (có thể chọn nhiều buổi) hoặc nhấn lại buổi đã chọn để xoá buổi đó</label>
                        )}
                        {(isSecretary || isAdmin) && openAttendance.statusId !== 2 && (
                            <label>Nhấn vào tên của giảng viên để xem chi tiết lịch trực</label>
                        )}
                        {(isSecretary || isAdmin) && openAttendance.statusId === 2 && (
                            <label>Nhấn vào tên của giảng viên để có thể xoá giảng viên ra khỏi lịch trực</label>
                        )}
                    </span>
                    <div style={{ overflowX: 'auto' }}>
                        {/* Thư ký */}
                        {openAttendance && schedules && (isSecretary || isFaculty || isAdmin) && (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th className="text-center">Thứ hai</th>
                                        <th className="text-center">Thứ ba</th>
                                        <th className="text-center">Thứ tư</th>
                                        <th className="text-center">Thứ năm</th>
                                        <th className="text-center">Thứ sáu</th>
                                        <th className="text-center">Thứ bảy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <th className="morning">Sáng</th>
                                        {["MonS", "TueS", "WedS", "ThuS", "FriS", "SatS"].map((sessionKey, index) => {
                                            const lecturers = schedules[sessionKey] || [];

                                            return (
                                                <td key={index} className="text-center">
                                                    {lecturers.length > 0 ? (
                                                        lecturers.map((lecturer, idx) => (
                                                            <div key={idx} className="schedule-name">
                                                                <Button
                                                                    type="button"
                                                                    severity="info"
                                                                    onClick={(e) => handleButtonClick(e, lecturer)}
                                                                    label={lecturer.lecturerShortName}
                                                                    className="small-button"
                                                                />
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span>
                                                            <Tag
                                                                style={{ backgroundColor: '#dcdfe1', color: '#000' }}
                                                                value="N/A"
                                                            />
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        <th className="afternoon">Chiều</th>
                                        {["MonC", "TueC", "WedC", "ThuC", "FriC", "SatC"].map((sessionKey, index) => {
                                            const lecturers = schedules[sessionKey] || [];

                                            return (
                                                <td key={index} className="text-center">
                                                    {lecturers.length > 0 ? (
                                                        lecturers.map((lecturer, idx) => (
                                                            <div key={idx} className="schedule-name">
                                                                <Button
                                                                    type="button"
                                                                    severity="info"
                                                                    onClick={(e) => handleButtonClick(e, lecturer)}
                                                                    label={lecturer.lecturerShortName}
                                                                    className="small-button"
                                                                />
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span>
                                                            <Tag
                                                                style={{ backgroundColor: '#dcdfe1', color: '#000' }}
                                                                value="N/A"
                                                            />
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr className="total">
                                        <th className="morning">Tổng GV/Buổi</th>
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                            <td key={index} className="text-center" style={{ backgroundColor: '#fff', }}>
                                                {totalLecturers(day)}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        )}
                        {/* Giảng viên */}
                        {openAttendance && schedules && isLecturer && (
                            <div>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th className="text-center">Thứ hai</th>
                                            <th className="text-center">Thứ ba</th>
                                            <th className="text-center">Thứ tư</th>
                                            <th className="text-center">Thứ năm</th>
                                            <th className="text-center">Thứ sáu</th>
                                            <th className="text-center">Thứ bảy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <th className="morning">Sáng</th>
                                            {["MonS", "TueS", "WedS", "ThuS", "FriS", "SatS"].map((sessionKey, index) => {
                                                const lecturersInSession = tempSchedules[sessionKey] || [];
                                                const isSelectedRegistered = registeredSessions.includes(sessionKey);

                                                return (
                                                    <td
                                                        key={index}
                                                        className="text-center"
                                                        style={{
                                                            cursor: 'pointer',
                                                            backgroundColor: isSelectedRegistered ? '#d1f5d3' : '#fff',
                                                        }}
                                                        onClick={() => handleSessionClickForLecturer(sessionKey)}
                                                    >
                                                        {/* Hiện danh sách giảng viên */}
                                                        {lecturersInSession.map((lecturer, idx) => (
                                                            <div key={idx} className="schedule-name">
                                                                <Tag
                                                                    severity={
                                                                        registeredSessions.includes(sessionKey) && lecturer.userID === user._id
                                                                            ? 'success'
                                                                            : 'info'
                                                                    }
                                                                    value={lecturer.lecturerShortName}
                                                                />
                                                            </div>
                                                        ))}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        <tr>
                                            <th className="afternoon">Chiều</th>
                                            {["MonC", "TueC", "WedC", "ThuC", "FriC", "SatC"].map((sessionKey, index) => {
                                                const lecturersInSession = tempSchedules[sessionKey] || [];
                                                const isSelectedRegistered = registeredSessions.includes(sessionKey);

                                                return (
                                                    <td
                                                        key={index}

                                                        style={{
                                                            cursor: 'pointer',
                                                            backgroundColor: isSelectedRegistered ? '#d1f5d3' : '#fff',
                                                        }}
                                                        onClick={() => handleSessionClickForLecturer(sessionKey)}
                                                    >
                                                        {lecturersInSession.map((lecturer, idx) => (
                                                            <div key={idx} className="schedule-name">
                                                                <Tag
                                                                    severity={
                                                                        registeredSessions.includes(sessionKey) && lecturer.userID === user._id
                                                                            ? 'success'
                                                                            : 'info'
                                                                    }
                                                                    value={lecturer.lecturerShortName}
                                                                />
                                                            </div>
                                                        ))}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        <tr className="total">
                                            <th className="morning">Tổng GV/Buổi</th>
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                                <td key={index} className="text-center" style={{ backgroundColor: '#fff', }}>
                                                    {totalLecturers(day)}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>

                                </table>
                                <div className='mt-3 d-flex justify-content-end'>
                                    <Button
                                        type="button"
                                        onClick={handleRegisterForLecturer}
                                        style={{ fontSize: '12px' }}
                                        label={registeredSessions.length === 0 ? "Đăng ký" : "Cập nhật"}
                                        icon="pi pi-file-edit"
                                        severity="success"
                                        className='small-button'
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Xem danh sách giảng viên */}
            <Dialog visible={viewLecturersDialog}
                style={{ width: '40rem', overflow: 'hidden' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Chi tiết đăng ký lịch trực"
                modal footer={viewLecturersDialogFooter}
                onHide={hideViewLecturersDialog}>
                <div className="table-responsive text-nowrap">
                    <div style={{ maxHeight: 'calc(80vh - 100px)', overflow: 'auto' }}>
                        <table className="table table-bordered">
                            <thead>
                                <tr style={{ backgroundColor: '#2C3F50', textAlign: 'center' }}>
                                    <th style={{ color: '#fff' }}>Mã Giảng Viên</th>
                                    <th style={{ color: '#fff' }}>Họ và tên</th>
                                    <th style={{ color: '#fff' }}>Tổng buổi đăng ký</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lecturers.map((lecturer, index) => (
                                    <tr className="text-center" key={index}>
                                        <td>{lecturer.codeProfessional ? lecturer.codeProfessional : 'N/A'}</td>
                                        <td>{lecturer.fullName ? lecturer.fullName : 'N/A'}</td>
                                        <td>{lecturer.registeredSessionsCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Dialog>

            {/* Xác nhận cập nhật lịch trực */}
            <Dialog visible={changeDateDialog}
                style={{ width: '32rem' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Confirm"
                modal footer={changeDateDialogFooter}
                onHide={hideChangeDateDialog}>
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Xác nhận cập nhật lịch trực ?</span>
                </div>
            </Dialog>

            {/* Đăng ký lịch trực  */}
            <Dialog visible={registerDialog} style={{ width: '100%' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Đăng ký lịch trực cho giảng viên" modal className="p-fluid"
                footer={registerDialogFooter}
                onHide={hideRegisterDialog}>
                <span className="user-guide">
                    Hướng dẫn:&ensp;

                    <label>Chọn tên giảng viên muốn đăng ký =&gt; Nhấn chọn vào buổi muốn đăng ký (có thể chọn nhiều buổi) hoặc nhấn lại buổi đã chọn để xoá buổi đó</label>

                </span>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                    <strong style={{ marginRight: '0.5rem' }}>Tên giảng viên:</strong>
                    <Dropdown
                        id="lecturerId"
                        value={selectedLecturer}
                        options={lecturers.map((lecturer) => ({
                            label: lecturer.fullName,
                            value: lecturer._id,
                        }))}
                        onChange={handleSelectedLecturer}
                        placeholder="Chọn giảng viên"
                        required
                        style={{ width: '200px' }}
                    />
                </div>

                <table className="table mt-3">
                    <thead>
                        <tr>
                            <th></th>
                            <th className="text-center">Thứ hai</th>
                            <th className="text-center">Thứ ba</th>
                            <th className="text-center">Thứ tư</th>
                            <th className="text-center">Thứ năm</th>
                            <th className="text-center">Thứ sáu</th>
                            <th className="text-center">Thứ bảy</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th className="morning">Sáng</th>
                            {["MonS", "TueS", "WedS", "ThuS", "FriS", "SatS"].map((sessionKey, index) => {
                                const lecturersInSession = tempSchedules[sessionKey] || [];
                                const isSelectedRegistered = registeredSessions.includes(sessionKey);

                                return (
                                    <td
                                        key={index}
                                        className="text-center"
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: isSelectedRegistered ? '#d1f5d3' : '#fff',
                                        }}
                                        onClick={() => handleSessionClick(sessionKey)}
                                    >
                                        {/* Hiện danh sách giảng viên */}
                                        {lecturersInSession.map((lecturer, idx) => (
                                            <div key={idx} className="schedule-name">
                                                <Tag
                                                    severity={
                                                        lecturer.userID === selectedLecturer
                                                            ? 'success'
                                                            : 'info'
                                                    }
                                                    value={lecturer.lecturerShortName}
                                                />
                                            </div>
                                        ))}
                                    </td>
                                );
                            })}
                        </tr>
                        <tr>
                            <th className="afternoon">Chiều</th>
                            {["MonC", "TueC", "WedC", "ThuC", "FriC", "SatC"].map((sessionKey, index) => {
                                const lecturersInSession = tempSchedules[sessionKey] || [];
                                const isSelectedRegistered = registeredSessions.includes(sessionKey);

                                return (
                                    <td
                                        key={index}
                                        className="text-center"
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: isSelectedRegistered ? '#d1f5d3' : '#fff',
                                        }}
                                        onClick={() => handleSessionClick(sessionKey)}
                                    >
                                        {lecturersInSession.map((lecturer, idx) => (
                                            <div key={idx} className="schedule-name">
                                                <Tag
                                                    severity={
                                                        lecturer.userID === selectedLecturer
                                                            ? 'success'
                                                            : 'info'
                                                    }
                                                    value={lecturer.lecturerShortName}
                                                />
                                            </div>
                                        ))}
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>

                </table>
            </Dialog>

            {/* Hiện option Xóa */}
            <OverlayPanel ref={overlayPanelRef} className="overlay-panel">
                {selectedSchedule && (
                    <div>
                        <div className='mb-3 text-sm'>
                            <div>Đăng ký bởi: {selectedSchedule.registerBy}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input value={selectedSchedule.lecturerName} style={{ borderRadius: '5px' }} disabled />
                            {openAttendance.statusId === 2 && (
                                <Button
                                    type="button"
                                    onClick={() => confirmDeleteSchedule(selectedSchedule)}
                                    style={{ marginLeft: '10px', fontSize: '12px' }}
                                    label="Xóa"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    className='small-button'
                                />
                            )}
                        </div>
                    </div>
                )}
            </OverlayPanel>

            {/* Xóa đăng ký */}
            <Dialog visible={deleteScheduleDialog}
                style={{ width: '40rem' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Confirm"
                modal footer={deleteScheduleDialogFooter}
                onHide={hideDeleteScheduleDialog}>
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Bạn chắc chắn muốn xóa giảng viên này ra khỏi buổi trực ?</span>
                </div>
            </Dialog>

        </div>
    );
};

export default DetailOpenAttendance