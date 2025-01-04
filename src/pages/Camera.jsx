import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";

import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';

const Camera = () => {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const toast = useRef(null);
  const intervalRef = useRef(null);

  const sendFrame = async (imageSrc) => {
    const blob = await fetch(imageSrc).then((res) => res.blob());

    const formData = new FormData();
    formData.append("file", blob, "webcam.jpg");

    try {
      const response = await axios.post(`${process.env.REACT_APP_CAMERA_URL}/oncall-check`, formData);
      toast.current.show({
        severity: response.data.status,
        summary: response.data.status === 'success' ? 'Thành công' : 'Thất bại',
        detail: response.data.message,
        life: 3000
      });
      console.log("Server response:", response.data);
    } catch (error) {
      console.error("Error during recognition:", error);
      setMessage("Error connecting to server.");
    }
  };

  const startRealTimeDetection = () => {
    if (isDetecting) return;
    setIsDetecting(true);

    intervalRef.current = setInterval(() => {
      if (!webcamRef.current) return;

      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) sendFrame(imageSrc);
    }, 2000);
  };

  const stopRealTimeDetection = () => {
    setIsDetecting(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const adjustTime = (time, hours, minutes) => {
    const [h, m] = time.split(":").map(Number);
    const baseDate = new Date();
    baseDate.setHours(h, m, 0);

    baseDate.setHours(baseDate.getHours() + hours);
    baseDate.setMinutes(baseDate.getMinutes() + minutes);

    return baseDate.toTimeString().slice(0, 5);
  };

  const [schedule, setSchedule] = useState(null)
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/open-attendance/get-by-date`, {
          headers: {
            'Authorization': `Bearer ${token}`
        },
          withCredentials: true
        });
        if (response.data.error) {
          toast.current.show({
            severity: 'error',
            summary: 'Lỗi',
            detail: response.data.error,
            life: 3000
          });
        } else {
          setSchedule(response.data);
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
        toast.current.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải lịch trực',
          life: 3000
        });
      }
    };

    fetchSchedule();
  }, []);

  return (
    <>
    <style>
      {`
      .attendance-title {
        text-align: center;
        color: #4caf50;
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 20px;
      }

      .schedule-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .schedule-list > li {
        background-color: #f9f9f9;
        padding: 15px;
        margin-bottom: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-size: 1rem;
      }

      .schedule-list ul {
        padding-left: 20px;
        margin-top: 10px;
      }

      .schedule-list ul li {
        font-size: 0.9rem;
        color: #333;
        margin-bottom: 8px;
      }

      .schedule-list .highlight {
        font-weight: bold;
        color: #2196f3;
      }

      .schedule-list .warning {
        color: #f44336;
        font-weight: bold;
      }

      .schedule-list .inactive {
        color: #9e9e9e;
        font-style: italic;
        text-align: center;
        display: block;
        margin: 10px 0;
      }

      .loading {
        text-align: center;
        color: #ff9800;
        font-size: 1.2rem;
        font-style: italic;
      }

      `}
    </style>
    <div className='p-2' style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
      <div>
        <Toast ref={toast} />
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={{ margin: "20px auto" }}
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
          <h3 className="attendance-title">Hệ thống chấm công</h3>
          {schedule ? (
            <ul className="schedule-list">
              <li>
                <strong>
                  Khung giờ trực buổi sáng: {schedule.time_In_S} - {schedule.time_Out_S}
                </strong>
                <ul>
                  <li>
                    <span className="highlight">Check-in sau:</span> {adjustTime(schedule.time_In_S, 1, 0)}: <span className="warning">Vào trễ</span>
                  </li>
                  <li>
                    <span className="highlight">Không cho phép check-in sau:</span> {adjustTime(schedule.time_In_S, 3, 0)}
                  </li>
                  <li>
                    <span className="highlight">Check-out trước:</span> {adjustTime(schedule.time_In_S, 3, 30)}: <span className="warning">Về sớm</span>
                  </li>
                </ul>
              </li>

              <li>
                <strong className="inactive">
                  {schedule.time_Out_S} - {schedule.time_In_C}: Hệ thống tạm ngừng hoạt động
                </strong>
              </li>

              <li>
                <strong>
                  Khung giờ trực buổi chiều: {schedule.time_In_C} - {schedule.time_Out_C}
                </strong>
                <ul>
                  <li>
                    <span className="highlight">Check-in sau:</span> {adjustTime(schedule.time_In_C, 1, 0)}: <span className="warning">Vào trễ</span>
                  </li>
                  <li>
                    <span className="highlight">Không cho phép check-in sau:</span> {adjustTime(schedule.time_In_C, 3, 0)}
                  </li>
                </ul>
              </li>
            </ul>
          ) : (
            <p className="loading">Đang tải thông tin lịch trực...</p>
          )}

        </div>
        {!isDetecting ? (
          <Button
            label="Điểm danh"
            severity="success"
            onClick={startRealTimeDetection}
            className="small-button my-2"
          />
        ) : (
          <Button
            label="Ngừng điểm danh"
            severity="warning"
            onClick={stopRealTimeDetection}
            className="small-button my-2"
          />
        )}
      </div>
    </div>
    </>
  );
};

export default Camera;
