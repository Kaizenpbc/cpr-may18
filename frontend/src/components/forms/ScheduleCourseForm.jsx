import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, CircularProgress, Typography, Alert, Grid, Paper } from '@mui/material';
import * as api from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const ScheduleCourseForm = ({ onCourseScheduled }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        scheduledDate: '',
        location: '',
        courseTypeId: '',
        registeredStudents: '',
        notes: '',
    });
    const [courseTypes, setCourseTypes] = useState([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        // Fetch course types when component mounts
        const fetchTypes = async () => {
            setIsLoadingTypes(true);
            try {
                const types = await api.getCourseTypes();
                setCourseTypes(types);
            } catch (err) {
                setError('Failed to load course types. ' + (err.message || ''));
            } finally {
                setIsLoadingTypes(false);
            }
        };
        fetchTypes();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        // Basic numeric validation for registeredStudents
        if (name === 'registeredStudents' && value && !/^[0-9]*$/.test(value)) {
            return; 
        }
        setFormData(prevState => ({
            ...prevState,
            [name]: value,
        }));
        // Clear messages on change
        setError('');
        setSuccessMessage('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);
        logger.info('[handleSubmit] Form submitted with data:', formData);

        // Basic validation
        if (!formData.scheduledDate || !formData.location || !formData.courseTypeId || formData.registeredStudents === '') {
            setError('Please fill in all required fields (Scheduled Date, Location, Course Type, # Students).');
            setIsSubmitting(false);
            return;
        }

        try {
            const dataToSend = {
                ...formData,
                registeredStudents: parseInt(formData.registeredStudents, 10) || 0, // Ensure number
            };
            logger.info('[handleSubmit] Calling api.requestCourse with:', dataToSend);
            const response = await api.requestCourse(dataToSend);
            logger.info('[handleSubmit] API response received:', response);

            if (response.success) {
                const message = response.message || 'Course requested successfully!';
                logger.info('[handleSubmit] Success! Setting success message:', message);
                setSuccessMessage(message);
                // Clear form
                setFormData({
                    scheduledDate: '',
                    location: '',
                    courseTypeId: '',
                    registeredStudents: '',
                    notes: '',
                });
                // Optionally call a parent handler
                if (onCourseScheduled) {
                    onCourseScheduled(response.course);
                }
            } else {
                 const errorMessage = response.message || 'Failed to schedule course.';
                 logger.warn('[handleSubmit] API reported failure. Setting error:', errorMessage);
                 setError(errorMessage);
            }
        } catch (err) {
            const errorMessage = err.message || 'Failed to submit request.';
            logger.error('[handleSubmit] Exception caught. Setting error:', errorMessage, err);
            setError('Failed to submit request. ' + errorMessage);
        } finally {
            logger.debug('[handleSubmit] Setting isSubmitting to false.');
            setIsSubmitting(false);
        }
    };

    // Render loading state if user is not yet available
    logger.debug('[ScheduleCourseForm] Checking user object before rendering:', user);
    if (!user) {
        logger.debug(`[ScheduleCourseForm] User not loaded yet. Showing loading spinner.`);
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography>Loading organization info...</Typography>
            </Box>
        );
    }

    // Get organization name - fallback to username if organizationName not available
    const organizationDisplayName = user.organizationName || `Organization (${user.username})`;

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Typography variant="h6" gutterBottom mb={2}>
                    Request a Course
                </Typography>
                
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

                <Grid container spacing={2.5}>
                    {/* Organization (Read Only) - Keep full width */}
                    <Grid item xs={12}> 
                        <TextField 
                            label="Organization"
                            value={organizationDisplayName}
                            fullWidth 
                            disabled
                            variant="filled" 
                            InputProps={{ readOnly: true }}
                            helperText="This organization is automatically assigned based on your account"
                        />
                    </Grid>
                    {/* Date Requested (Auto-generated) */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Date Requested"
                            value={new Date().toLocaleDateString()}
                            disabled
                            variant="filled"
                            InputProps={{ readOnly: true }}
                            helperText="Automatically set to today's date when request is submitted"
                        />
                    </Grid>
                    {/* Scheduled Course Date */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            fullWidth
                            id="scheduledDate"
                            label="Scheduled Course Date"
                            name="scheduledDate"
                            type="date" 
                            InputLabelProps={{ shrink: true }}
                            value={formData.scheduledDate}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            helperText="When would you like the course to be scheduled?"
                        />
                    </Grid>
                    {/* Course Type Dropdown */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required disabled={isLoadingTypes || isSubmitting}>
                            <InputLabel id="courseTypeId-label">Type of Course</InputLabel>
                            <Select
                                labelId="courseTypeId-label"
                                id="courseTypeId"
                                value={formData.courseTypeId}
                                label="Type of Course" 
                                name="courseTypeId"
                                onChange={handleChange}
                            >
                                {isLoadingTypes ? (
                                    <MenuItem disabled value="">
                                        <CircularProgress size={20} sx={{ mr: 1 }}/> Loading Types...
                                    </MenuItem>
                                ) : courseTypes.length > 0 ? (
                                    courseTypes.map((type) => (
                                        <MenuItem key={type.coursetypeid} value={type.coursetypeid}>
                                            {type.coursetypename}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled value="">
                                        No course types available
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Grid>
                    {/* Location */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            fullWidth
                            id="location"
                            label="Location (Address/Room)"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </Grid>
                    {/* Students Registered */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            required
                            fullWidth
                            id="registeredStudents"
                            label="# Students Registered"
                            name="registeredStudents"
                            type="number"
                            value={formData.registeredStudents}
                            onChange={handleChange}
                            InputProps={{ inputProps: { min: 0 } }} 
                            disabled={isSubmitting}
                        />
                    </Grid>
                    {/* Notes */}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            id="notes"
                            label="Notes / Special Instructions (Optional)"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            multiline
                            rows={3} 
                            disabled={isSubmitting}
                        />
                    </Grid>
                     {/* Submit Button */}
                    <Grid item xs={12}>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 2 }}
                            disabled={isSubmitting || isLoadingTypes}
                        >
                            {isSubmitting ? <CircularProgress size={24} /> : 'Request Course Schedule'}
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};

export default ScheduleCourseForm; 