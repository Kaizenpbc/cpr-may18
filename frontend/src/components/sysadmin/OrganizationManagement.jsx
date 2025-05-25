import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  MenuItem,
  Grid,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { sysAdminApi } from '../../services/api';

const OrganizationManagement = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Canada',
    contact_person: '',
    contact_position: 'Manager',
    contact_email: '',
    contact_phone: '',
    organization_comments: ''
  });

  const positions = ['Owner', 'Manager', 'Director', 'Administrator', 'Other'];

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await sysAdminApi.getOrganizations();
      setOrganizations(response.data || []);
    } catch (err) {
      setError('Failed to load organizations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (org = null) => {
    if (org) {
      setEditingOrg(org);
      setFormData({
        name: org.organization_name || '',
        address: org.address || '',
        city: org.city || '',
        province: org.province || '',
        postal_code: org.postal_code || '',
        country: org.country || 'Canada',
        contact_person: org.contact_person || '',
        contact_position: org.contact_position || 'Manager',
        contact_email: org.contact_email || '',
        contact_phone: org.contact_phone || '',
        organization_comments: org.organization_comments || ''
      });
    } else {
      setEditingOrg(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        country: 'Canada',
        contact_person: '',
        contact_position: 'Manager',
        contact_email: '',
        contact_phone: '',
        organization_comments: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOrg(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setError('');
      if (editingOrg) {
        await sysAdminApi.updateOrganization(editingOrg.id, formData);
        setSuccess('Organization updated successfully');
      } else {
        await sysAdminApi.createOrganization(formData);
        setSuccess('Organization created successfully');
      }
      handleCloseDialog();
      loadOrganizations();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save organization');
      console.error(err);
    }
  };

  const handleDelete = async (orgId) => {
    try {
      setError('');
      await sysAdminApi.deleteOrganization(orgId);
      setSuccess('Organization deleted successfully');
      setDeleteConfirm(null);
      loadOrganizations();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.error?.details || 'Failed to delete organization');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    // Format as (xxx) xxx-xxxx
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <h2>Organization Management</h2>
          <p style={{ color: '#666' }}>Manage organizations and their contact information</p>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Organization
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Organization</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="center">Stats</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <Box>
                    <Box sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" color="primary" />
                      {org.organization_name}
                    </Box>
                    {org.organization_comments && (
                      <Box sx={{ fontSize: '0.85em', color: '#666', mt: 0.5 }}>
                        {org.organization_comments}
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{org.contact_person || '-'}</TableCell>
                <TableCell>
                  {org.contact_position && (
                    <Chip
                      label={org.contact_position}
                      size="small"
                      color={org.contact_position === 'Owner' ? 'primary' : 'default'}
                    />
                  )}
                </TableCell>
                <TableCell>{org.contact_email || '-'}</TableCell>
                <TableCell>{formatPhone(org.contact_phone) || '-'}</TableCell>
                <TableCell>
                  {org.city && org.province ? (
                    <Box sx={{ fontSize: '0.9em' }}>
                      {org.city}, {org.province}
                    </Box>
                  ) : '-'}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title="Users">
                      <Chip
                        icon={<PeopleIcon />}
                        label={org.user_count || 0}
                        size="small"
                        variant="outlined"
                      />
                    </Tooltip>
                    <Tooltip title="Courses">
                      <Chip
                        icon={<SchoolIcon />}
                        label={org.course_count || 0}
                        size="small"
                        variant="outlined"
                      />
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpenDialog(org)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setDeleteConfirm(org)}
                    color="error"
                    disabled={org.user_count > 0 || org.course_count > 0}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingOrg ? 'Edit Organization' : 'Add New Organization'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Organization Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Position"
                name="contact_position"
                value={formData.contact_position}
                onChange={handleInputChange}
              >
                {positions.map((pos) => (
                  <MenuItem key={pos} value={pos}>
                    {pos}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                placeholder="(123) 456-7890"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Province"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comments"
                name="organization_comments"
                value={formData.organization_comments}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingOrg ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the organization "{deleteConfirm?.organization_name}"?
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => handleDelete(deleteConfirm.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationManagement; 