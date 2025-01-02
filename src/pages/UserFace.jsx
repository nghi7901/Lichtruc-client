import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "../context/Context";
import useDocumentTitle from '../config/useDocumentTitle';
import { UserFaceService } from '../service/UserFaceService';
import { useLocation, useNavigate } from 'react-router-dom';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Buffer } from 'buffer';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';

const UserFace = () => {
    useDocumentTitle('Quản lý đăng ký khuôn mặt');
    const { isAuthenticated } = useAuth();

    const [lecturers, setLecturers] = useState([]);
    const [filteredLecturers, setFilteredLecturers] = useState([]);
    const [selectedLecturer, setSelectedLecturer] = useState(null);
    const [globalFilter, setGlobalFilter] = useState(null);
    const toast = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const dt = useRef(null);
    const [isDialogVisible, setDialogVisible] = useState(false);
    const [imageFilter, setImageFilter] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            const redirectUrl = encodeURIComponent(location.pathname);
            navigate(`/login?redirect=${redirectUrl}`);
        }
    }, [isAuthenticated, navigate, location.pathname]);

    useEffect(() => {
        if (isAuthenticated) {
            UserFaceService.getUsersFace().then((data) => {
                setLecturers(data)
                setFilteredLecturers(data);
            });
        }
    }, [isAuthenticated]);

    const handleImageFilterChange = (e) => {
        setImageFilter(e.value);
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <span className="text-xl text-900 font-bold">Face ID</span>
            <div>
                <Dropdown
                    value={imageFilter}
                    options={[
                        { label: 'Chưa đăng ký', value: 0 },
                        { label: 'Đã đăng ký', value: 1 }
                    ]}
                    onChange={handleImageFilterChange}
                    placeholder="Lọc theo đăng ký"
                    itemTemplate={(option) => (
                        <Tag value={option.label} severity={option.value === 0 ? 'danger' : 'success'} />
                    )}
                />
                &nbsp;&nbsp;
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Nhập từ khóa tìm kiếm" />
            </div>
        </div>
    );

    useEffect(() => {
        let filteredData = lecturers;

        if (imageFilter !== undefined) {
            if (imageFilter === 0) {
                filteredData = filteredData.filter((user) => user.images.length === 0);
            } else if (imageFilter === 1) {
                filteredData = filteredData.filter((user) => user.images.length > 0);
            }
        }

        if (globalFilter) {
            filteredData = filteredData.filter((user) => {
                return (
                    user.email.toLowerCase().includes(globalFilter.toLowerCase()) ||
                    user.fullName.toLowerCase().includes(globalFilter.toLowerCase()) ||
                    user.codeProfessional.toLowerCase().includes(globalFilter.toLowerCase())
                );
            });
        }

        setFilteredLecturers(filteredData);
    }, [lecturers, imageFilter, globalFilter]);


    const imageBodyTemplate = (rowData) => {
        if (!rowData.image) {
            return <span>Không có ảnh</span>;
        }

        const imageSrc = `data:image/jpeg;base64,${Buffer.from(rowData.image).toString('base64')}`;

        return (
            <img
                src={imageSrc}
                alt={rowData.fullName}
                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }}
            />
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button
                    icon="pi pi-image"
                    severity="info" outlined
                    label="Lịch sử đăng ký"
                    className="small-button"
                    onClick={() => {
                        setSelectedLecturer(rowData);
                        setDialogVisible(true);
                    }}
                />
            </React.Fragment>
        );
    };



    const hideDialog = () => {
        setDialogVisible(false);
        setSelectedLecturer(null);
    };


    const statusBodyTemplate = (rowData) => {
        const isRegistered = rowData.images.length > 0;
        return (
            <Tag
                value={isRegistered ? 'Đã đăng ký' : 'Chưa đăng ký'} 
                severity={isRegistered ? 'success' : 'danger'} 
            />
        );
    };

    return (
        <div>
            <div className="card">
                <Toast ref={toast} />
                <DataTable
                    ref={dt}
                    value={filteredLecturers}
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 25]}
                    globalFilter={globalFilter}
                    header={header}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Hiển thị {first} tới {last} trong tổng số {totalRecords} giảng viên"
                    emptyMessage="Không có dữ liệu"
                >
                    <Column field="codeProfessional" header="Mã giảng viên" sortable style={{ minWidth: '10rem' }} />
                    <Column field="fullName" header="Họ và Tên" sortable style={{ minWidth: '14rem' }} />
                    <Column field="position" header="Chức vụ" sortable style={{ minWidth: '10rem' }} />
                    <Column
                        header="Trạng thái"
                        body={statusBodyTemplate}
                        style={{ minWidth: '12rem' }}
                    />
                    <Column
                        body={rowData => {
                            return rowData.images.length > 0 ? actionBodyTemplate(rowData) : null;
                        }}
                        exportable={false}
                        style={{ minWidth: '10rem' }}
                    />
                </DataTable>
            </div>
            <Dialog
                visible={isDialogVisible}
                style={{ width: '60vw' }}
                header="Hình ảnh đã đăng ký"
                modal
                onHide={hideDialog}
            >
                {selectedLecturer && (
                    <div
                    style={{
                        display: "flex",
                        gap: "1.5vw",
                        flexWrap: "wrap",
                    }}
                >
                    {selectedLecturer.images.slice(0, 5).map((img, index) => (
                        <div
                            key={index}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: "10vw",
                            }}
                        >
                            <img
                                src={img.image}
                                alt={`Hình ${index + 1}`}
                                style={{
                                    width: "10vw",
                                    height: "10vw",
                                    borderRadius: "8px",
                                    objectFit: "cover",
                                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                                }}
                            />
                            <span
                                style={{
                                    marginTop: "5px",
                                    fontSize: "12px",
                                    color: "#555",
                                    textAlign: "center",
                                }}
                            >
                                {new Date(img.timestamp).toLocaleString("vi-VN")}
                            </span>
                        </div>
                    ))}
                </div>
                )}
            </Dialog>
        </div>
    );
};

export default UserFace;
