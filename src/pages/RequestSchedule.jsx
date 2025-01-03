import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from "../context/Context";
import { useLocation, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../config/useDocumentTitle';
import axios from 'axios';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { InputTextarea } from 'primereact/inputtextarea';

const RequestSchedule = () => {
    useDocumentTitle('Danh sách yêu cầu');
    const dt = useRef(null);
    const toast = useRef(null);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const [requestData, setRequestData] = useState([]);
    const [filteredRequestData, setFilteredRequestData] = useState([]);

    const [globalFilter, setGlobalFilter] = useState(null);
    const [typeFilter, setTypeFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);

    const isLecturer = user?.role?.role_name === 'Giảng viên';
    const isFaculty = user?.role?.role_name === 'Ban chủ nhiệm';
    const isAdmin = user?.role?.role_name === 'Quản trị';

    // Xử lý năm học + học kỳ
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

    // Trạng thái
    const statusOptions = [
        { label: 'Chờ duyệt', value: 1 },
        { label: 'Từ chối', value: 2 },
        { label: 'Đã duyệt', value: 3 }
    ];
    const getStatus = (val) => {
        switch (val) {
            case 1:
                return 'warning';
            case 2:
                return 'danger';
            case 3:
                return 'success';

            default:
                return null;
        }
    };
    const getStatusLabel = (val) => {
        const status = statusOptions.find(status => status.value === val);
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

    // Loại yêu cầu
    const typeOptions = [
        { label: 'Xin vắng', value: 1 },
        { label: 'Đổi buổi trực', value: 2 }
    ];
    const getTypeLabel = (val) => {
        const type = typeOptions.find(type => type.value === val);
        return type ? type.label : null;
    };
    const typeBodyTemplate = (rowData) => {
        return (
            <Tag
                value={getTypeLabel(rowData.typeRequest)}
                className='bg-white text-color font-normal'
                style={{ fontSize: '1rem' }}
            />
        );
    };

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
    const fetchData = async () => {
        setLoading(true);
        try {
            const userId = user._id;
            const schoolYear = selectedSchoolYear;
            const semester = selectedSemester;

            const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/request-schedule`, {
                params: { userId, schoolYear, semester },
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                },
            });

            const data = response.data;
            setRequestData(data);
            setFilteredRequestData(data);

        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
        } finally {
            setLoading(false); 
        }
    };
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
    const handleTypeFilterChange = (value) => {
        setTypeFilter(value);
        filterData(value, statusFilter);
    };

    const handleStatusFilterChange = (value) => {
        setStatusFilter(value);
        filterData(typeFilter, value);
    };

    const filterData = (type, status) => {
        const filtered = requestData.filter((item) => {
            const matchesType = type ? item.typeRequest === type : true;
            const matchesStatus = status ? item.statusId === status : true;
            return matchesType && matchesStatus;
        });
        setFilteredRequestData(filtered);
    };

    const reqHeader = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <span className="text-m text-900">Danh sách yêu cầu</span>
            <div className="flex gap-2">
                <Dropdown
                    value={typeFilter}
                    options={typeOptions}
                    onChange={(e) => handleTypeFilterChange(e.value)}
                    placeholder="Lọc loại yêu cầu"
                    className="p-mr-2"
                />
                <Dropdown
                    value={statusFilter}
                    options={statusOptions}
                    onChange={(e) => handleStatusFilterChange(e.value)}
                    placeholder="Lọc trạng thái"
                    className="p-mr-2"
                />
            </div>
        </div>
    );

    // Xem chi tiết
    const [curReq, setCurReq] = useState(null);
    const [viewDialog, setViewDialog] = useState(false);
    const dayMapping = {
        Mon: "Thứ hai",
        Tue: "Thứ ba",
        Wed: "Thứ tư",
        Thu: "Thứ năm",
        Fri: "Thứ sáu",
        Sat: "Thứ bảy",
        Sun: "Chủ nhật",
    };
    const openDialogForDetails = (request) => {
        setCurReq(request);
        setViewDialog(true);
    };
    const hideViewDialog = () => {
        setViewDialog(false);
    };
    const viewDialogFooter = (
        <>
            {isLecturer && curReq?.statusId === 1 && (
                <Button
                    label="Xóa"
                    icon="pi pi-trash"
                    severity="danger" outlined
                    onClick={() => confirmDeleteReq(curReq)}
                />
            )}
            {(isFaculty || isAdmin) && curReq?.statusId === 1 && (
                <>
                    <Button
                        label="Từ chối"
                        icon="pi pi-times-circle"
                        severity="danger" outlined
                        onClick={() => confirmDeny(curReq)}
                    />
                    <Button
                        label="Duyệt"
                        icon="pi pi-check"
                        severity="success" outlined
                        onClick={() => confirmAccept(curReq)}
                    />
                </>
            )}
            <Button label="Đóng"
                icon="pi pi-times" outlined
                onClick={hideViewDialog} />
        </>
    );

    // Từ chối yêu cầu
    const [denyDialog, setDenyDialog] = useState(false);
    const denyReq = async () => {
        const reqData = {
            _id: curReq._id,
            statusId: 2,
            note: curReq.note,
        };
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/request-schedule/`, {
                credentials: 'include',
                method: 'PUT',
                headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reqData),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            fetchData();

            setDenyDialog(false);
            setViewDialog(false);
            setCurReq(null);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Từ chối yêu cầu thành công', life: 3000 });

        } catch (error) {
            console.error('Error:', error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi từ chối yêu cầu', life: 3000 });
        }
    };
    const confirmDeny = (req) => {
        setDenyDialog(true);
    };
    const hideDenyDialog = () => {
        setDenyDialog(false);
    };
    const denyDialogFooter = (
        <>
            <Button label="Hủy bỏ" icon="pi pi-times" outlined onClick={hideDenyDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={denyReq} />
        </>
    );

    // Duyệt
    const [acceptDialog, setAcceptDialog] = useState(false);
    const acceptReq = async () => {
        const reqData = {
            _id: curReq._id,
            statusId: 3,
        };
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/request-schedule/`, {
                credentials: 'include',
                method: 'PUT',
                headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reqData),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            fetchData();

            setAcceptDialog(false);
            setViewDialog(false);
            setCurReq(null);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Duyệt yêu cầu thành công', life: 3000 });

        } catch (error) {
            console.error('Error:', error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi duyệt yêu cầu', life: 3000 });
        }
    };
    const confirmAccept = (req) => {
        setAcceptDialog(true);
    };
    const hideAcceptDialog = () => {
        setAcceptDialog(false);
    };
    const acceptDialogFooter = (
        <>
            <Button label="Hủy bỏ" icon="pi pi-times" outlined onClick={hideAcceptDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={acceptReq} />
        </>
    );

    // Xóa yêu cầu
    const [deleteReqDialog, setDeleteReqDialog] = useState(false);
    const deleteReq = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/request-schedule/${curReq._id}`, {
                credentials: 'include',
                method: 'DELETE',
                headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json',
                },
            });

            setFilteredRequestData((prevReqs) => {
                const updatedReqs = prevReqs.filter(req => req._id !== curReq._id);
                setFilteredRequestData(updatedReqs);
                return updatedReqs;
            });

            setDeleteReqDialog(false);
            setViewDialog(false);
            setCurReq(null);
            toast.current.show({ severity: 'success', summary: 'Thành công', detail: 'Xóa yêu cầu thành công', life: 3000 });

        } catch (error) {
            console.error('Error:', error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Có lỗi xảy ra khi xóa yêu cầu', life: 3000 });
        }
    };
    const confirmDeleteReq = (req) => {
        setDeleteReqDialog(true);
    };
    const hideDeleteReqDialog = () => {
        setDeleteReqDialog(false);
    };
    const deleteReqDialogFooter = (
        <>
            <Button label="Hủy bỏ" icon="pi pi-times" outlined onClick={hideDeleteReqDialog} />
            <Button label="Xác nhận" icon="pi pi-check" severity="success" onClick={deleteReq} />
        </>
    );

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
            </React.Fragment>
        );
    }

    return (
        <div>
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
            <Toast ref={toast} />
            <div className="card">
                <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '5px', width: '100%' }}>
                    <div className="col-md-3 form-group">
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
                    <div className="col-md-3 form-group"></div>
                    <div className="col-md-3 form-group">
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
                    <div className="col-md-3 form-group"></div>
                </div>
            </div>

            <div className="card">
                {isLecturer && (
                    <DataTable ref={dt} value={filteredRequestData}
                        dataKey="id"
                        globalFilter={globalFilter}
                        header={reqHeader}
                        paginator rows={5} rowsPerPageOptions={[5, 10, 25]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} tới {last} trong tổng số {totalRecords} yêu cầu"
                        headerStyle={{ backgroundColor: '#ffffff' }}
                        loading={loading}
                        loadingIcon="pi pi-spin pi-spinner"
                        emptyMessage="Không có dữ liệu">
                        <Column field="createdAt" sortable header="Ngày thực hiện" style={{ minWidth: '12rem' }}
                            body={(rowData) => {
                                const date = new Date(rowData.createdAt);
                                return date.toLocaleDateString('en-GB')
                            }}></Column>
                        <Column field="typeRequest" header="Loại yêu cầu"
                            body={typeBodyTemplate} style={{ minWidth: '12rem' }}></Column>
                        <Column field="statusId" header="Trạng thái"
                            body={statusBodyTemplate} style={{ minWidth: '12rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                    </DataTable>
                )}

                {(isFaculty || isAdmin)&& (
                    <DataTable ref={dt} value={filteredRequestData}
                        dataKey="id"
                        globalFilter={globalFilter}
                        header={reqHeader}
                        paginator rows={5} rowsPerPageOptions={[5, 10, 25]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} tới {last} trong tổng số {totalRecords} yêu cầu"
                        headerStyle={{ backgroundColor: '#ffffff' }}
                        loading={loading}
                        loadingIcon="pi pi-spin pi-spinner"
                        emptyMessage="Không có dữ liệu">
                        <Column field="createdAt" sortable header="Ngày thực hiện" style={{ minWidth: '12rem' }}
                            body={(rowData) => {
                                const date = new Date(rowData.createdAt);
                                return date.toLocaleDateString('en-GB')
                            }}></Column>
                        <Column field="userID.fullName" header="Tên giảng viên" style={{ minWidth: '12rem' }}></Column>
                        <Column field="typeRequest" header="Loại yêu cầu"
                            body={typeBodyTemplate} style={{ minWidth: '12rem' }}></Column>
                        <Column field="statusId" header="Trạng thái"
                            body={statusBodyTemplate} style={{ minWidth: '12rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                    </DataTable>
                )}
            </div>

            {/* Xem chi tiết */}
            <Dialog
                visible={viewDialog}
                style={{ width: '40rem' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Thông tin yêu cầu"
                modal
                className="p-fluid"
                footer={viewDialogFooter}
                onHide={hideViewDialog}
            >
                <div className="user-profile-container">
                    {curReq && (
                        <div className="user-profile-card">
                            <div className="user-profile-body">
                                {curReq.typeRequest === 1 && (
                                    <>
                                        {(isFaculty || isAdmin) && (
                                            <>
                                                <div className="user-profile-row">
                                                    <div className="user-profile-label">Tên giảng viên</div>
                                                    <div className="user-profile-value text-muted">
                                                        {curReq.userID.fullName}
                                                    </div>
                                                </div>
                                                <hr />
                                            </>
                                        )}
                                        <div className="user-profile-row">
                                            <div className="user-profile-label">Loại yêu cầu</div>
                                            <div className="user-profile-value text-muted">
                                                {typeOptions.find(option => option.value === curReq.typeRequest)?.label}
                                            </div>
                                        </div>
                                        <hr />
                                        <div className="user-profile-row">
                                            <div className="user-profile-label">Buổi trực</div>
                                            <div className="user-profile-value text-muted">
                                                {`${curReq.onCallSession === "S" ? "Buổi sáng" : "Buổi chiều"} ${dayMapping[curReq.day]}, ngày ${new Date(curReq.dateFrom).toLocaleDateString('vi-VN')}`}
                                            </div>
                                        </div>
                                        <hr />
                                        <div className="user-profile-row">
                                            <div className="user-profile-label">Lý do</div>
                                            <div className="user-profile-value text-muted">{curReq.reason}</div>
                                        </div>
                                        {curReq.statusId === 2 && (
                                            <>
                                                <hr />
                                                <div className="user-profile-row">
                                                    <div className="user-profile-label">Lý do từ chối</div>
                                                    <div className="user-profile-value text-muted">{curReq.note || "N/A"}</div>
                                                </div></>
                                        )}
                                    </>
                                )}

                                {curReq.typeRequest === 2 && (
                                    <>
                                        {isFaculty && (
                                            <>
                                                <div className="user-profile-row">
                                                    <div className="user-profile-label">Tên giảng viên</div>
                                                    <div className="user-profile-value text-muted">
                                                        {curReq.userID.fullName}
                                                    </div>
                                                </div>
                                                <hr />
                                            </>
                                        )}
                                        <div className="user-profile-row">
                                            <div className="user-profile-label">Loại yêu cầu</div>
                                            <div className="user-profile-value text-muted">
                                                {typeOptions.find(option => option.value === curReq.typeRequest)?.label}
                                            </div>
                                        </div>
                                        <hr />
                                        <div className="user-profile-row">
                                            <div className="user-profile-label">Buổi trực ban đầu</div>
                                            <div className="user-profile-value text-muted">
                                                {`${curReq.onCallSession === "S" ? "Buổi sáng" : "Buổi chiều"} ${dayMapping[curReq.day]}, ngày ${new Date(curReq.dateFrom).toLocaleDateString('vi-VN')}`}
                                            </div>
                                        </div>
                                        <hr />
                                        <div className="user-profile-row">
                                            <div className="user-profile-label">Buổi đổi sang</div>
                                            <div className="user-profile-value text-muted">
                                                {curReq.dayChange
                                                    ? `${curReq.onCallSessionChange === "S" ? "Buổi sáng" : "Buổi chiều"} ${dayMapping[curReq.dayChange]}, ngày ${new Date(curReq.dateTo).toLocaleDateString('vi-VN')}`
                                                    : "Chưa có"}
                                            </div>
                                        </div>
                                        {curReq.statusId === 2 && (
                                            <>
                                                <hr />
                                                <div className="user-profile-row">
                                                    <div className="user-profile-label">Lý do từ chối</div>
                                                    <div className="user-profile-value text-muted">{curReq.note || "N/A"}</div>
                                                </div></>
                                        )}
                                    </>
                                )}

                                {curReq.typeRequest !== 1 && curReq.typeRequest !== 2 && (
                                    <div className="user-profile-row">
                                        <div className="user-profile-label">Thông tin khác</div>
                                        <div className="user-profile-value text-muted">Dữ liệu không hợp lệ</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

            {/* Xóa yêu cầu */}
            <Dialog visible={deleteReqDialog}
                style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Confirm" modal
                footer={deleteReqDialogFooter}
                onHide={hideDeleteReqDialog}>
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {curReq && <span>Bạn chắc chắn muốn xóa yêu cầu này ?</span>}
                </div>
            </Dialog>

            {/* Từ chối yêu cầu */}
            <Dialog
                visible={denyDialog}
                style={{ width: '32rem' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Từ chối yêu cầu"
                modal
                className="p-fluid"
                footer={denyDialogFooter}
                onHide={hideDenyDialog}
            >

                <div className="field mt-3">
                    <div>
                        <label htmlFor="note">Thêm lý do từ chối:</label>
                        <InputTextarea
                            id="note"
                            value={curReq?.note || ""}
                            rows={5}
                            cols={30}
                            style={{ marginTop: '1rem', resize: 'none' }}
                        />
                    </div>
                </div>
            </Dialog>

            {/* Duyệt */}
            <Dialog
                visible={acceptDialog}
                style={{ width: '32rem' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header="Duyệt yêu cầu"
                modal
                className="p-fluid"
                footer={acceptDialogFooter}
                onHide={hideAcceptDialog}
            >

                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {curReq && <span>Bạn chắc chắn muốn duyệt yêu cầu này ?</span>}
                </div>
            </Dialog>
        </div >
    )
}

export default RequestSchedule