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
    People as PeopleIcon,
    Save as SaveIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { sysAdminApi, getOrganizations } from '../../services/api.ts';
import logger from '../../utils/logger';

const UserManagement = ({ onShowSnackbar }) => {
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Dialog state
    const [showDialog, setShowDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        full_name: '',
        role: '',
        mobile: '',
        organization_id: '',
        date_onboarded: '',
        user_comments: '',
        status: 'active'
    });

    const userRoles = [
        'admin',
        'instructor',
        'organization',
        'student',
        'accountant',
        'sysadmin'
    ];

    const userStatuses = [
        'active',
        'inactive',
        'suspended'
    ];

    useEffect(() => {
        loadUsers();
        loadOrganizations();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await sysAdminApi.getUsers();
            setUsers(response.data || []);
            setError('');
        } catch (err) {
            logger.error('Error loading users:', err);
            setError('Failed to load users');
            onShowSnackbar?.('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadOrganizations = async () => {
        try {
            const response = await getOrganizations();
            setOrganizations(response.data || []);
        } catch (err) {
            logger.error('Error loading organizations:', err);
        }
    };

    const handleAddNew = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            full_name: '',
            role: '',
            mobile: '',
            organization_id: '',
            date_onboarded: '',
            user_comments: '',
            status: 'active'
        });
        setShowDialog(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username || '',
            email: user.email || '',
            password: '', // Don't pre-fill password for security
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            full_name: user.full_name || '',
            role: user.role || '',
            mobile: user.mobile || '',
            organization_id: user.organization_id || '',
            date_onboarded: user.date_onboarded ? user.date_onboarded.split('T')[0] : '',
            user_comments: user.user_comments || '',
            status: user.status || 'active'
        });
        setShowDialog(true);
    };

    const handleDelete = async (user) => {
        if (window.confirm(`Are you sure you want to deactivate the user "${user.username}"?`)) {
            try {
                await sysAdminApi.deleteUser(user.id);
                onShowSnackbar?.('User deactivated successfully', 'success');
                loadUsers();
            } catch (err) {
                logger.error('Error deactivating user:', err);
                onShowSnackbar?.('Failed to deactivate user', 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.username.trim() || !formData.email.trim() || !formData.role) {
            onShowSnackbar?.('Username, email, and role are required', 'error');
            return;
        }

        if (!editingUser && !formData.password.trim()) {
            onShowSnackbar?.('Password is required for new users', 'error');
            return;
        }

        try {
            const submitData = {
                ...formData,
                organization_id: formData.organization_id || null,
                date_onboarded: formData.date_onboarded || null,
            };

            // Remove password if it's empty (for updates)
            if (!submitData.password) {
                delete submitData.password;
            }

            if (editingUser) {
                await sysAdminApi.updateUser(editingUser.id, submitData);
                onShowSnackbar?.('User updated successfully', 'success');
            } else {
                await sysAdminApi.createUser(submitData);
                onShowSnackbar?.('User created successfully', 'success');
            }
            
            setShowDialog(false);
            loadUsers();
        } catch (err) {
            logger.error('Error saving user:', err);
            
            // Extract specific error message from API response
            let errorMessage = 'Failed to save user';
            if (err.response?.data?.error?.message) {
                errorMessage = err.response.data.error.message;
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            onShowSnackbar?.(errorMessage, 'error');
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
        return dateString ? new Date(dateString).toLocaleDateString() : '-';
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'error';
            case 'sysadmin': return 'secondary';
            case 'instructor': return 'primary';
            case 'organization': return 'success';
            case 'accountant': return 'warning';
            case 'student': return 'info';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress size={60} />
                <Typography variant="body1" sx={{ ml: 2 }}>Loading users...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon color="primary" />
                        User Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Create and manage user accounts, roles, and permissions
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddNew}
                    sx={{ minWidth: 200 }}
                >
                    Add New User
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Users Table */}
            <TableContainer component={Paper} elevation={2}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Organization</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Mobile</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Date Onboarded</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                                        No users found. Click "Add New User" to get started.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user, index) => (
                                <TableRow key={user.id} hover sx={{ backgroundColor: index % 2 !== 0 ? '#f9f9f9' : 'inherit' }}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {user.username}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.email}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={user.role} 
                                            size="small" 
                                            color={getRoleColor(user.role)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.organization_name || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.mobile || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={user.status || 'active'} 
                                            color={user.status === 'active' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatDate(user.date_onboarded)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Edit User">
                                                <IconButton
                                                    onClick={() => handleEdit(user)}
                                                    color="primary"
                                                    size="small"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Deactivate User">
                                                <IconButton
                                                    onClick={() => handleDelete(user)}
                                                    color="error"
                                                    size="small"
                                                    disabled={user.status === 'inactive'}
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

            {/* Add/Edit User Dialog */}
            <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
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
                                    type="password"
                                    label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!editingUser}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        name="role"
                                        value={formData.role}
                                        label="Role"
                                        onChange={handleChange}
                                    >
                                        {userRoles.map((role) => (
                                            <MenuItem key={role} value={role}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    name="last_name"
                                    value={formData.last_name}
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
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Organization</InputLabel>
                                    <Select
                                        name="organization_id"
                                        value={formData.organization_id}
                                        label="Organization"
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {organizations.map((org) => (
                                            <MenuItem key={org.id} value={org.id}>
                                                {org.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Date Onboarded"
                                    name="date_onboarded"
                                    value={formData.date_onboarded}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        name="status"
                                        value={formData.status}
                                        label="Status"
                                        onChange={handleChange}
                                    >
                                        {userStatuses.map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
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
                                    label="Comments"
                                    name="user_comments"
                                    value={formData.user_comments}
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
                        {editingUser ? 'Update User' : 'Create User'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement; 