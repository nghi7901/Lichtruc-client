import React, { useEffect, useState, useRef } from 'react';
import useDocumentTitle from '../config/useDocumentTitle';
import { useAuth } from "../context/Context";
import { useLocation, useNavigate } from 'react-router-dom';
import Webcam from "react-webcam";
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';

const RegisterFace = () => {
    useDocumentTitle('Đăng ký khuôn mặt');
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useRef(null);
    const webcamRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [images, setImages] = useState([]);
    const [isDialogVisible, setDialogVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            const redirectUrl = encodeURIComponent(location.pathname);
            navigate(`/login?redirect=${redirectUrl}`);
        }
    }, [isAuthenticated, navigate, location.pathname]);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_CAMERA_URL}/user-image/${user._id}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Không thể tải ảnh");
                }
                return response.json();
            })
            .then((data) => {
                setImages(data);
            })
            .catch((error) => console.error("Lỗi khi tải ảnh:", error));
    }, [user]);

    // Hàm chụp ảnh từ webcam
    const capture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        return imageSrc; // Dữ liệu base64 của hình ảnh
    };

    // Hàm gọi API để đăng ký
    const registerUser = async (imageBase64, user) => {
        try {
            const formData = new FormData();
            formData.append("userId", user._id);

            // Chuyển đổi base64 sang Blob
            const byteString = atob(imageBase64.split(",")[1]);
            const mimeType = imageBase64.split(",")[0].match(/:(.*?);/)[1];
            const buffer = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                buffer[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([buffer], { type: mimeType });

            formData.append("image", blob, "webcam_capture.jpg");

            const response = await fetch(`${process.env.REACT_APP_CAMERA_URL}/face-register`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            toast.current.show({
                severity: 'success',
                summary: 'Thành công',
                detail: data.message || 'Đăng ký thành công!',
                life: 3000
            });
        } catch (error) {
            console.error("Đăng ký thất bại:", error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Đăng ký thất bại! Vui lòng thử lại.', life: 3000 });
        }
    };

    // Hàm xử lý khi nhấn nút Đăng ký
    const handleRegister = async () => {
        if (!user) {
            alert("Không có thông tin người dùng!");
            return;
        }

        setIsCapturing(true); // Kích hoạt trạng thái chụp
        const imageBase64 = capture(); // Chụp ảnh
        await registerUser(imageBase64, user); // Gọi API với thông tin user
        setIsCapturing(false); // Tắt trạng thái
    };
    const showImageDialog = async () => {
        setDialogVisible(true); 
        setLoading(true); 
        try {
            const response = await fetch(`${process.env.REACT_APP_CAMERA_URL}/user-image/${user._id}`);
            if (!response.ok) {
                throw new Error("Không thể tải ảnh");
            }
            const data = await response.json();
            setImages(data); 
        } catch (error) {
            console.error("Lỗi khi tải ảnh:", error);
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải ảnh!', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const hideDialog = () => {
        setDialogVisible(false);
    };

    return (
        <div>
            <div className='p-2' style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
                <div>
                    <Toast ref={toast} />
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width={640}
                        height={480}
                    />
                </div>

                <div style={{ flex: '1', margin: '0 20px 0 10px', }}>
                    <div
                        style={{
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <h3>Hướng dẫn đăng ký khuôn mặt</h3>
                        <ul>
                            <li><strong>Ngồi ở nơi có ánh sáng tốt:</strong>
                            </li>
                            <li><strong>Nhìn thẳng vào camera:</strong>
                                <ul>
                                    <li>Đảm bảo khuôn mặt nằm chính giữa khung hình.</li>
                                    <li>Nhìn trực diện vào camera, không quay đầu hoặc nghiêng mặt.</li>
                                </ul>
                            </li>
                            <li><strong>Đặt khuôn mặt cách camera khoảng 30-50 cm.</strong>
                            </li>
                            <li><strong>Giữ khuôn mặt không bị che khuất:</strong>
                                <ul>
                                    <li>Tháo khẩu trang, kính râm, hoặc bất kỳ vật dụng che khuất mặt.</li>
                                    <li>Nếu đeo kính, đảm bảo không có ánh sáng phản chiếu từ kính.</li>
                                </ul>
                            </li>
                            <li><strong>Tránh các chuyển động</strong>
                                <ul>
                                    <li>Giữ đầu ổn định trong suốt quá trình chụp.</li>
                                    <li>Tránh nháy mắt hoặc biểu cảm khuôn mặt.</li>
                                </ul>
                            </li>
                            <li><strong>Đảm bảo khuôn mặt tự nhiên</strong>
                            </li>
                            <li><strong>Môi trường xung quanh:</strong>
                                <ul>
                                    <li>Nền phía sau nên đơn giản.</li>
                                    <li>Tránh yếu tố gây xao nhãng, như người khác di chuyển trong khung hình.</li>
                                </ul>
                            </li>
                            <li><strong>Đảm bảo camera hoạt động tốt và ống kính không bị bẩn.</strong>
                            </li>
                        </ul>
                    </div>
                    <Button
                        label={isCapturing ? "Đang đăng ký..." : "Đăng ký"}
                        icon={isCapturing ? "pi pi-spinner pi-spin" : "pi pi-check"}
                        severity="success"
                        onClick={handleRegister}
                        disabled={isCapturing}
                        className="small-button"
                    />
                    &nbsp;
                    <Button
                        label="Lịch sử đăng ký"
                        icon="pi pi-image"
                        severity="info"
                        onClick={showImageDialog}
                        disabled={!images.length === 0}
                        className="small-button"
                    />
                </div>
            </div>
            <Dialog
                visible={isDialogVisible}
                style={{ width: "60vw" }}
                header="Hình ảnh đã đăng ký"
                modal
                onHide={hideDialog}
            >
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px" }}>
                        <i className="pi pi-spin pi-spinner" style={{ fontSize: "2em" }}></i>
                    </div>
                ) : images.length === 0 ? (
                    <p>Không có hình ảnh nào được đăng ký.</p>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            gap: "1.5vw",
                            flexWrap: "wrap",
                        }}
                    >
                        {images.slice(0, 5).map((img, index) => (
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

    )
}

export default RegisterFace;