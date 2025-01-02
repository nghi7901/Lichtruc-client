import React, { useEffect, useState } from 'react';
import { useAuth } from "../context/Context";
import useDocumentTitle from '../config/useDocumentTitle';
import axios from 'axios';

import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

const HistoryOnCall = () => {
    useDocumentTitle('Chi tiết lịch trực');
    const { user, isAuthenticated } = useAuth();

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

    const fetchData = async () => {
        try {
            const schoolYear = selectedSchoolYear;
            const semester = selectedSemester;

            const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/oncall-schedule/schedules/`, {
                withCredentials: true,
                params: { schoolYear, semester },
            });

            const data = response.data;
            setScheduleData(data);

            const currentWeek = getWeekContainingDate(new Date(), data);
            setSelectedWeek(currentWeek ? currentWeek.toString() : "1");

        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        getSchoolYearAndSemester();
    }, []);

    useEffect(() => {
        if (selectedSchoolYear && selectedSemester) {
            const fetchAndSetData = async () => {
                await fetchData();
            };

            fetchAndSetData();
        }
    }, [selectedSchoolYear, selectedSemester]);

    useEffect(() => {
        if (scheduleData.length > 0) {
            const currentWeek = getWeekContainingDate(new Date(), scheduleData);
            setSelectedWeek(currentWeek ? currentWeek.toString() : "1");
        }
    }, [scheduleData]);

    const getSchedulesForDay = (week, day) => {
        return week.schedules.filter(schedule => {
            const scheduleDay = new Date(schedule.date).getDay();
            return scheduleDay === dayMap[day];
        });
    };

    const selectedWeekData = scheduleData.filter(
        (week, index) => (selectedWeek ? (index + 1) === Number(selectedWeek) : true)
    );

    // Xuất file Excel
    const handleExportExcel = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/oncall-schedule/export`, {
                credentials: 'include',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ schoolYear: selectedSchoolYear, semester: selectedSemester })
            });

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Lichsutruc__Hocky${selectedSemester}_${selectedSchoolYear}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Lỗi tải file:', error);
        }
    };

    return (
        <div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <label style={{ fontSize: '12px' }}>*Hướng dẫn: &ensp;
                            <Tag
                                value="Đỏ: Vắng Trực"
                                severity="danger"
                                style={{ fontSize: '11px', color: '#000', fontWeight: 'normal' }}
                            /> &ensp;
                            <Tag
                                value="Xám: N/A (Chưa tới buổi trực)"
                                style={{ fontSize: '11px', color: '#000', backgroundColor: '#dcdfe1', fontWeight: 'normal' }}
                            />
                            &ensp;
                            <Tag
                                value="Xanh lá: Đã trực"
                                severity="success"
                                style={{ fontSize: '11px', color: '#000', fontWeight: 'normal' }}
                            />
                            &ensp;
                            <Tag
                                value="Đến trễ/Về sớm"
                                severity="warning"
                                style={{ fontSize: '11px', color: '#000', fontWeight: 'normal' }}
                            />
                            &ensp;
                            <Tag
                                value="Chưa checkout"
                                severity="info"
                                style={{ fontSize: '11px', color: '#000', fontWeight: 'normal' }}
                            />
                        </label>
                    </div>
                    <Button
                        onClick={handleExportExcel}
                        style={{ fontSize: '12px' }}
                        label="Xuất file Excel"
                        icon="pi pi-file-export"
                        severity="success"
                        className='small-button'
                    />
                </div>

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
                                                            const currentDateUTC = new Date().toISOString();
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
                                                                                <label className="schedule-name">{schedule.fullName}</label>
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
                                                                                <label className="schedule-name">{schedule.fullName}</label>
                                                                                <Tag value={`Vào: ${checkinTimeUTC.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value={`Ra: ${checkoutTimeUTC?.toISOString().slice(11, 19)}`} style={{ backgroundColor: '#fff', fontWeight: 'normal' }} className="schedule-tag" />
                                                                                <Tag value="Về sớm" severity="warning" className="schedule-tag" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }

                                                                if (!checkoutTimeUTC) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <label className="schedule-name">{schedule.fullName}</label>
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

                                                            if (morningEndTimeUTC >= new Date(currentDateUTC)) {
                                                                return (
                                                                    <div key={i} className="schedule-cell">
                                                                        <span className="customize-data">
                                                                            <label className="schedule-name">{schedule.fullName}</label>
                                                                            <Tag value="N/A" style={{ backgroundColor: '#dcdfe1' }} className="schedule-tag" />
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }

                                                            if (morningEndTimeUTC < new Date(currentDateUTC) && !schedule.attendance) {
                                                                return (
                                                                    <div key={i} className="schedule-cell">
                                                                        <span className="customize-data">
                                                                            <label className="schedule-name">{schedule.fullName}</label>
                                                                            <Tag value="Vắng trực" severity="danger" className="schedule-tag" />
                                                                        </span>
                                                                    </div>
                                                                );
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
                                                                if (checkinTimeUTC && new Date(checkinTimeUTC) > lateThresholdUTC  && checkoutTimeUTC) {
                                                                    return (
                                                                        <div key={i} className="schedule-cell">
                                                                            <span className="customize-data">
                                                                                <label className="schedule-name">{schedule.fullName}</label>
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
                                                                                <label className="schedule-name">{schedule.fullName}</label>
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
                                                                                <label className="schedule-name">{schedule.fullName}</label>
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

                                                            if (afternoonEndTimeUTC >= new Date(currentDateUTC)) {
                                                                return (
                                                                    <div key={i} className="schedule-cell">
                                                                        <span className="customize-data">
                                                                            <label className="schedule-name">{schedule.fullName}</label>
                                                                            <Tag value="N/A" style={{ backgroundColor: '#dcdfe1' }} className="schedule-tag" />
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }

                                                            if (afternoonEndTimeUTC < new Date(currentDateUTC) && !schedule.attendance) {
                                                                return (
                                                                    <div key={i} className="schedule-cell">
                                                                        <span className="customize-data">
                                                                            <label className="schedule-name">{schedule.fullName}</label>
                                                                            <Tag value="Vắng trực" severity="danger" className="schedule-tag" />
                                                                        </span>
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
        </div>
    );
};

export default HistoryOnCall;
