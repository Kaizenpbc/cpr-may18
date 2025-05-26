import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Avatar,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { api } from '../../../services/api';

interface InstructorStats {
  instructor_id: number;
  instructor_name: string;
  email: string;
  courses_completed: number;
  courses_scheduled: number;
  total_courses: number;
  completion_rate: number;
  last_course_date: string;
  avg_students_per_course: number;
}

interface DashboardSummary {
  total_instructors: number;
  total_courses_this_month: number;
  total_completed_this_month: number;
  avg_courses_per_instructor: number;
}

const InstructorDashboard: React.FC = () => {
  const [instructorStats, setInstructorStats] = useState<InstructorStats[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsResponse, summaryResponse] = await Promise.all([
        api.get(`/api/v1/admin/instructor-stats?month=${selectedMonth}`),
        api.get(`/api/v1/admin/dashboard-summary?month=${selectedMonth}`)
      ]);
      
      // Ensure instructorStats is always an array
      const statsData = statsResponse.data.data;
      setInstructorStats(Array.isArray(statsData) ? statsData : []);
      setDashboardSummary(summaryResponse.data.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (completionRate: number) => {
    if (completionRate >= 80) return 'success';
    if (completionRate >= 60) return 'warning';
    return 'error';
  };

  const getWorkloadStatus = (totalCourses: number, avgCourses: number) => {
    const ratio = totalCourses / avgCourses;
    if (ratio > 1.2) return { status: 'High', color: 'error' };
    if (ratio > 0.8) return { status: 'Normal', color: 'success' };
    return { status: 'Low', color: 'warning' };
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          Instructor Fairness Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Month</InputLabel>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              label="Month"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthStr = date.toISOString().slice(0, 7);
                return (
                  <MenuItem key={monthStr} value={monthStr}>
                    {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchDashboardData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      {dashboardSummary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{dashboardSummary.total_instructors}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Active Instructors
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <ScheduleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{dashboardSummary.total_courses_this_month}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Courses
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CompletedIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{dashboardSummary.total_completed_this_month}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Completed Courses
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <CalendarIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{Number(dashboardSummary.avg_courses_per_instructor).toFixed(1)}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Avg per Instructor
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Instructor Statistics Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon />
            Instructor Performance & Fairness Metrics
          </Typography>
          
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Instructor</strong></TableCell>
                  <TableCell align="center"><strong>Completed</strong></TableCell>
                  <TableCell align="center"><strong>Scheduled</strong></TableCell>
                  <TableCell align="center"><strong>Total Courses</strong></TableCell>
                  <TableCell align="center"><strong>Completion Rate</strong></TableCell>
                  <TableCell align="center"><strong>Workload Status</strong></TableCell>
                  <TableCell align="center"><strong>Avg Students</strong></TableCell>
                  <TableCell align="center"><strong>Last Course</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instructorStats.map((instructor) => {
                  const workloadStatus = getWorkloadStatus(
                    Number(instructor.total_courses), 
                    Number(dashboardSummary?.avg_courses_per_instructor || 1)
                  );
                  
                  return (
                    <TableRow key={instructor.instructor_id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {instructor.instructor_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {instructor.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={instructor.courses_completed}
                          color="success"
                          size="small"
                          icon={<CompletedIcon />}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={instructor.courses_scheduled}
                          color="info"
                          size="small"
                          icon={<ScheduleIcon />}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="bold">
                          {instructor.total_courses}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Number(instructor.completion_rate)}
                            color={getStatusColor(Number(instructor.completion_rate))}
                            sx={{ width: 60, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2">
                            {Number(instructor.completion_rate).toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={workloadStatus.status}
                          color={workloadStatus.color as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {Number(instructor.avg_students_per_course).toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {instructor.last_course_date ? 
                            new Date(instructor.last_course_date).toLocaleDateString() : 
                            'N/A'
                          }
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {instructorStats.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                        No instructor data available for the selected month
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="textSecondary">
              <strong>Workload Status:</strong> High (&gt;20% above avg) | Normal (±20% of avg) | Low (&lt;20% below avg)
              <br />
              <strong>Completion Rate:</strong> Percentage of scheduled courses that have been completed
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InstructorDashboard; 