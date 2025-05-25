import api from './api.ts';

export const createUser = async (userData) => {
    try {
        // Placeholder - return success for now
        return { success: true, userId: Date.now() };
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

export const updateUser = async (userId, userData) => {
    try {
        // Placeholder - return success for now
        return { success: true };
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

export const getUsers = async () => {
    try {
        // Placeholder - return empty array for now
        return [];
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

export const deleteUser = async (userId) => {
    try {
        // Placeholder - return success for now
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

export default {
    createUser,
    updateUser,
    getUsers,
    deleteUser
}; 