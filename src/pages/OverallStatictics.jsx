import React, { useEffect, useState, useRef } from 'react';

import useDocumentTitle from '../config/useDocumentTitle';
import { useAuth } from "../context/Context";
import { StatisticsService } from '../service/StatisticsService';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Chart } from 'primereact/chart';
import { TabMenu } from 'primereact/tabmenu';
import { Button } from 'primereact/button';

const OverallStatictics = () => {
    useDocumentTitle('Thống kê');

    const { isAuthenticated, user } = useAuth();

    const [data, setData] = useState(null);

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
        try {
            const stats = await StatisticsService.getStatistics(selectedSchoolYear, selectedSemester);
            setData(stats);
        } catch (error) {
            console.error("Failed to fetch statistics:", error);
            setData([]);
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

    const [requestChartData, setRequestChartData] = useState({});
    const [oncallChartData, setOncallChartData] = useState({});
    const [chartOptions, setChartOptions] = useState({});
    useEffect(() => {
        if (data && data.totals) {
            const documentStyle = getComputedStyle(document.documentElement);

            const requestChartDataset = {
                labels: ['Yêu cầu được duyệt', 'Yêu cầu bị từ chối', "Yêu cầu chưa được phản hồi"],
                datasets: [
                    {
                        data: [data.totals.totalApproved, data.totals.totalRejected, data.totals.totalPendingRequests],
                        backgroundColor: [
                            documentStyle.getPropertyValue('--green-500'),
                            documentStyle.getPropertyValue('--red-500'),
                            documentStyle.getPropertyValue('--yellow-500'),
                        ],
                        hoverBackgroundColor: [
                            documentStyle.getPropertyValue('--green-400'),
                            documentStyle.getPropertyValue('--red-400'),
                            documentStyle.getPropertyValue('--yellow-400'),
                        ]
                    }
                ]
            };

            const oncallChartDataset = {
                labels: ['Số buổi đã trực', 'Số buổi vắng', "Số buổi chưa tới lịch"],
                datasets: [
                    {
                        data: [data.totals.totalPresent, data.totals.totalAbsent, data.totals.totalPending],
                        backgroundColor: [
                            documentStyle.getPropertyValue('--green-500'),
                            documentStyle.getPropertyValue('--red-500'),
                            documentStyle.getPropertyValue('--yellow-500'),
                        ],
                        hoverBackgroundColor: [
                            documentStyle.getPropertyValue('--green-400'),
                            documentStyle.getPropertyValue('--red-400'),
                            documentStyle.getPropertyValue('--yellow-400'),
                        ]
                    }
                ]
            };

            const chartOptionsConfig = {
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true
                        }
                    }
                }
            };

            setRequestChartData(requestChartDataset);
            setOncallChartData(oncallChartDataset);
            setChartOptions(chartOptionsConfig);
        }
    }, [data]);

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

                    .chart-container {
                        width: 30%;
                        padding: 20px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }

                    .chart {
                        width: 100%;
                        height: auto;
                    }

                    .chart-title {
                        margin-top: 16px;
                        text-align: center;
                        font-weight: 600;
                        color: #4a5568;
                    }

                    .flex {
                        display: flex;
                    }

                    .flex-wrap {
                        flex-wrap: wrap;
                    }

                    .justify-center {
                        justify-content: center;
                    }

                    .items-start {
                        align-items: flex-start;
                    }

                    .gap-8 {
                        gap: 2rem;
                    }

                    .my-3 {
                        margin-top: 0.75rem;
                        margin-bottom: 0.75rem;
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
            </div>

            <div className="card">
                {data && data.totals ? (
                    <div className="flex flex-wrap justify-center items-start gap-8 my-3">
                        <div className="chart-container">
                            <Chart type="pie" data={requestChartData} options={chartOptions} className="chart" />
                            <div className="chart-title">Thống kê số lượng yêu cầu được gửi đi</div>
                        </div>

                        <div className="chart-container">
                            <Chart type="pie" data={oncallChartData} options={chartOptions} className="chart" />
                            <div className="chart-title">Thống kê tình trạng trực khoa</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">Không có dữ liệu</div> 
                )}
            </div>
        </>
    )
}

export default OverallStatictics;