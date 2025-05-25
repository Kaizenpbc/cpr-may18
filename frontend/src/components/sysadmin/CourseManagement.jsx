import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Chip,
    IconButton,
    Tooltip,
    FormControlLabel,
    Switch
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    School as SchoolIcon,
    Save as SaveIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { sysAdminApi } from '../../services/api.ts';
import logger from '../../utils/logger';

const CourseManagement = ({ onShowSnackbar }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Dialog state
    const [showDialog, setShowDialog] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration_hours: '',
        duration_minutes: '',
        prerequisites: [],
        certification_type: '',
        validity_period_months: '',
        course_category: '',
        regulatory_compliance: [],
        is_active: true
    });

    const courseCategories = [
        'First Aid',
        'CPR',
        'BLS',
        'Advanced Life Support',
        'Emergency Response',
        'Safety Training',
        'Other'
    ];

    const certificationTypes = [
        'Initial Certification',
        'Renewal',
        'Advanced Training',
        'Refresher Course',
        'Specialty Course'
    ];

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const response = await sysAdminApi.getCourses();
            setCourses(response.data || []);
            setError('');
        } catch (err) {
            logger.error('Error loading courses:', err);
            setError('Failed to load courses');
            onShowSnackbar?.('Failed to load courses', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingCourse(null);
        setFormData({
            name: '',
            description: '',
            duration_hours: '',
            duration_minutes: '',
            prerequisites: [],
            certification_type: '',
            validity_period_months: '',
            course_category: '',
            regulatory_compliance: [],
            is_active: true
        });
        setShowDialog(true);
    };

    const handleEdit = (course) => {
        setEditingCourse(course);
        setFormData({
            name: course.name || '',
            description: course.description || '',
            duration_hours: course.duration_hours || '',
            duration_minutes: course.duration_minutes || '',
            prerequisites: course.prerequisites || [],
            certification_type: course.certification_type || '',
            validity_period_months: course.validity_period_months || '',
            course_category: course.course_category || '',
            regulatory_compliance: course.regulatory_compliance || [],
            is_active: course.is_active !== false
        });
        setShowDialog(true);
    };

    const handleDelete = async (course) => {
        if (window.confirm(`Are you sure you want to deactivate the course "${course.name}"?`)) {
            try {
                await sysAdminApi.deleteCourse(course.id);
                onShowSnackbar?.('Course deactivated successfully', 'success');
                loadCourses();
            } catch (err) {
                logger.error('Error deactivating course:', err);
                onShowSnackbar?.('Failed to deactivate course', 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            onShowSnackbar?.('Course name is required', 'error');
            return;
        }

        try {
            const submitData = {
                ...formData,
                duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
                duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
                validity_period_months: formData.validity_period_months ? parseInt(formData.validity_period_months) : null,
            };

            if (editingCourse) {
                await sysAdminApi.updateCourse(editingCourse.id, submitData);
                onShowSnackbar?.('Course updated successfully', 'success');
            } else {
                await sysAdminApi.createCourse(submitData);
                onShowSnackbar?.('Course created successfully', 'success');
            }
            
            setShowDialog(false);
            loadCourses();
        } catch (err) {
            logger.error('Error saving course:', err);
            onShowSnackbar?.('Failed to save course', 'error');
        }
    };

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatDuration = (hours, minutes) => {
        if (!hours && !minutes) return 'Not specified';
        const parts = [];
        if (hours) parts.push(`${hours}h`);
        if (minutes) parts.push(`${minutes}m`);
        return parts.join(' ');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress size={60} />
                <Typography variant="body1" sx={{ ml: 2 }}>Loading courses...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon color="primary" />
                        Course Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Define and manage course types, codes, and specifications
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddNew}
                    sx={{ minWidth: 200 }}
                >
                    Add New Course
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Courses Table */}
            <TableContainer component={Paper} elevation={2}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Course Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Certification Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Validity Period</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {courses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                                        No courses found. Click "Add New Course" to get started.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            courses.map((course, index) => (
                                <TableRow key={course.id} hover sx={{ backgroundColor: index % 2 !== 0 ? '#f9f9f9' : 'inherit' }}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {course.name}
                                        </Typography>
                                        {course.description && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {course.description}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={course.course_code || 'N/A'} 
                                            size="small" 
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {course.course_category || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatDuration(course.duration_hours, course.duration_minutes)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {course.certification_type || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {course.validity_period_months ? `${course.validity_period_months} months` : '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={course.is_active ? 'Active' : 'Inactive'} 
                                            color={course.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatDate(course.created_at)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Edit Course">
                                                <IconButton
                                                    onClick={() => handleEdit(course)}
                                                    color="primary"
                                                    size="small"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Deactivate Course">
                                                <IconButton
                                                    onClick={() => handleDelete(course)}
                                                    color="error"
                                                    size="small"
                                                    disabled={!course.is_active}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Course Dialog */}
            <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Course Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Course Category</InputLabel>
                                    <Select
                                        name="course_category"
                                        value={formData.course_category}
                                        label="Course Category"
                                        onChange={handleChange}
                                    >
                                        {courseCategories.map((category) => (
                                            <MenuItem key={category} value={category}>
                                                {category}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Duration (Hours)"
                                    name="duration_hours"
                                    value={formData.duration_hours}
                                    onChange={handleChange}
                                    inputProps={{ min: 0 }}
                                />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Duration (Minutes)"
                                    name="duration_minutes"
                                    value={formData.duration_minutes}
                                    onChange={handleChange}
                                    inputProps={{ min: 0, max: 59 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Certification Type</InputLabel>
                                    <Select
                                        name="certification_type"
                                        value={formData.certification_type}
                                        label="Certification Type"
                                        onChange={handleChange}
                                    >
                                        {certificationTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Validity Period (Months)"
                                    name="validity_period_months"
                                    value={formData.validity_period_months}
                                    onChange={handleChange}
                                    inputProps={{ min: 1 }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_active}
                                            onChange={handleChange}
                                            name="is_active"
                                            color="primary"
                                        />
                                    }
                                    label="Active Course"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDialog(false)} startIcon={<CancelIcon />}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" startIcon={<SaveIcon />}>
                        {editingCourse ? 'Update Course' : 'Create Course'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CourseManagement; 