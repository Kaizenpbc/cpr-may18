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
    Rating
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Business as BusinessIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Star as StarIcon
} from '@mui/icons-material';
import { sysAdminApi } from '../../services/api.ts';
import logger from '../../utils/logger';

const VendorManagement = ({ onShowSnackbar }) => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Dialog state
    const [showDialog, setShowDialog] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [formData, setFormData] = useState({
        vendor_name: '',
        contact_first_name: '',
        contact_last_name: '',
        email: '',
        mobile: '',
        phone: '',
        address_street: '',
        address_city: '',
        address_province: '',
        address_postal_code: '',
        vendor_type: '',
        services: [],
        contract_start_date: '',
        contract_end_date: '',
        performance_rating: 0,
        insurance_expiry: '',
        certification_status: '',
        billing_contact_email: '',
        comments: '',
        status: 'active'
    });

    const vendorTypes = [
        'Training Provider',
        'Equipment Supplier',
        'Certification Body',
        'Consulting Services',
        'Technology Provider',
        'Facility Rental',
        'Other'
    ];

    const serviceTypes = [
        'CPR Training',
        'First Aid Training',
        'BLS Training',
        'Equipment Supply',
        'Certification Services',
        'Facility Rental',
        'Technology Support',
        'Consulting',
        'Other'
    ];

    const certificationStatuses = [
        'Certified',
        'Pending',
        'Expired',
        'Not Required',
        'Under Review'
    ];

    useEffect(() => {
        loadVendors();
    }, []);

    const loadVendors = async () => {
        setLoading(true);
        try {
            const response = await sysAdminApi.getVendors();
            setVendors(response.data || []);
            setError('');
        } catch (err) {
            logger.error('Error loading vendors:', err);
            setError('Failed to load vendors');
            onShowSnackbar?.('Failed to load vendors', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingVendor(null);
        setFormData({
            vendor_name: '',
            contact_first_name: '',
            contact_last_name: '',
            email: '',
            mobile: '',
            phone: '',
            address_street: '',
            address_city: '',
            address_province: '',
            address_postal_code: '',
            vendor_type: '',
            services: [],
            contract_start_date: '',
            contract_end_date: '',
            performance_rating: 0,
            insurance_expiry: '',
            certification_status: '',
            billing_contact_email: '',
            comments: '',
            status: 'active'
        });
        setShowDialog(true);
    };

    const handleEdit = (vendor) => {
        setEditingVendor(vendor);
        setFormData({
            vendor_name: vendor.vendor_name || '',
            contact_first_name: vendor.contact_first_name || '',
            contact_last_name: vendor.contact_last_name || '',
            email: vendor.email || '',
            mobile: vendor.mobile || '',
            phone: vendor.phone || '',
            address_street: vendor.address_street || '',
            address_city: vendor.address_city || '',
            address_province: vendor.address_province || '',
            address_postal_code: vendor.address_postal_code || '',
            vendor_type: vendor.vendor_type || '',
            services: vendor.services || [],
            contract_start_date: vendor.contract_start_date ? vendor.contract_start_date.split('T')[0] : '',
            contract_end_date: vendor.contract_end_date ? vendor.contract_end_date.split('T')[0] : '',
            performance_rating: vendor.performance_rating || 0,
            insurance_expiry: vendor.insurance_expiry ? vendor.insurance_expiry.split('T')[0] : '',
            certification_status: vendor.certification_status || '',
            billing_contact_email: vendor.billing_contact_email || '',
            comments: vendor.comments || '',
            status: vendor.status || 'active'
        });
        setShowDialog(true);
    };

    const handleDelete = async (vendor) => {
        if (window.confirm(`Are you sure you want to deactivate the vendor "${vendor.vendor_name}"?`)) {
            try {
                await sysAdminApi.deleteVendor(vendor.id);
                onShowSnackbar?.('Vendor deactivated successfully', 'success');
                loadVendors();
            } catch (err) {
                logger.error('Error deactivating vendor:', err);
                onShowSnackbar?.('Failed to deactivate vendor', 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.vendor_name.trim()) {
            onShowSnackbar?.('Vendor name is required', 'error');
            return;
        }

        try {
            const submitData = {
                ...formData,
                contract_start_date: formData.contract_start_date || null,
                contract_end_date: formData.contract_end_date || null,
                insurance_expiry: formData.insurance_expiry || null,
                performance_rating: formData.performance_rating || null,
            };

            if (editingVendor) {
                await sysAdminApi.updateVendor(editingVendor.id, submitData);
                onShowSnackbar?.('Vendor updated successfully', 'success');
            } else {
                await sysAdminApi.createVendor(submitData);
                onShowSnackbar?.('Vendor created successfully', 'success');
            }
            
            setShowDialog(false);
            loadVendors();
        } catch (err) {
            logger.error('Error saving vendor:', err);
            onShowSnackbar?.('Failed to save vendor', 'error');
        }
    };

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleServicesChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            services: typeof value === 'string' ? value.split(',') : value
        }));
    };

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString() : '-';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'default';
            case 'suspended': return 'error';
            default: return 'default';
        }
    };

    const getCertificationColor = (status) => {
        switch (status) {
            case 'Certified': return 'success';
            case 'Pending': return 'warning';
            case 'Expired': return 'error';
            case 'Under Review': return 'info';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress size={60} />
                <Typography variant="body1" sx={{ ml: 2 }}>Loading vendors...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon color="primary" />
                        Vendor Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage vendor relationships, contracts, and performance
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddNew}
                    sx={{ minWidth: 200 }}
                >
                    Add New Vendor
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Vendors Table */}
            <TableContainer component={Paper} elevation={2}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Vendor Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Services</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Performance</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Certification</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Contract Period</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vendors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                                        No vendors found. Click "Add New Vendor" to get started.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            vendors.map((vendor, index) => (
                                <TableRow key={vendor.id} hover sx={{ backgroundColor: index % 2 !== 0 ? '#f9f9f9' : 'inherit' }}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {vendor.vendor_name}
                                        </Typography>
                                        {vendor.email && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {vendor.email}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {`${vendor.contact_first_name || ''} ${vendor.contact_last_name || ''}`.trim() || '-'}
                                        </Typography>
                                        {vendor.mobile && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {vendor.mobile}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {vendor.vendor_type || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {vendor.services && vendor.services.length > 0 ? (
                                                vendor.services.slice(0, 2).map((service, idx) => (
                                                    <Chip 
                                                        key={idx}
                                                        label={service} 
                                                        size="small" 
                                                        variant="outlined"
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">-</Typography>
                                            )}
                                            {vendor.services && vendor.services.length > 2 && (
                                                <Chip 
                                                    label={`+${vendor.services.length - 2} more`} 
                                                    size="small" 
                                                    variant="outlined"
                                                    color="primary"
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {vendor.performance_rating ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Rating 
                                                    value={vendor.performance_rating} 
                                                    readOnly 
                                                    size="small"
                                                />
                                                <Typography variant="caption">
                                                    ({vendor.performance_rating}/5)
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">Not rated</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={vendor.certification_status || 'Not Set'} 
                                            size="small" 
                                            color={getCertificationColor(vendor.certification_status)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {vendor.contract_start_date ? formatDate(vendor.contract_start_date) : '-'}
                                        </Typography>
                                        {vendor.contract_end_date && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                to {formatDate(vendor.contract_end_date)}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={vendor.status || 'active'} 
                                            color={getStatusColor(vendor.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Edit Vendor">
                                                <IconButton
                                                    onClick={() => handleEdit(vendor)}
                                                    color="primary"
                                                    size="small"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Deactivate Vendor">
                                                <IconButton
                                                    onClick={() => handleDelete(vendor)}
                                                    color="error"
                                                    size="small"
                                                    disabled={vendor.status === 'inactive'}
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

            {/* Add/Edit Vendor Dialog */}
            <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            {/* Basic Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Vendor Name"
                                    name="vendor_name"
                                    value={formData.vendor_name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Vendor Type</InputLabel>
                                    <Select
                                        name="vendor_type"
                                        value={formData.vendor_type}
                                        label="Vendor Type"
                                        onChange={handleChange}
                                    >
                                        {vendorTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Contact Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Contact Information</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Contact First Name"
                                    name="contact_first_name"
                                    value={formData.contact_first_name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Contact Last Name"
                                    name="contact_last_name"
                                    value={formData.contact_last_name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="email"
                                    label="Email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Mobile"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                />
                            </Grid>

                            {/* Services */}
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Services Provided</InputLabel>
                                    <Select
                                        multiple
                                        name="services"
                                        value={formData.services}
                                        label="Services Provided"
                                        onChange={handleServicesChange}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {serviceTypes.map((service) => (
                                            <MenuItem key={service} value={service}>
                                                {service}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Contract & Performance */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Contract & Performance</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Contract Start Date"
                                    name="contract_start_date"
                                    value={formData.contract_start_date}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Contract End Date"
                                    name="contract_end_date"
                                    value={formData.contract_end_date}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box>
                                    <Typography component="legend">Performance Rating</Typography>
                                    <Rating
                                        name="performance_rating"
                                        value={formData.performance_rating}
                                        onChange={(event, newValue) => {
                                            setFormData(prev => ({ ...prev, performance_rating: newValue }));
                                        }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Certification Status</InputLabel>
                                    <Select
                                        name="certification_status"
                                        value={formData.certification_status}
                                        label="Certification Status"
                                        onChange={handleChange}
                                    >
                                        {certificationStatuses.map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {status}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Comments */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Comments"
                                    name="comments"
                                    value={formData.comments}
                                    onChange={handleChange}
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
                        {editingVendor ? 'Update Vendor' : 'Create Vendor'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VendorManagement; 