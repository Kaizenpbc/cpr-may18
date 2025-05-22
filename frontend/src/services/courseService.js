import { courseServiceApi } from '../api/config';
import logger from '../utils/logger';

class CourseService {
    constructor() {
        logger.debug('[CourseService] Initialized');
    }

    async getAllCourses() {
        try {
            logger.debug('[CourseService] Fetching all courses');
            const response = await courseServiceApi.get('/api/courses');
            logger.debug('[CourseService] Successfully fetched courses');
            return response.data;
        } catch (error) {
            logger.error('[CourseService] Error fetching courses:', {
                error: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });
            throw error;
        }
    }

    async getCourseById(id) {
        try {
            logger.debug(`[CourseService] Fetching course with ID: ${id}`);
            const response = await courseServiceApi.get(`/api/courses/${id}`);
            logger.debug(`[CourseService] Successfully fetched course ${id}`);
            return response.data;
        } catch (error) {
            logger.error(`[CourseService] Error fetching course ${id}:`, {
                error: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });
            throw error;
        }
    }

    async createCourse(courseData) {
        try {
            logger.debug('[CourseService] Creating new course:', courseData);
            const response = await courseServiceApi.post('/api/courses', courseData);
            logger.debug('[CourseService] Successfully created course');
            return response.data;
        } catch (error) {
            logger.error('[CourseService] Error creating course:', {
                error: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });
            throw error;
        }
    }

    async updateCourse(id, courseData) {
        try {
            logger.debug(`[CourseService] Updating course ${id}:`, courseData);
            const response = await courseServiceApi.put(`/api/courses/${id}`, courseData);
            logger.debug(`[CourseService] Successfully updated course ${id}`);
            return response.data;
        } catch (error) {
            logger.error(`[CourseService] Error updating course ${id}:`, {
                error: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });
            throw error;
        }
    }

    async deleteCourse(id) {
        try {
            logger.debug(`[CourseService] Deleting course ${id}`);
            await courseServiceApi.delete(`/api/courses/${id}`);
            logger.debug(`[CourseService] Successfully deleted course ${id}`);
        } catch (error) {
            logger.error(`[CourseService] Error deleting course ${id}:`, {
                error: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });
            throw error;
        }
    }
}

export default new CourseService(); 