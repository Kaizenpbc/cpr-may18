import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import logger from '../../utils/logger';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Grid, Alert, CircularProgress, Select, MenuItem,
    FormControl, InputLabel, FormHelperText
} from '@mui/material';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { createUser, updateUser } from '../../services/userService';

// Initial empty state for a new user
const initial_user_state = {
    username: '',
    password: '', // Handle password update separately if editing
    role: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '', // Added phone
    organization_id: '' // Store as string initially for Select compatibility
};

// Define allowed roles (fetch from backend ideally, but hardcode for now)
const roles = ['SuperAdmin', 'Admin', 'Instructor', 'Organization', 'Accounting'];

function UserDialog({ open, onClose, onSave, user, existing_users = [] }) {
    const [user_data, setUserData] = useState(initial_user_state);
    const [organizations, setOrganizations] = useState([]);
    const [loading_orgs, setLoadingOrgs] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [field_errors, setFieldErrors] = useState({});
    const is_edit_mode = Boolean(user?.user_id);

    // Fetch organizations for the dropdown if role is Organization
    const fetchOrganizations = useCallback(async () => {
        setLoadingOrgs(true);
        try {
            logger.info('Fetching organizations for user dialog');
            const data = await api.getOrganizations(); // Use existing API function
            setOrganizations(data || []);
        } catch (fetch_err) {
            logger.error("Error fetching organizations for dialog:", fetch_err);
            setError('Could not load organizations list.'); // Show error in dialog
            setOrganizations([]);
        }
        setLoadingOrgs(false);
    }, []);

    useEffect(() => {
        if (open) { // Only fetch when dialog is opened
             fetchOrganizations();
             if (is_edit_mode && user) {
                 setUserData({
                     username: user.username || '',
                     password: '', // Don't prefill password for edit
                     role: user.role || '',
                     first_name: user.first_name || '',
                     last_name: user.last_name || '',
                     email: user.email || '',
                     phone: user.phone || '', // Add phone
                     organization_id: user.organization_id ? String(user.organization_id) : '' // Convert ID to string for Select
                 });
             } else {
                 setUserData(initial_user_state);
             }
             setError('');
             setFieldErrors({});
         } 
    }, [user, is_edit_mode, open, fetchOrganizations]);

    // Handler for standard MUI TextFields
    const handleTextChange = (event) => {
        const { name, value } = event.target;
        setUserData(prev_data => ({
            ...prev_data,
            [name]: value
        }));
        if (field_errors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: false }));
        }
        if (error) {
            setError('');
        }
    };

    // Handler specifically for react-phone-number-input
    const handlePhoneChange = (name, value) => {
        setUserData(prev_data => ({
            ...prev_data,
            // Use the name passed ('phone') and the value directly
            [name]: value || '' // Ensure empty string if value is null/undefined
        }));
        if (field_errors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: false }));
        }
        if (error) {
            setError('');
        }
    };

    const handleSave = async () => {
        setError('');
        setFieldErrors({});
        let has_client_error = false;
        const new_field_errors = {};

        // --- Client-side validation ---
        // Required fields
        if (!user_data.username.trim()) new_field_errors.username = "Username required";
        if (!is_edit_mode && !user_data.password) new_field_errors.password = "Password required for new user";
        if (!user_data.role) new_field_errors.role = "Role required";
        if (!user_data.first_name.trim()) new_field_errors.first_name = "First Name required";
        if (!user_data.last_name.trim()) new_field_errors.last_name = "Last Name required";
        if (user_data.role === 'Organization' && !user_data.organization_id) new_field_errors.organization_id = "Organization required for this role";
        
        // Phone validation (if entered)
        if (user_data.phone && !isValidPhoneNumber(user_data.phone)) {
            new_field_errors.phone = "Invalid phone number.";
        }
        
        // Email format validation (basic)
        if (user_data.email && !/\S+@\S+\.\S+/.test(user_data.email)) {
            new_field_errors.email = "Invalid email format.";
        }

        // Check for duplicate username (case-insensitive, ignore self if editing)
        const username_lower = user_data.username.trim().toLowerCase();
        if (username_lower && existing_users.some(u => 
            u.username.toLowerCase() === username_lower && u.user_id !== user?.user_id
        )) {
            new_field_errors.username = "Username already taken.";
        }
        
        // Check for duplicate email (case-insensitive, ignore self if editing, allow empty)
        const email_lower = user_data.email.trim().toLowerCase();
        if (email_lower && existing_users.some(u => 
            u.email && u.email.toLowerCase() === email_lower && u.user_id !== user?.user_id
        )) {
            new_field_errors.email = "Email already registered.";
        }
        // --- End Client-side validation ---

        if (Object.keys(new_field_errors).length > 0) {
            setError('Please fix highlighted field(s).');
            setFieldErrors(new_field_errors);
            return; 
        }

        setLoading(true);
        try {
            // Prepare data for API (convert orgId back to number if set)
            const data_to_send = {
                ...user_data,
                organization_id: user_data.organization_id ? parseInt(user_data.organization_id, 10) : null,
            };
            // Don't send empty password string for updates unless explicitly changing
            if (is_edit_mode && !data_to_send.password) {
                delete data_to_send.password;
            }

            if (is_edit_mode) {
                logger.info('[UserDialog] Calling updateUser with ID:', user.user_id, 'Data:', data_to_send);
                await updateUser(user.user_id, data_to_send);
            } else {
                logger.info('[UserDialog] Calling addUser with Data:', data_to_send);
                await createUser(data_to_send);
            }
            logger.info('[UserDialog] Save successful, calling onSave and onClose.');
            onSave(); 
            onClose(); 
        } catch (err) {
            logger.error('Save user error:', err);
            const message = err.message || 'Failed to save user.';
            
            // Try to parse backend error for specific fields
            const new_field_errors = {};
            if (message.toLowerCase().includes('username already exists')) {
                 new_field_errors.username = "Username already exists.";
            } else if (message.toLowerCase().includes('email already exists')) {
                 new_field_errors.email = "Email already exists.";
            } else if (message.toLowerCase().includes('invalid organization id')) {
                 new_field_errors.organization_id = "Selected organization is invalid.";
            } // Add more specific checks if backend provides them
            
             // Set general error and specific field errors
            setError(message); // Still show general error message
            setFieldErrors(prev => ({...prev, ...new_field_errors})); // Merge with existing client errors
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{is_edit_mode ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField name="username" label="Username *" value={user_data.username} onChange={handleTextChange} fullWidth required error={Boolean(field_errors.username)} helperText={field_errors.username || ""}/>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="password" label={is_edit_mode ? "New Password (Optional)" : "Password *"} type="password" value={user_data.password} onChange={handleTextChange} fullWidth required={!is_edit_mode} error={Boolean(field_errors.password)} helperText={field_errors.password || ""}/>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="first_name" label="First Name *" value={user_data.first_name} onChange={handleTextChange} fullWidth required error={Boolean(field_errors.first_name)} helperText={field_errors.first_name || ""}/>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="last_name" label="Last Name *" value={user_data.last_name} onChange={handleTextChange} fullWidth required error={Boolean(field_errors.last_name)} helperText={field_errors.last_name || ""}/>
                    </Grid>
                     <Grid item xs={12} sm={6}>
                        <TextField name="email" label="Email" type="email" value={user_data.email} onChange={handleTextChange} fullWidth error={Boolean(field_errors.email)} helperText={field_errors.email || ""}/>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={Boolean(field_errors.phone)}>
                            <PhoneInput
                                placeholder="Enter phone number"
                                value={user_data.phone}
                                onChange={(value) => handlePhoneChange('phone', value)}
                                defaultCountry="CA"
                                international
                                countryCallingCodeEditable={false}
                                limitMaxLength
                                style={{ 
                                    border: field_errors.phone ? '1px solid red' : '1px solid #ccc', 
                                    borderRadius: '4px', 
                                    padding: '16.5px 14px' 
                                }}
                                className={field_errors.phone ? 'phone-input-error' : ''}
                            />
                            {field_errors.phone && <FormHelperText>{field_errors.phone}</FormHelperText>}
                        </FormControl>
                    </Grid>
                     <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required error={Boolean(field_errors.role)}>
                            <InputLabel id="role-select-label">Role *</InputLabel>
                            <Select name="role" labelId="role-select-label" label="Role *" value={user_data.role} onChange={handleTextChange}>
                                {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                            </Select>
                            {field_errors.role && <FormHelperText>{field_errors.role}</FormHelperText>}
                        </FormControl>
                    </Grid>
                   
                    {/* Conditional Organization Dropdown */}
                    {user_data.role === 'Organization' && (
                        <Grid item xs={12}>
                            <FormControl fullWidth required error={Boolean(field_errors.organization_id)} disabled={loading_orgs}>
                                <InputLabel id="org-select-label">Organization *</InputLabel>
                                <Select 
                                    name="organization_id"
                                    labelId="org-select-label"
                                    label="Organization *" 
                                    value={user_data.organization_id} 
                                    onChange={handleTextChange}
                                >
                                    <MenuItem value=""><em>Select Organization...</em></MenuItem>
                                    {organizations.map(org => (
                                        <MenuItem key={org.organization_id} value={String(org.organization_id)}>
                                            {org.organization_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {field_errors.organization_id && <FormHelperText>{field_errors.organization_id}</FormHelperText>}
                                {loading_orgs && <FormHelperText>Loading organizations...</FormHelperText>}
                            </FormControl>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : (is_edit_mode ? 'Save Changes' : 'Add User')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UserDialog; 