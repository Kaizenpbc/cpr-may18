import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  AccountBalance as RevenueIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  School as CourseIcon
} from '@mui/icons-material';
import { api } from '../../../services/api';

interface DashboardData {
  monthlyRevenue: number;
  outstandingInvoices: {
    count: number;
    amount: number;
  };
  paymentsThisMonth: {
    count: number;
    amount: number;
  };
  completedCoursesThisMonth: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color }) => (
  <Card elevation={3} sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box 
          sx={{ 
            backgroundColor: `${color}.light`, 
            borderRadius: '50%', 
            p: 1, 
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="h2" color="textSecondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" fontWeight="bold" color={`${color}.main`}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const AccountingDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/accounting/dashboard');
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No dashboard data available
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          📊 Financial Overview
        </Typography>
        <Chip 
          label={`Current Period: ${getCurrentMonth()}`} 
          color="primary" 
          variant="outlined" 
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Monthly Revenue"
            value={formatCurrency(dashboardData.monthlyRevenue)}
            subtitle={`Total revenue for ${getCurrentMonth()}`}
            icon={<RevenueIcon color="success" />}
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Outstanding Invoices"
            value={dashboardData.outstandingInvoices.count}
            subtitle={`Total amount: ${formatCurrency(dashboardData.outstandingInvoices.amount)}`}
            icon={<InvoiceIcon color="warning" />}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Payments This Month"
            value={dashboardData.paymentsThisMonth.count}
            subtitle={`Total received: ${formatCurrency(dashboardData.paymentsThisMonth.amount)}`}
            icon={<PaymentIcon color="primary" />}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Completed Courses"
            value={dashboardData.completedCoursesThisMonth}
            subtitle={`Courses completed this month`}
            icon={<CourseIcon color="info" />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Additional Summary Section */}
      <Card elevation={2} sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📈 Quick Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Revenue Status:</strong> {dashboardData.monthlyRevenue > 0 ? 'Revenue generated this month' : 'No revenue recorded this month'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Payment Status:</strong> {dashboardData.outstandingInvoices.count === 0 ? 'All invoices paid' : `${dashboardData.outstandingInvoices.count} invoices pending`}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Course Activity:</strong> {dashboardData.completedCoursesThisMonth} courses completed
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Collection Rate:</strong> {dashboardData.paymentsThisMonth.count > 0 ? 'Active payments received' : 'No payments this month'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AccountingDashboard; 