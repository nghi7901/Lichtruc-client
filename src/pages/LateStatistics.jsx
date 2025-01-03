import React, { useEffect, useState, useRef } from 'react';

import useDocumentTitle from '../config/useDocumentTitle';
import { useAuth } from "../context/Context";
import { StatisticsService } from '../service/StatisticsService';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';

const LateStatistics = () => {
    useDocumentTitle('Thống kê quên checkout');

    const { isAuthenticated, user } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState(null);
    const dt = useRef(null);

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
    const [selectedSchoolYear, setSelectedSchoolYear] = useState(schoolYearOptions[0]?.value || "");
    const [selectedSemester, setSelectedSemester] = useState(semesterOptions[0]?.value || "");
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

    // Lấy dữ liệu
    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const stats = await StatisticsService.getLateStatistics(selectedSchoolYear, selectedSemester);
            setData(stats);
        } catch (error) {
            console.error("Failed to fetch statistics:", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getSchoolYearAndSemester();
    }, []);

    useEffect(() => {
        if (isAuthenticated && selectedSchoolYear && selectedSemester) {
            fetchStatistics();
        }
    }, [isAuthenticated, selectedSchoolYear, selectedSemester]);

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <span className="text-xl text-900 font-bold">Thống kê chung</span>
            <div>
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Nhập từ khóa tìm kiếm" />
            </div>
        </div>
    );

    // Xuất file Excel
    const handleExportExcel = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/statistics/export-excel/late`, {
                credentials: 'include',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ schoolYear: selectedSchoolYear, semester: selectedSemester })
            });

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'ThongKeNoCheckout.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Lỗi tải file:', error);
        }
    };

    return (
        <>
            <style>
                {`
                    .width-70 {
                        width: 70%;
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
                </div>
                {data?.totals ? (
                    <>
                        <div className="d-flex justify-content-between align-items-center row py-1 mx-4 gap-md-0">
                            <div>
                                <label>Tổng số buổi về sớm:</label> &nbsp;
                                <Tag
                                    value={data.totals.totalLeaveEarly}
                                    severity="warning"
                                    style={{ fontSize: '1.25rem' }}
                                />
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center row py-1 mx-4 gap-md-0">
                            <div>
                                <label>Tổng số buổi đến trễ:</label> &nbsp;
                                <Tag
                                    value={data.totals.totalLate}
                                    severity="warning"
                                    style={{ fontSize: '1.25rem' }}
                                />
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center row py-1 mx-4 gap-md-0">
                            <div>
                                <label>Tổng số không check out:</label> &nbsp;
                                <Tag
                                    value={data.totals.totalNoCheckout}
                                    severity="warning"
                                    style={{ fontSize: '1.25rem' }}
                                />
                            </div>
                        </div>

                    </>
                ) : (null)}
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div />
                    <Button
                        onClick={handleExportExcel}
                        style={{ fontSize: '12px' }}
                        label="Xuất thống kê"
                        icon="pi pi-file-export"
                        severity="success"
                        className='small-button'
                    />
                </div>
                <DataTable ref={dt} value={data?.lecturers}
                    dataKey="id" paginator rows={5} rowsPerPageOptions={[5, 10, 25]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Hiển thị {first} tới {last} trong tổng số {totalRecords} giảng viên"
                    globalFilter={globalFilter} header={header}
                    loading={loading}
                    loadingIcon="pi pi-spin pi-spinner"
                    emptyMessage="Không có dữ liệu">
                    <Column field="codeProfessional" header="Mã giảng viên" sortable
                        style={{ minWidth: '6rem', fontSize: '0.9rem' }}
                    ></Column>
                    <Column field="fullName" header="Họ và tên" sortable
                        style={{ minWidth: '8rem', fontSize: '0.9rem' }}
                    ></Column>
                    <Column field="totalPresentLate" header="Số buổi đến trễ" sortable
                        style={{ minWidth: '5rem', fontSize: '0.9rem' }}
                    ></Column>
                    <Column field="totalLeaveEarly" header="Số buổi về sớm" sortable
                        style={{ minWidth: '5rem', fontSize: '0.9rem' }}
                    ></Column>
                    <Column field="totalNoCheckout" header="Số buổi không check out" sortable
                        style={{ minWidth: '5rem', fontSize: '0.9rem' }}
                    ></Column>
                </DataTable>
            </div>
        </>
    )
}

export default LateStatistics;