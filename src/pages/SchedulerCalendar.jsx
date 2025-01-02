import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from "../context/Context";
import { useLocation } from 'react-router-dom';
import useDocumentTitle from '../config/useDocumentTitle';
import axios from 'axios';

import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';

const SchedulerCalendar = () => {
    useDocumentTitle('Chi tiết lịch trực');
    const { user, isAuthenticated } = useAuth();
    const toast = useRef(null);

    const [scheduleData, setScheduleData] = useState([]);

    const dayMap = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    };

    const schoolYearOptions = Array.from({ length: 3 }, (_, i) => {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 1 + i;
        const endYear = startYear + 1;
        const label = `${startYear}-${endYear}`;
        return { label, value: label };
    });

    const semesterOptions = [
        { label: "Học kỳ 1", value: "1" },
        { label: "Học kỳ 2", value: "2" },
        { label: "Học kỳ 3", value: "3" },
    ];

    const weekOptions = scheduleData.map((week, index) => ({
        value: index + 1,
        select: index + 1,
        display: week.display,
    }));

    const [selectedSchoolYear, setSelectedSchoolYear] = useState(schoolYearOptions[0]?.value || "");
    const [selectedSemester, setSelectedSemester] = useState(semesterOptions[0]?.value || "");
    const [selectedWeek, setSelectedWeek] = useState('');

    const getWeekContainingDate = (date, scheduleData) => {
        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);

        return scheduleData.findIndex((week) => {
            const startDate = new Date(week.startDate);
            const endDate = new Date(week.endDate);
            return currentDate >= startDate && currentDate <= endDate;
        }) + 1;
    };

    const getSchoolYearAndSemester = () => {
        const currentDate = new Date();
        let schoolYear = '';
        let semester = '';

        const currentYear = currentDate.getFullYear();
        const nextYear = currentYear + 1;

        if (currentDate.getMonth() < 9) {
            schoolYear = `${(currentYear - 1)}-${(nextYear - 1)}`;
        } else {
            schoolYear = `${currentYear}-${nextYear}`;
        }

        if (currentDate.getMonth() >= 8 && currentDate.getMonth() <= 11) {
            semester = '1';
        } else if (currentDate.getMonth() >= 0 && currentDate.getMonth() <= 3) {
            semester = '2';
        } else {
            semester = '3';
        }

        setSelectedSchoolYear(schoolYear);
        setSelectedSemester(semester)

        return { schoolYear, semester };
    }

    const checkScheduleConflict = (date, session) => {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        return scheduleData.some(week => {
            return week.schedules.some(schedule => {
                const scheduleDate = new Date(schedule.date);
                scheduleDate.setHours(0, 0, 0, 0);

                return scheduleDate.getTime() === selectedDate.getTime() &&
                    schedule.onCallSession === session;
            });
        });
    };

    const handleOnCallSessionChange = (value) => {
        if (requestSchedule.dateTo) {
            const hasConflict = checkScheduleConflict(requestSchedule.dateTo, value);
            if (hasConflict) {
                showError('Buổi trực trùng với lịch trực hiện tại!');
                return;
            }
        }
        handleRequestChange('onCallSessionChange', value);
    };

    const handleDateChange = (e) => {
        const newDate = new Date(e.target.value).toISOString().split('T')[0];
        if (requestSchedule.onCallSessionChange) {
            const hasConflict = checkScheduleConflict(newDate, requestSchedule.onCallSessionChange);
            if (hasConflict) {
                showError('Buổi trực trùng với lịch trực hiện tại!');
                return;
            }
        }
        handleRequestChange('dateTo', newDate);
    };

    const fetchData = async () => {
        try {
            const userId = user._id;
            const schoolYear = selectedSchoolYear;
            const semester = selectedSemester;

            const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/oncall-schedule/`, {
                params: { userId, schoolYear, semester },
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });

            const data = response.data;
            setScheduleData(data);

            const currentWeek = getWeekContainingDate(new Date(), data);
            setSelectedWeek(currentWeek ? currentWeek.toString() : "1");

        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
        }
    };

    // Xin vắng/ đổi lịch trực
    const saveOnCallSchedule = async () => {
        if (selectedOption === 'absent') {
            if (!(requestSchedule.reason).trim()) {
                showError('Vui lòng nhập lý do vắng!');
                return;
            }
        }
        if (selectedOption === 'reschedule') {

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (!requestSchedule.dateTo) {
                showError('Vui lòng chọn ngày đổi buổi!');
                return;
            }
            if (!requestSchedule.onCallSessionChange) {
                showError('Vui lòng chọn buổi thay thế!');
                return;
            }
            if (requestSchedule.dateTo <= today) {
                showError('Vui lòng chọn ngày đổi hợp lệ!');
                return;
            }
            const hasConflict = checkScheduleConflict(
                requestSchedule.dateTo,
                requestSchedule.onCallSessionChange
            );
            if (hasConflict) {
                showError('Buổi trực trùng với lịch trực hiện tại!');
                return;
            }
        }

        const requestData = {
            selectedOption,
            requestSchedule: {
                ...requestSchedule,
                typeRequest: selectedOption === 'reschedule' ? false : true,
            }
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/request-schedule/`, {
                credentials: 'include',
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify(requestData)
            });
            const data = await response.json();
            if (data.success) {
                toast.current.show({
                    severity: 'success',
                    summary: 'Yêu cầu đã được gửi!',
                    detail: 'Chờ phê duyệt từ Ban Chủ Nhiệm Khoa',
                    life: 3000
                });
                hideAbsentDialog();
                fetchData();
            } else {
                showError('Có lỗi xảy ra. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Có lỗi xảy ra. Vui lòng thử lại!');
        }

    };

    useEffect(() => {
        if (isAuthenticated) {
            getSchoolYearAndSemester();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && selectedSchoolYear && selectedSemester) {
            const fetchAndSetData = async () => {
                await fetchData();
            };

            fetchAndSetData();
        }
    }, [selectedSchoolYear, selectedSemester]);

    const getSchedulesForDay = (week, day) => {
        return week.schedules.filter(schedule => {
            const scheduleDay = new Date(schedule.date).getDay();
            return scheduleDay === dayMap[day];
        });
    };

    const selectedWeekData = scheduleData.filter(
        (week, index) => (selectedWeek ? (index + 1) === Number(selectedWeek) : true)
    );

    // Xin vắng / đổi buổi
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [absentDialog, setAbsentDialog] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const showError = (message) => {
        toast.current.show({ severity: 'error', summary: 'Lỗi', detail: message, life: 3000 });
    };

    const [requestSchedule, setRequestSchedule] = useState({
        day: '',
        onCallSession: '',
        dayChange: '',
        openId: '',
        userID: '',
        onCallScheduleId: '',
        dateFrom: null,
        dateTo: null,
        typeRequest: false,
        reason: '',
        statusId: null,
        onCallSessionChange: '',
        note: ''
    });
    const openDialog = (schedule) => {
        setSelectedSchedule(schedule);
        setAbsentDialog(true);
        setSelectedOption('absent');
    };
    const hideAbsentDialog = () => {
        setAbsentDialog(false);
    };
    const absentDialogFooter = (
        <>
            <Button label="Hủy bỏ" icon="pi pi-times" outlined onClick={hideAbsentDialog} />
            <Button label="Lưu" icon="pi pi-check" severity='success' onClick={saveOnCallSchedule} />
        </>
    );
    const radioOptions = [
        { label: 'Xin vắng', value: 'absent' },
        { label: 'Đổi buổi trực', value: 'reschedule' },
    ];
    const sessionOptions = [
        { label: 'Sáng', value: 'S' },
        { label: 'Chiều', value: 'C' }
    ];
    function getDate(onCallSchedule) {
        if (!onCallSchedule) {
            return "";
        }
        const dateOptions = { day: 'numeric', month: 'numeric', year: 'numeric' };
        const sessionLabel = onCallSchedule.onCallSession === 'S' ? 'Buổi sáng' : 'Buổi chiều';
        const formattedDate = new Date(onCallSchedule.date).toLocaleDateString('vi-VN', dateOptions);
        return `${sessionLabel}, ngày ${formattedDate}`;
    }
    const handleRequestChange = (fieldName, value) => {
        setRequestSchedule((prevRequestSchedule) => ({
            ...prevRequestSchedule,
            [fieldName]: value
        }));
    };
    useEffect(() => {
        if (selectedSchedule) {
            setRequestSchedule((prevRequestSchedule) => ({
                ...prevRequestSchedule,
                day: selectedSchedule.day,
                onCallSession: selectedSchedule.onCallSession,
                dateFrom: selectedSchedule.date,
                openId: selectedSchedule.openID,
                userID: selectedSchedule.userID,
                onCallScheduleId: selectedSchedule._id,
            }));
        }
    }, [selectedSchedule]);

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
                    .schedule-tag {
                        color: #000;
                        border-radius: 0;
                        border: none;
                        padding: 0.25rem 0.5rem;
                        font-weight: normal;
                        font-size: 0.9rem;
                    }
                `}
            </style>
            <div className="card">
                <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '5px', width: '100%' }}>
                    <div className="col-md-4 form-group">
                        <label>Năm học:</label>
                        <select
                            className="form-control width-70"
                            value={selectedSchoolYear}
                            onChange={(e) => setSelectedSchoolYear(e.target.value)}
                        >
                            {schoolYearOptions.map((option, index) => (
                                <option key={index} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-4 form-group">
                        <label>Học kỳ:</label>
                        <select
                            className="form-control width-70"
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                        >
                            {semesterOptions.map((option, index) => (
                                <option key={index} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-4 form-group">
                        <label>Tuần:</label>
                        <select
                            className="form-control width-70"
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                        >
                            {weekOptions.map((week, index) => (
                                <option key={index} value={week.value}>
                                    {week.select}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <label style={{ fontSize: '12px' }}>*Hướng dẫn: Nhấn vào <Tag
                    value="Đỏ: (Vắng Trực)"
                    severity="danger"
                    style={{ fontSize: '11px', color: '#fff', fontWeight: 'normal' }}
                /> hoặc <Tag
                        value="Xám: (N/A)"
                        // severity="primary"
                        className="small-button border-round-lg coming-color schedule-tag"
                    /> để có thể xin nghỉ hoặc đổi buổi trực</label><br /><br />
            </div>
            <div className="card">
                <div className="card-body">
                    {selectedWeekData.length > 0 ? (

                        selectedWeekData.map((week, index) => (
                            <div key={index} style={{ marginBottom: '20px' }}>
                                <div className="alert alert-warning smallTxt config-alert">
                                    {selectedWeek ? (
                                        <strong>{`Tuần ${selectedWeek}: ${weekOptions.find(w => w.value.toString() === selectedWeek)?.display || ''}`}</strong>
                                    ) : (
                                        <strong></strong>
                                    )}
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table className='table'>
                                        <thead>
                                            <tr>
                                                <th></th>
                                                <th>Thứ hai</th>
                                                <th>Thứ ba</th>
                                                <th>Thứ tư</th>
                                                <th>Thứ năm</th>
                                                <th>Thứ sáu</th>
                                                <th>Thứ bảy</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <th className="morning">Sáng</th>
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                                    <td key={day}>
                                                        {getSchedulesForDay(week, day).filter(s => s.onCallSession === 'S').map((schedule, i) => {
                                                            const currentDateUTC = new Date();
                                                            const timeInS = week.time_In_S.split(":");
                                                            const timeOutS = week.time_Out_S.split(":");
                                                            const morningStartTimeUTC = new Date(schedule.date);
                                                            const morningEndTimeUTC = new Date(schedule.date);

                                                            morningStartTimeUTC.setUTCHours(parseInt(timeInS[0]), parseInt(timeInS[1]), 0);
                                                            morningEndTimeUTC.setUTCHours(parseInt(timeOutS[0]), parseInt(timeOutS[1]), 0);

                                                            const lateThresholdUTC = new Date(morningStartTimeUTC.getTime() + (1 * 60 * 60 * 1000));
                                                            const earlyLeaveThresholdUTC = new Date(morningEndTimeUTC.getTime() - (1 * 60 * 60 * 1000));

                                                            const checkinTimeUTC = schedule.checkinTime ? new Date(schedule.checkinTime) : null;
                                                            const checkoutTimeUTC = schedule.checkoutTime ? new Date(schedule.checkoutTime) : null;

                                                            if (schedule.attendance) {
                                                                if (checkinTimeUTC && new Date(checkinTimeUTC) > lateThresholdUTC && checkoutTimeUTC) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <Tag value={`Vào: ${checkinTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value={`Ra: ${checkoutTimeUTC ? checkoutTimeUTC.toISOString().slice(11, 19) : ''}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value="Đến trễ" severity="warning" className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }

                                                                if (checkoutTimeUTC && new Date(checkoutTimeUTC) < earlyLeaveThresholdUTC) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <Tag value={`Vào: ${checkinTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value={`Ra: ${checkoutTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value="Về sớm" severity="warning" className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }

                                                                if (!checkoutTimeUTC) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <Tag value={`Vào: ${checkinTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value={`Ra: N/A`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value="Chưa checkout" severity="info" className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div key={i} className="schedule-cell">
                                                                        <span className="customize-data">
                                                                            <label className="schedule-name">{schedule.fullName}</label>
                                                                            <Tag value={`Vào: ${checkinTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                            <Tag value={`Ra: ${checkoutTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                            <Tag value="Đã trực" severity="success" className="schedule-tag" />
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }

                                                            if (schedule.requestSchedule) {
                                                                if (schedule.requestStatus === 1) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <label className="schedule-name">{schedule.fullName}</label>
                                                                                <Tag
                                                                                    value="Chờ duyệt"
                                                                                    severity="warning"
                                                                                    className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                } else if (schedule.requestStatus === 2) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <label className="schedule-name">{schedule.fullName}</label>
                                                                                <Tag
                                                                                    value="Từ chối"
                                                                                    severity="danger"
                                                                                    className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                } else if (schedule.requestStatus === 3) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <label className="schedule-name">{schedule.fullName}</label>
                                                                                <Tag
                                                                                    value="Đã duyệt"
                                                                                    severity="success"
                                                                                    className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                            }

                                                            if (morningEndTimeUTC >= currentDateUTC) {
                                                                return <div key={i}>
                                                                    <Button label="N/A"
                                                                        className="small-button border-round-lg coming-color schedule-tag"
                                                                        onClick={() => openDialog(schedule)}
                                                                    /></div>;
                                                            }

                                                            // Nếu ngày buổi trực < ngày hiện tại và attendance = false
                                                            if (morningEndTimeUTC < currentDateUTC && !schedule.attendance) {
                                                                return <div key={i}>
                                                                    <Button label="Vắng trực"
                                                                        className="small-button off-color schedule-tag"
                                                                        onClick={() => openDialog(schedule)}
                                                                    /></div>;
                                                            }

                                                        })}
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr>
                                                <th className="afternoon">Chiều</th>
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                                    <td key={day}>
                                                        {getSchedulesForDay(week, day).filter(s => s.onCallSession === 'C').map((schedule, i) => {
                                                            const currentDateUTC = new Date().toISOString();
                                                            const timeInC = week.time_In_C.split(":");
                                                            const timeOutC = week.time_Out_C.split(":");
                                                            const afternoonStartTimeUTC = new Date(schedule.date);
                                                            const afternoonEndTimeUTC = new Date(schedule.date);

                                                            afternoonStartTimeUTC.setUTCHours(parseInt(timeInC[0]), parseInt(timeInC[1]), 0);
                                                            afternoonEndTimeUTC.setUTCHours(parseInt(timeOutC[0]), parseInt(timeOutC[1]), 0);

                                                            const lateThresholdUTC = new Date(afternoonStartTimeUTC.getTime() + (1 * 60 * 60 * 1000));
                                                            const earlyLeaveThresholdUTC = new Date(afternoonEndTimeUTC.getTime() - (1 * 60 * 60 * 1000));

                                                            const checkinTimeUTC = schedule.checkinTime ? new Date(schedule.checkinTime) : null;
                                                            const checkoutTimeUTC = schedule.checkoutTime ? new Date(schedule.checkoutTime) : null;

                                                            if (schedule.attendance) {
                                                                if (checkinTimeUTC && new Date(checkinTimeUTC) > lateThresholdUTC && checkoutTimeUTC) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <Tag value={`Vào: ${checkinTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value={`Ra: ${checkoutTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value="Đến trễ" severity="warning" className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }

                                                                if (checkoutTimeUTC && new Date(checkoutTimeUTC) < earlyLeaveThresholdUTC) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <Tag value={`Vào: ${checkinTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value={`Ra: ${checkoutTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value="Về sớm" severity="warning" className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }

                                                                if (!checkoutTimeUTC) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <Tag value={`Vào: ${checkinTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value={`Ra: N/A`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value="Chưa checkout" severity="info" className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div key={i} className="schedule-cell">
                                                                        <span className="customize-data">
                                                                            <label className="schedule-name">{schedule.fullName}</label>
                                                                            <Tag value={`Vào: ${checkinTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                            <Tag value={`Ra: ${checkoutTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                            <Tag value="Đã trực" severity="success" className="schedule-tag" />
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }

                                                            if (schedule.requestSchedule) {
                                                                if (schedule.requestStatus === 1) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <label className="schedule-name">{schedule.fullName}</label>
                                                                                <Tag
                                                                                    value="Chờ duyệt"
                                                                                    severity="warning"
                                                                                    className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                } else if (schedule.requestStatus === 2) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <label className="schedule-name">{schedule.fullName}</label>
                                                                                <Tag
                                                                                    value="Từ chối"
                                                                                    severity="danger"
                                                                                    className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                } else if (schedule.requestStatus === 3) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <label className="schedule-name">{schedule.fullName}</label>
                                                                                <Tag
                                                                                    value="Đã duyệt"
                                                                                    severity="success"
                                                                                    className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                            }

                                                            if (afternoonEndTimeUTC >= new Date(currentDateUTC)) {
                                                                return (
                                                                    <div key={i}>
                                                                        <Button label="N/A"
                                                                            className="small-button border-round-lg coming-color schedule-tag"
                                                                            onClick={() => openDialog(schedule)}
                                                                        />
                                                                    </div>
                                                                );
                                                            }

                                                            if (afternoonEndTimeUTC < new Date(currentDateUTC) && !schedule.attendance) {
                                                                return (
                                                                    <div key={i}>
                                                                        <Button label="Vắng trực"
                                                                            className="small-button off-color schedule-tag"
                                                                            onClick={() => openDialog(schedule)}
                                                                        />
                                                                    </div>
                                                                );
                                                            }

                                                        })}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))

                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className='table'>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Thứ hai</th>
                                        <th>Thứ ba</th>
                                        <th>Thứ tư</th>
                                        <th>Thứ năm</th>
                                        <th>Thứ sáu</th>
                                        <th>Thứ bảy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <th className="morning">Sáng</th>
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                            <td key={day}>
                                                <div className="custom-td"></div>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th className="afternoon">Chiều</th>
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                            <td key={day}>
                                                <div className="custom-td"></div>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Xin nghỉ / đổi buổi trực */}
            <Dialog
                visible={absentDialog}
                style={{ width: '40rem' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Yêu cầu nghỉ hoặc đổi buổi trực"
                modal
                className="p-fluid"
                footer={absentDialogFooter}
                onHide={hideAbsentDialog}
            >
                <div className="radio-group-row mb-4">
                    {radioOptions.map((option) => (
                        <div key={option.value} className="p-field-radiobutton">
                            <RadioButton
                                inputId={option.value}
                                name="scheduleOption"
                                value={option.value}
                                onChange={(e) => setSelectedOption(e.value)}
                                checked={selectedOption === option.value}
                            />
                            <label htmlFor={option.value} style={{ marginLeft: '0.5rem', marginRight: '1rem' }}>{option.label}</label>
                        </div>
                    ))}
                </div>
                <hr />
                {selectedOption === 'absent' && (
                    <div className="field mt-3">
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ marginRight: '2rem' }}>Xin nghỉ buổi trực:</span>
                            <span style={{ color: '#17a2b8' }}>{selectedSchedule && getDate(selectedSchedule)}</span>
                        </div>
                        <div>
                            <label htmlFor="reason">Lí do vắng:</label>
                            <InputTextarea
                                id="reason"
                                value={requestSchedule.reason}
                                onChange={(e) => handleRequestChange('reason', e.target.value)}
                                rows={5}
                                cols={30}
                                style={{ marginTop: '1rem', resize: 'none' }}
                            />
                        </div>
                    </div>
                )}
                {selectedOption === 'reschedule' && (
                    <div className="field mt-3">
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ marginRight: '2rem' }}>Xin đổi buổi trực:</span>
                            <span style={{ color: '#17a2b8' }}>{selectedSchedule && getDate(selectedSchedule)}</span>
                        </div>
                        <div className="radio-group-row mb-4">
                            <label htmlFor="reason" style={{ width: '5rem' }}>Sang buổi trực:</label>
                            <InputText
                                id="dateTo"
                                value={requestSchedule.dateTo}
                                type="date"
                                onChange={handleDateChange}
                            />
                        </div>
                        <div className="radio-group-row mb-4" style={{ marginTop: '1rem' }}>
                            <label htmlFor="onCallSessionChange">Chọn buổi:</label>
                            {sessionOptions.map((option) => (
                                <div key={option.value} className="p-field-radiobutton">
                                    <RadioButton
                                        inputId={option.value}
                                        name="onCallSessionChange"
                                        value={option.value}
                                        onChange={(e) => handleOnCallSessionChange(e.value)}
                                        checked={requestSchedule.onCallSessionChange === option.value}
                                    />
                                    <label htmlFor={option.value} style={{ marginLeft: '0.5rem', marginRight: '1rem' }}>
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default SchedulerCalendar;
