import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
    Tooltip
} from '@mui/material';
import {
    Edit as EditIcon,
    Add as AddIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    AttachMoney as MoneyIcon
} from '@mui/icons-material';
import * as api from '../../services/api.ts';
import logger from '../../utils/logger';

const CoursePricingSetup = () => {
    const [coursePricing, setCoursePricing] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [courseTypes, setCourseTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    
    // Add new pricing dialog
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newPricing, setNewPricing] = useState({
        organization_id: '',
        course_type_id: '',
        price_per_student: ''
    });

    // Load data on component mount
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadCoursePricing(),
                loadOrganizations(),
                loadCourseTypes()
            ]);
        } catch (err) {
            logger.error('Error loading course pricing data:', err);
            setError('Failed to load course pricing data');
        } finally {
            setLoading(false);
        }
    };

    const loadCoursePricing = async () => {
        try {
            const response = await api.getCoursePricing();
            setCoursePricing(response.data || []);
        } catch (err) {
            logger.error('Error loading course pricing:', err);
            throw err;
        }
    };

    const loadOrganizations = async () => {
        try {
            const response = await api.getOrganizations();
            setOrganizations(response.data || []);
        } catch (err) {
            logger.error('Error loading organizations:', err);
            throw err;
        }
    };

    const loadCourseTypes = async () => {
        try {
            const response = await api.getCourseTypes();
            setCourseTypes(response.data || []);
        } catch (err) {
            logger.error('Error loading course types:', err);
            throw err;
        }
    };

    const handleEditStart = (pricing) => {
        setEditingId(pricing.id);
        setEditPrice(pricing.price_per_student.toString());
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditPrice('');
    };

    const handleEditSave = async (id) => {
        try {
            const price = parseFloat(editPrice);
            if (isNaN(price) || price <= 0) {
                setError('Please enter a valid price greater than 0');
                return;
            }

            await api.updateCoursePrice(id, { price_per_student: price });
            setSuccess('Course pricing updated successfully!');
            setEditingId(null);
            setEditPrice('');
            loadCoursePricing();
        } catch (err) {
            logger.error('Error updating course pricing:', err);
            setError('Failed to update course pricing');
        }
    };

    const handleAddNew = async () => {
        try {
            const price = parseFloat(newPricing.price_per_student);
            if (!newPricing.organization_id || !newPricing.course_type_id || isNaN(price) || price <= 0) {
                setError('Please fill all fields with valid data');
                return;
            }

            await api.createCoursePricing({
                ...newPricing,
                price_per_student: price
            });

            setSuccess('New course pricing added successfully!');
            setShowAddDialog(false);
            setNewPricing({ organization_id: '', course_type_id: '', price_per_student: '' });
            loadCoursePricing();
        } catch (err) {
            logger.error('Error creating course pricing:', err);
            setError('Failed to create course pricing');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getOrganizationName = (id) => {
        const org = organizations.find(o => o.id === id);
        return org ? org.name : 'Unknown';
    };

    const getCourseTypeName = (id) => {
        const type = courseTypes.find(t => t.id === id);
        return type ? type.name : 'Unknown';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress size={60} />
                <Typography variant="body1" sx={{ ml: 2 }}>Loading course pricing data...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon color="primary" />
                        Course Pricing Setup
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Configure pricing per student for different course types across organizations
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowAddDialog(true)}
                    sx={{ minWidth: 200 }}
                >
                    Add New Pricing
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <TableContainer component={Paper} elevation={2}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Organization</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Course Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Price per Student</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Effective Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {coursePricing.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                                        No course pricing data found. Click "Add New Pricing" to get started.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            coursePricing.map((pricing, index) => (
                                <TableRow key={pricing.id} hover sx={{ backgroundColor: index % 2 !== 0 ? '#f9f9f9' : 'inherit' }}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {pricing.organization_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {pricing.course_type_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {pricing.course_description || 'No description'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {editingId === pricing.id ? (
                                            <TextField
                                                value={editPrice}
                                                onChange={(e) => setEditPrice(e.target.value)}
                                                type="number"
                                                size="small"
                                                InputProps={{
                                                    startAdornment: <MoneyIcon fontSize="small" sx={{ mr: 0.5 }} />,
                                                }}
                                                inputProps={{ step: "0.01", min: "0" }}
                                                sx={{ minWidth: 120 }}
                                            />
                                        ) : (
                                            <Typography variant="body1" fontWeight="bold" color="success.main">
                                                {formatCurrency(pricing.price_per_student)}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatDate(pricing.effective_date)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={pricing.is_active ? 'Active' : 'Inactive'} 
                                            color={pricing.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {editingId === pricing.id ? (
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="Save Changes">
                                                    <IconButton
                                                        onClick={() => handleEditSave(pricing.id)}
                                                        color="success"
                                                        size="small"
                                                    >
                                                        <SaveIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Cancel Edit">
                                                    <IconButton
                                                        onClick={handleEditCancel}
                                                        color="error"
                                                        size="small"
                                                    >
                                                        <CancelIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        ) : (
                                            <Tooltip title="Edit Price">
                                                <IconButton
                                                    onClick={() => handleEditStart(pricing)}
                                                    color="primary"
                                                    size="small"
                                                    disabled={!pricing.is_active}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add New Pricing Dialog */}
            <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Course Pricing</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Organization</InputLabel>
                                <Select
                                    value={newPricing.organization_id}
                                    label="Organization"
                                    onChange={(e) => setNewPricing({...newPricing, organization_id: e.target.value})}
                                >
                                    {organizations.map((org) => (
                                        <MenuItem key={org.id} value={org.id}>
                                            {org.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Course Type</InputLabel>
                                <Select
                                    value={newPricing.course_type_id}
                                    label="Course Type"
                                    onChange={(e) => setNewPricing({...newPricing, course_type_id: e.target.value})}
                                >
                                    {courseTypes.map((type) => (
                                        <MenuItem key={type.id} value={type.id}>
                                            {type.name} {type.description && `- ${type.description}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                label="Price per Student"
                                type="number"
                                value={newPricing.price_per_student}
                                onChange={(e) => setNewPricing({...newPricing, price_per_student: e.target.value})}
                                InputProps={{
                                    startAdornment: <MoneyIcon fontSize="small" sx={{ mr: 0.5 }} />,
                                }}
                                inputProps={{ step: "0.01", min: "0" }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddNew} variant="contained">Add Pricing</Button>
                </DialogActions>
            </Dialog>

            {/* Instructions */}
            <Paper elevation={1} sx={{ p: 3, mt: 4, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>📋 Instructions</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    • Set different pricing per student for each course type across organizations
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    • Click the edit icon to modify existing pricing
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    • Use "Add New Pricing" to configure pricing for new organization/course combinations
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight="medium">
                    💡 Tip: Consider course complexity, duration, and organizational agreements when setting prices
                </Typography>
            </Paper>
        </Box>
    );
};

export default CoursePricingSetup; 