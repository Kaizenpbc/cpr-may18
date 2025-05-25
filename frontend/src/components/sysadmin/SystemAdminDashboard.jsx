import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Paper,
    Chip
} from '@mui/material';
import {
    People as PeopleIcon,
    Business as BusinessIcon,
    School as SchoolIcon,
    Store as VendorIcon,
    Person as PersonIcon,
    MenuBook as CourseIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { sysAdminApi } from '../../services/api.ts';
import logger from '../../utils/logger';

const SystemAdminDashboard = ({ onShowSnackbar }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const response = await sysAdminApi.getDashboard();
            setDashboardData(response.data);
            setError('');
        } catch (err) {
            logger.error('Error loading dashboard data:', err);
            setError('Failed to load dashboard data');
            onShowSnackbar?.('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const StatCard = ({ title, value, icon, color = 'primary' }) => (
        <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div" color={`${color}.main`}>
                            {value}
                        </Typography>
                    </Box>
                    <Box sx={{ color: `${color}.main` }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress size={60} />
                <Typography variant="body1" sx={{ ml: 2 }}>Loading dashboard...</Typography>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }

    const { summary, recentActivity } = dashboardData || {};

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="primary" />
                    System Overview
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Monitor and manage your CPR training platform
                </Typography>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Users"
                        value={summary?.totalUsers || 0}
                        icon={<PeopleIcon sx={{ fontSize: 40 }} />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Organizations"
                        value={summary?.totalOrganizations || 0}
                        icon={<BusinessIcon sx={{ fontSize: 40 }} />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Courses"
                        value={summary?.totalCourses || 0}
                        icon={<SchoolIcon sx={{ fontSize: 40 }} />}
                        color="info"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Vendors"
                        value={summary?.totalVendors || 0}
                        icon={<VendorIcon sx={{ fontSize: 40 }} />}
                        color="warning"
                    />
                </Grid>
            </Grid>

            {/* Recent Activity */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="primary" />
                            Recent Users
                        </Typography>
                        {recentActivity?.users?.length > 0 ? (
                            <List>
                                {recentActivity.users.map((user, index) => (
                                    <ListItem key={index} divider={index < recentActivity.users.length - 1}>
                                        <ListItemIcon>
                                            <PersonIcon color="action" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={user.username}
                                            secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <Chip 
                                                        label={user.role} 
                                                        size="small" 
                                                        color={
                                                            user.role === 'admin' ? 'error' :
                                                            user.role === 'instructor' ? 'primary' :
                                                            user.role === 'organization' ? 'success' : 'default'
                                                        }
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDate(user.created_at)}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No recent user activity
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CourseIcon color="primary" />
                            Recent Courses
                        </Typography>
                        {recentActivity?.courses?.length > 0 ? (
                            <List>
                                {recentActivity.courses.map((course, index) => (
                                    <ListItem key={index} divider={index < recentActivity.courses.length - 1}>
                                        <ListItemIcon>
                                            <CourseIcon color="action" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={course.name}
                                            secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <Chip 
                                                        label={course.course_code || 'N/A'} 
                                                        size="small" 
                                                        variant="outlined"
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDate(course.created_at)}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No recent course activity
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* System Status */}
            <Paper elevation={1} sx={{ p: 3, mt: 4, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>🛡️ System Status</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Platform Status:</strong> <Chip label="Operational" color="success" size="small" />
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Database:</strong> <Chip label="Connected" color="success" size="small" />
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Last Backup:</strong> <span style={{ color: '#666' }}>Today 02:00 AM</span>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>System Version:</strong> <span style={{ color: '#666' }}>v1.0.0</span>
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default SystemAdminDashboard; 