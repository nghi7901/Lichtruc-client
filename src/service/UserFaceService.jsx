import axios from "axios";

export const UserFaceService = {
    async getUsersFaceData() {
        const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/users/images/`, {
            withCredentials: true,
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
            },
        });
        return res.data;
    },

    getUsersFaceMini() {
        return this.getUsersFaceData().then(data => Promise.resolve(data.slice(0, 5)));
    },

    getUsersFaceSmall() {
        return this.getUsersFaceData().then(data => Promise.resolve(data.slice(0, 10)));
    },

    getUsersFace() {
        return this.getUsersFaceData();
    },
};

