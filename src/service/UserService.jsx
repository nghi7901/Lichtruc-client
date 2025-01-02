import axios from "axios";

export const UserService = {
    async getUsersData() {
        console.log(`${process.env.REACT_APP_SERVER_URL}/users/`);
        const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/users/`, {
            withCredentials: true,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });
        return res.data; 
    },

    getUsersMini() {
        return this.getUsersData().then(data => Promise.resolve(data.slice(0, 5)));
    },

    getUsersSmall() {
        return this.getUsersData().then(data => Promise.resolve(data.slice(0, 10)));
    },

    getUsers() {
        return this.getUsersData(); 
    },
};

