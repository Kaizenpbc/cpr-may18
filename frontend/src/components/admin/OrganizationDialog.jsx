import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Alert,
    CircularProgress,
    Typography
} from '@mui/material';
// Phone Input Libraries
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; // Import default styles

// Initial empty state for a new organization
const initial_org_state = {
    organization_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '', // Store as E.164
    address_street: '',
    address_city: '',
    address_province: '',
    address_postal_code: '',
    ceo_name: '',
    ceo_phone: '', // Store as E.164
    ceo_email: ''
};

function OrganizationDialog({ open, onClose, onSave, organization }) {
    const [org_data, setOrgData] = useState(initial_org_state);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [field_errors, setFieldErrors] = useState({}); // State for field-specific errors
    const is_edit_mode = Boolean(organization?.organization_id);

    useEffect(() => {
        // Populate form if editing, otherwise reset
        if (is_edit_mode && organization) {
            // Map incoming data (lowercase keys) to state (camelCase/lowercase if needed)
            // Assuming backend returns lowercase keys as per schema
            setOrgData({
                organization_name: organization.organization_name || '',
                contact_name: organization.contact_name || '',
                contact_email: organization.contact_email || '',
                contact_phone: organization.contact_phone || '', // Already E.164 from DB
                address_street: organization.address_street || '',
                address_city: organization.address_city || '',
                address_province: organization.address_province || '',
                address_postal_code: organization.address_postal_code || '',
                ceo_name: organization.ceo_name || '',
                ceo_phone: organization.ceo_phone || '', // Already E.164 from DB
                ceo_email: organization.ceo_email || ''
            });
        } else {
            setOrgData(initial_org_state);
        }
        setError(''); // Clear general error
        setFieldErrors({}); // Clear field errors when dialog opens/org changes
    }, [organization, is_edit_mode, open]);

    // Handles both TextField changes and PhoneInput changes
    const handleChange = (name, value) => {
        setOrgData(prev_data => ({
            ...prev_data,
            [name]: value
        }));
        // Clear specific field error on change
        if (field_errors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: false }));
        }
        // Clear general error message when user starts typing
        if (error) {
            setError('');
        }
    };

    const handleSave = async () => {
        setError('');
        setFieldErrors({});
        const new_field_errors = {};

        // Client-side validation
        if (!org_data.organization_name) new_field_errors.organization_name = "Organization Name required";
        if (!org_data.contact_name) new_field_errors.contact_name = "Contact Name required";
        if (!org_data.contact_email) new_field_errors.contact_email = "Contact Email required";
        if (!org_data.contact_phone) new_field_errors.contact_phone = "Contact Phone required";
        
        if (Object.keys(new_field_errors).length > 0) {
            setError('Please fix highlighted field(s).');
            setFieldErrors(new_field_errors);
            return;
        }

        setLoading(true);
        try {
            if (is_edit_mode) {
                await api.updateOrganization(organization.organization_id, org_data);
            } else {
                await api.addOrganization(org_data);
            }
            onSave();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save organization');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{is_edit_mode ? 'Edit Organization' : 'Add New Organization'}</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Organization Details */}
                    <Grid xs={12} sm={12}>
                        <TextField
                            name="organization_name"
                            label="Organization Name *"
                            value={org_data.organization_name}
                            onChange={(e) => handleChange('organization_name', e.target.value)}
                            fullWidth required
                            error={Boolean(field_errors.organization_name)}
                            helperText={field_errors.organization_name || ""}
                        />
                    </Grid>
                    {/* Address */}
                    <Grid xs={12}>
                        <TextField name="address_street" label="Street Address" value={org_data.address_street} onChange={(e) => handleChange('address_street', e.target.value)} fullWidth />
                    </Grid>
                    <Grid xs={12} sm={4}>
                        <TextField name="address_city" label="City" value={org_data.address_city} onChange={(e) => handleChange('address_city', e.target.value)} fullWidth />
                    </Grid>
                    <Grid xs={12} sm={4}>
                        <TextField name="address_province" label="Province" value={org_data.address_province} onChange={(e) => handleChange('address_province', e.target.value)} fullWidth />
                    </Grid>
                    <Grid xs={12} sm={4}>
                        <TextField name="address_postal_code" label="Postal Code" value={org_data.address_postal_code} onChange={(e) => handleChange('address_postal_code', e.target.value)} fullWidth />
                    </Grid>
                    {/* Contact Person */}
                    <Grid xs={12} sm={6}>
                        <TextField name="contact_name" label="Contact Name" value={org_data.contact_name} onChange={(e) => handleChange('contact_name', e.target.value)} fullWidth />
                    </Grid>
                     <Grid xs={12} sm={6}>
                        <PhoneInput
                            placeholder="Enter contact phone"
                            value={org_data.contact_phone}
                            onChange={(value) => handleChange('contact_phone', value || '')}
                            defaultCountry="CA"
                            international
                            countryCallingCodeEditable={false}
                            limitMaxLength
                            style={{ marginBottom: '0px'}}
                            className={field_errors.contact_phone ? 'phone-input-error' : ''}
                        />
                         {field_errors.contact_phone && <Typography color="error" variant="caption">{field_errors.contact_phone}</Typography>}
                    </Grid>
                    <Grid xs={12} sm={12}>
                        <TextField name="contact_email" label="Contact Email" value={org_data.contact_email} type="email" onChange={(e) => handleChange('contact_email', e.target.value)} fullWidth />
                    </Grid>
                    {/* CEO Details */}
                     <Grid xs={12} sm={6}>
                        <TextField name="ceo_name" label="CEO Name" value={org_data.ceo_name} onChange={(e) => handleChange('ceo_name', e.target.value)} fullWidth />
                    </Grid>
                     <Grid xs={12} sm={6}>
                        <PhoneInput
                            placeholder="Enter CEO phone"
                            value={org_data.ceo_phone}
                            onChange={(value) => handleChange('ceo_phone', value || '')}
                            defaultCountry="CA"
                            international
                            countryCallingCodeEditable={false}
                            limitMaxLength
                            style={{ marginBottom: '0px'}}
                            className={field_errors.ceo_phone ? 'phone-input-error' : ''}
                        />
                         {field_errors.ceo_phone && <Typography color="error" variant="caption">{field_errors.ceo_phone}</Typography>}
                    </Grid>
                    <Grid xs={12} sm={12}>
                        <TextField name="ceo_email" label="CEO Email" value={org_data.ceo_email} type="email" onChange={(e) => handleChange('ceo_email', e.target.value)} fullWidth />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : (is_edit_mode ? 'Save Changes' : 'Add Organization')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default OrganizationDialog; 