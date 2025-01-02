import axios from "axios";

export const OpenAttendanceService = {
    async getOpenAttendancesData() {
        const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/open-attendance`, {
            withCredentials: true,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });
        return res.data; 
    },

    getOpenAttendancesMini() {
        return this.getOpenAttendancesData().then(data => Promise.resolve(data.slice(0, 5)));
    },

    getOpenAttendancesSmall() {
        return this.getOpenAttendancesData().then(data => Promise.resolve(data.slice(0, 10)));
    },

    getOpenAttendances() {
        return this.getOpenAttendancesData(); 
    },
};

