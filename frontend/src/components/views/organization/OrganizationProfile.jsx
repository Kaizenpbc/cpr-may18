import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  Alert,
  TextField,
  Switch,
  FormControlLabel,
  Snackbar
} from '@mui/material';
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Group as GroupIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';

const OrganizationProfile = ({ showSnackbar }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Organization profile data - using real data from user context with fallbacks
  const [profileData, setProfileData] = useState({
    organizationName: user?.organizationName || 'Your Organization',
    contactPerson: user?.username || 'Contact Person',
    title: 'Training Coordinator',
    email: user?.email || 'contact@organization.com',
    phone: '+1 (555) 000-0000',
    address: '123 Business Ave, Suite 100',
    city: 'Your City',
    state: 'State',
    zipCode: '00000',
    website: 'www.yourorganization.com',
    industry: 'Healthcare',
    employeeCount: '1-50',
    joinDate: '2024-01-01',
    totalCourses: 0,
    totalStudents: 0,
    activeInstructors: 0
  });

  const [editData, setEditData] = useState(profileData);

  // Update profile data when user data changes
  useEffect(() => {
    if (user) {
      setProfileData(prevData => ({
        ...prevData,
        organizationName: user.organizationName || prevData.organizationName,
        contactPerson: user.username || prevData.contactPerson,
        email: user.email || prevData.email
      }));
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profileData);
  };

  const handleSave = () => {
    setProfileData(editData);
    setIsEditing(false);
    if (showSnackbar) {
      showSnackbar('Organization profile updated successfully!', 'success');
    }
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleNotificationChange = (type) => {
    if (type === 'email') {
      setEmailNotifications(!emailNotifications);
      if (showSnackbar) {
        showSnackbar(`Email notifications ${!emailNotifications ? 'enabled' : 'disabled'}`, 'info');
      }
    } else {
      setSmsNotifications(!smsNotifications);
      if (showSnackbar) {
        showSnackbar(`SMS notifications ${!smsNotifications ? 'enabled' : 'disabled'}`, 'info');
      }
    }
  };

  const getInitials = (orgName) => {
    return orgName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Organization Profile
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Manage your organization information, contact details, and notification preferences.
      </Typography>

      {user?.organizationName && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Organization:</strong> {user.organizationName} - This organization is automatically associated with your user account.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Organization Overview Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem'
                }}
              >
                {getInitials(profileData.organizationName)}
              </Avatar>
              
              <Typography variant="h6" gutterBottom>
                {profileData.organizationName}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profileData.industry}
              </Typography>
              
              <Chip 
                label="Active Member" 
                color="success" 
                size="small" 
                sx={{ mb: 2 }}
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2} sx={{ textAlign: 'center' }}>
                <Grid item xs={4}>
                  <Typography variant="h6" color="primary">
                    {profileData.totalCourses}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Courses
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h6" color="primary">
                    {profileData.totalStudents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Students
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h6" color="primary">
                    {profileData.activeInstructors}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Instructors
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Organization Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Organization Information
                </Typography>
                {!isEditing ? (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    variant="outlined"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      variant="contained"
                      color="primary"
                    >
                      Save
                    </Button>
                    <Button
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      variant="outlined"
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>

              {isEditing ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Organization Name"
                      value={editData.organizationName}
                      onChange={(e) => setEditData({ ...editData, organizationName: e.target.value })}
                      disabled
                      helperText="Organization name is linked to your user account and cannot be changed here"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Contact Person"
                      value={editData.contactPerson}
                      onChange={(e) => setEditData({ ...editData, contactPerson: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Website"
                      value={editData.website}
                      onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="City"
                      value={editData.city}
                      onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="State"
                      value={editData.state}
                      onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Zip Code"
                      value={editData.zipCode}
                      onChange={(e) => setEditData({ ...editData, zipCode: e.target.value })}
                    />
                  </Grid>
                </Grid>
              ) : (
                <List>
                  <ListItem>
                    <ListItemIcon><BusinessIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Organization Name" 
                      secondary={profileData.organizationName} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><GroupIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Contact Person" 
                      secondary={`${profileData.contactPerson} - ${profileData.title}`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><EmailIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Email" 
                      secondary={profileData.email} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PhoneIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Phone" 
                      secondary={profileData.phone} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><LocationIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Address" 
                      secondary={`${profileData.address}, ${profileData.city}, ${profileData.state} ${profileData.zipCode}`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><BadgeIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Member Since" 
                      secondary={new Date(profileData.joinDate).toLocaleDateString()} 
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Organization Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Organization Details
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Industry" 
                    secondary={profileData.industry}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Employee Count" 
                    secondary={profileData.employeeCount}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Website" 
                    secondary={profileData.website}
                  />
                </ListItem>
              </List>
              <Button
                variant="text"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => showSnackbar && showSnackbar('Organization details management coming soon!', 'info')}
              >
                Update Organization Details
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon />
                Notification Preferences
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Email Notifications" 
                    secondary="Receive updates about course schedules and instructor assignments"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailNotifications}
                        onChange={() => handleNotificationChange('email')}
                      />
                    }
                    label=""
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="SMS Notifications" 
                    secondary="Receive urgent notifications about course changes"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={smsNotifications}
                        onChange={() => handleNotificationChange('sms')}
                      />
                    }
                    label=""
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Training Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon />
                Training Statistics
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="h4" color="primary.contrastText">
                      {profileData.totalCourses}
                    </Typography>
                    <Typography variant="body2" color="primary.contrastText">
                      Total Courses Scheduled
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="h4" color="success.contrastText">
                      {profileData.totalStudents}
                    </Typography>
                    <Typography variant="body2" color="success.contrastText">
                      Students Trained
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon />
                Security Settings
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Keep your organization account secure by regularly updating passwords and reviewing access permissions.
              </Alert>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => showSnackbar && showSnackbar('Password change functionality coming soon!', 'info')}
                >
                  Change Password
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => showSnackbar && showSnackbar('User management coming soon!', 'info')}
                >
                  Manage Users
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => showSnackbar && showSnackbar('Access logs coming soon!', 'info')}
                >
                  View Access Logs
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrganizationProfile; 