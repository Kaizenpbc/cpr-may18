import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Grid, Alert, CircularProgress, Box
} from '@mui/material';

const initialCourseTypeState = {
    coursetypename: '',
    coursecode: '',
    description: '',
    duration: '', // Store as string for TextField
    maxstudents: '' // Store as string for TextField
};

function CourseTypeDialog({ open, onClose, onSave, courseType }) {
    const [formData, setFormData] = useState(initialCourseTypeState);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const isEditMode = Boolean(courseType?.coursetypeid);

    useEffect(() => {
        if (open) {
            if (isEditMode && courseType) {
                setFormData({
                    coursetypename: courseType.coursetypename || '',
                    coursecode: courseType.coursecode || '',
                    description: courseType.description || '',
                    duration: courseType.duration !== null ? String(courseType.duration) : '',
                    maxstudents: courseType.maxstudents !== null ? String(courseType.maxstudents) : ''
                });
            } else {
                setFormData(initialCourseTypeState);
            }
            setError('');
            setFieldErrors({});
        }
    }, [courseType, isEditMode, open]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        // Allow only numbers for duration and maxstudents
        if ((name === 'duration' || name === 'maxstudents') && value && !/^[0-9]*$/.test(value)) {
            return; // Prevent non-numeric input
        }
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: false }));
        }
        if (error) {
            setError('');
        }
    };

    const handleSave = async () => {
        setError('');
        setFieldErrors({});
        const newFieldErrors = {};

        // Client-side validation
        if (!formData.coursetypename) newFieldErrors.coursetypename = "Course Type Name required";
        if (!formData.coursecode) newFieldErrors.coursecode = "Course Code required";
        if (!formData.duration) newFieldErrors.duration = "Duration required";
        if (!formData.maxstudents) newFieldErrors.maxstudents = "Max Students required";
        
        if (Object.keys(newFieldErrors).length > 0) {
            setError('Please fix highlighted field(s).');
            setFieldErrors(newFieldErrors);
            return;
        }

        setLoading(true);
        try {
            if (isEditMode) {
                await api.updateCourseType(courseType.coursetypeid, formData);
            } else {
                await api.addCourseType(formData);
            }
            onSave();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save course type');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isEditMode ? 'Edit Course Type' : 'Add New Course Type'}</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
                    <TextField
                        name="coursetypename"
                        label="Course Name *"
                        value={formData.coursetypename}
                        onChange={handleChange}
                        fullWidth required
                        margin="normal"
                        error={Boolean(fieldErrors.coursetypename)}
                        helperText={fieldErrors.coursetypename || ""}
                    />
                    <TextField
                        name="coursecode"
                        label="Course Code *"
                        value={formData.coursecode}
                        onChange={handleChange}
                        fullWidth required
                        margin="normal"
                        error={Boolean(fieldErrors.coursecode)}
                        helperText={fieldErrors.coursecode || ""}
                    />
                    <TextField
                        name="description"
                        label="Description"
                        value={formData.description}
                        onChange={handleChange}
                        fullWidth multiline rows={3}
                        margin="normal"
                    />
                     <Grid container spacing={2}>
                        <Grid item xs={6}>
                             <TextField
                                name="duration"
                                label="Duration (hours)"
                                type="number" // Use number input
                                value={formData.duration}
                                onChange={handleChange}
                                fullWidth
                                margin="normal"
                                inputProps={{ min: 0 }} // Prevent negative numbers
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="maxstudents"
                                label="Max Students"
                                type="number"
                                value={formData.maxstudents}
                                onChange={handleChange}
                                fullWidth
                                margin="normal"
                                inputProps={{ min: 0 }}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Save Changes' : 'Add Type')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CourseTypeDialog; 