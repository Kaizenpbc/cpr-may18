import { api } from './api.ts';

export const getStudentsForCourse = async (courseId) => {
    return api.getStudentsForCourse(courseId);
};

export const updateStudentAttendance = async (courseId, studentId, attendanceData) => {
    return api.updateStudentAttendance(courseId, studentId, attendanceData);
};

export const uploadStudents = async (courseId, studentsData) => {
    return api.uploadStudents(courseId, studentsData);
};

export const getCourseStudents = async (courseId) => {
    return api.getStudentsForCourse(courseId);
};

export default {
    getStudentsForCourse,
    updateStudentAttendance,
    uploadStudents,
    getCourseStudents
}; 