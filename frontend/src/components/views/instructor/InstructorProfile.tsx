import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  FormControlLabel
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const InstructorProfile: React.FC = () => {
  const { user } = useAuth();
  const { success, info } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Mock profile data - in real app this would come from API
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    certifications: ['CPR Instructor', 'First Aid Instructor', 'AED Certified'],
    joinDate: '2023-01-15',
    totalClasses: 45,
    totalStudents: 320
  });

  const [editData, setEditData] = useState(profileData);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profileData);
  };

  const handleSave = () => {
    setProfileData(editData);
    setIsEditing(false);
    success('Profile updated successfully!', {
      title: 'Profile Saved',
      context: 'profile_update'
    });
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleNotificationChange = (type: 'email' | 'sms') => {
    if (type === 'email') {
      setEmailNotifications(!emailNotifications);
      info(`Email notifications ${!emailNotifications ? 'enabled' : 'disabled'}`);
    } else {
      setSmsNotifications(!smsNotifications);
      info(`SMS notifications ${!smsNotifications ? 'enabled' : 'disabled'}`);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Instructor Profile
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your profile information, certifications, and notification preferences.
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Overview Card */}
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
                  fontSize: '2rem'
                }}
              >
                {getInitials(profileData.firstName, profileData.lastName)}
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {profileData.firstName} {profileData.lastName}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                CPR Instructor
              </Typography>
              
              <Chip 
                label="Active" 
                color="success" 
                size="small" 
                sx={{ mb: 2 }}
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2} sx={{ textAlign: 'center' }}>
                <Grid item xs={6}>
                  <Typography variant="h6" color="primary">
                    {profileData.totalClasses}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Classes Taught
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" color="primary">
                    {profileData.totalStudents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Students Trained
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Profile Information
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
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={editData.firstName}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={editData.lastName}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
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
                      label="Location"
                      value={editData.location}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    />
                  </Grid>
                </Grid>
              ) : (
                <List>
                  <ListItem>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Full Name" 
                      secondary={`${profileData.firstName} ${profileData.lastName}`} 
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
                      primary="Location" 
                      secondary={profileData.location} 
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

        {/* Certifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Certifications
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profileData.certifications.map((cert, index) => (
                  <Chip
                    key={index}
                    label={cert}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Button
                variant="text"
                size="small"
                sx={{ mt: 2 }}
                onClick={() => info('Certification management coming soon!')}
              >
                Manage Certifications
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
                    secondary="Receive updates about classes and schedule changes"
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
                    secondary="Receive urgent notifications via text message"
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

        {/* Security Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon />
                Security Settings
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Keep your account secure by regularly updating your password and reviewing your security settings.
              </Alert>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => info('Password change functionality coming soon!')}
                >
                  Change Password
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => info('Two-factor authentication setup coming soon!')}
                >
                  Enable 2FA
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => info('Login history view coming soon!')}
                >
                  View Login History
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InstructorProfile; 