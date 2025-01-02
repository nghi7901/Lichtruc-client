import axios from "axios";

export const StatisticsService = {
    async getStatisticsData(schoolYear, semester) {
        const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/statistics/overview`, {
            params: { schoolYear, semester },
            withCredentials: true,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });
        return res.data;
    },

    getStatisticsMini() {
        return this.getStatisticsData().then(data => Promise.resolve(data.slice(0, 5)));
    },

    getStatisticsSmall() {
        return this.getStatisticsData().then(data => Promise.resolve(data.slice(0, 10)));
    },

    getStatistics(schoolYear, semester) {
        return this.getStatisticsData(schoolYear, semester);
    },

    async getLateStatisticsData(schoolYear, semester) {
        const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/statistics/late`, {
            params: { schoolYear, semester },
            withCredentials: true,
            
        });
        return res.data;
    },

    getLateStatisticsMini() {
        return this.getLateStatisticsData().then(data => Promise.resolve(data.slice(0, 5)));
    },

    getLateStatisticsSmall() {
        return this.getLateStatisticsData().then(data => Promise.resolve(data.slice(0, 10)));
    },

    getLateStatistics(schoolYear, semester) {
        return this.getLateStatisticsData(schoolYear, semester);
    },
};
