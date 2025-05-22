import api from './api';

export const getUsers = async () => {
    return api.getUsers();
};

export const createUser = async (userData) => {
    return api.addUser(userData);
};

export const updateUser = async (userId, userData) => {
    return api.updateUser(userId, userData);
};

export const deleteUser = async (userId) => {
    return api.deleteUser(userId);
};

export default {
    getUsers,
    createUser,
    updateUser,
    deleteUser
}; 