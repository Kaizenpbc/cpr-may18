import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  School,
  People,
  EventNote,
  Schedule,
  CheckCircle,
  Cancel,
  AccessTime,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { getOrganizationCourseRequestAnalytics, getOrganizationStudentParticipationAnalytics } from '../../services/api.ts';
import { useToast } from '../../contexts/ToastContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const OrganizationAnalytics = () => {
  const [timeframe, setTimeframe] = useState('12');
  const [courseRequestData, setCourseRequestData] = useState(null);
  const [studentParticipationData, setStudentParticipationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { error: showError } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [courseRequests, studentParticipation] = await Promise.all([
        getOrganizationCourseRequestAnalytics(timeframe),
        getOrganizationStudentParticipationAnalytics(timeframe)
      ]);
      
      setCourseRequestData(courseRequests);
      setStudentParticipationData(studentParticipation);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch analytics data';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AnalyticsIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Training Analytics
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={timeframe}
            label="Time Period"
            onChange={handleTimeframeChange}
          >
            <MenuItem value="3">Last 3 Months</MenuItem>
            <MenuItem value="6">Last 6 Months</MenuItem>
            <MenuItem value="12">Last 12 Months</MenuItem>
            <MenuItem value="24">Last 24 Months</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      {studentParticipationData?.summaryStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventNote sx={{ color: 'primary.main', mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Courses
                    </Typography>
                    <Typography variant="h5">
                      {studentParticipationData.summaryStats.total_courses_requested}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Completed Courses
                    </Typography>
                    <Typography variant="h5">
                      {studentParticipationData.summaryStats.total_courses_completed}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <People sx={{ color: 'info.main', mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Students Trained
                    </Typography>
                    <Typography variant="h5">
                      {studentParticipationData.summaryStats.total_students_attended}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Attendance Rate
                    </Typography>
                    <Typography variant="h5">
                      {studentParticipationData.summaryStats.overall_attendance_rate}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Course Request Volume Trends */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Course Request Volume Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={courseRequestData?.volumeTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_label" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="request_count" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Course Type Preferences */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Course Type Preferences
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={courseRequestData?.courseTypePreferences || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ course_type, percentage }) => `${course_type}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="request_count"
                >
                  {(courseRequestData?.courseTypePreferences || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Seasonal Patterns */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Seasonal Training Patterns
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseRequestData?.seasonalPatterns || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="request_count" fill="#8884d8" name="Course Requests" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Lead Time Analysis */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lead Time Analysis
            </Typography>
            <List>
              {(courseRequestData?.leadTimeAnalysis || []).map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <AccessTime color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.lead_time_range}
                    secondary={`${item.request_count} requests (avg: ${item.avg_days} days)`}
                  />
                  <Chip 
                    label={`${item.request_count}`} 
                    color="primary" 
                    size="small" 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Attendance Rates by Course Type */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Rates by Course Type
            </Typography>
            <Box sx={{ mt: 2 }}>
              {(studentParticipationData?.attendanceRates || []).map((item, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{item.course_type}</Typography>
                    <Typography variant="body2" color="primary">
                      {item.attendance_rate}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(item.attendance_rate)} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {item.total_attended} of {item.total_registered} students attended
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* No-Show Patterns */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              No-Show Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={studentParticipationData?.noShowPatterns || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="no_show_rate" 
                  stroke="#ff7300" 
                  name="No-Show Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Class Size Optimization */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Class Size Optimization
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentParticipationData?.classSizeOptimization || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="requested_size" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="actual_registered" fill="#8884d8" name="Actual Registered" />
                <Bar dataKey="actual_attended" fill="#82ca9d" name="Actual Attended" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Completion Rates */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Course Completion Rates
            </Typography>
            <Grid container spacing={2}>
              {(studentParticipationData?.completionRates || []).map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {item.course_type}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Completion Rate:</Typography>
                        <Chip 
                          label={`${item.completion_rate}%`} 
                          color={item.completion_rate >= 80 ? 'success' : item.completion_rate >= 60 ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {item.completed_courses} of {item.total_courses} courses completed
                      </Typography>
                      {item.avg_student_completion_rate && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          Avg student completion: {parseFloat(item.avg_student_completion_rate).toFixed(1)}%
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrganizationAnalytics; 