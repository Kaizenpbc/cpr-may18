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
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { api } from '../../../services/api';

interface CoursePricing {
  id: number;
  organization_id: number;
  course_type_id: number;
  price_per_student: number;
  effective_date: string;
  is_active: boolean;
  organization_name: string;
  course_type_name: string;
  course_description: string;
}

const CoursePricingManagement: React.FC = () => {
  const [coursePricing, setCoursePricing] = useState<CoursePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

  const fetchCoursePricing = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/accounting/course-pricing');
      setCoursePricing(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching course pricing:', err);
      setError('Failed to fetch course pricing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursePricing();
  }, []);

  const handleEditStart = (pricing: CoursePricing) => {
    setEditingId(pricing.id);
    setEditPrice(pricing.price_per_student.toString());
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditPrice('');
  };

  const handleEditSave = async (id: number) => {
    try {
      const price = parseFloat(editPrice);
      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid price greater than 0');
        return;
      }

      await api.put(`/api/v1/accounting/course-pricing/${id}`, {
        price_per_student: price
      });

      setSuccess('Course pricing updated successfully!');
      setEditingId(null);
      setEditPrice('');
      fetchCoursePricing(); // Refresh the data
    } catch (err) {
      console.error('Error updating course pricing:', err);
      setError('Failed to update course pricing');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const groupedPricing = coursePricing.reduce((acc, pricing) => {
    if (!acc[pricing.organization_name]) {
      acc[pricing.organization_name] = [];
    }
    acc[pricing.organization_name].push(pricing);
    return acc;
  }, {} as Record<string, CoursePricing[]>);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          💰 Course Pricing Setup
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Set pricing per student for different course types across organizations
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {Object.keys(groupedPricing).length === 0 ? (
        <Alert severity="info">
          No course pricing data available. Default pricing has been set for all organizations.
        </Alert>
      ) : (
        Object.entries(groupedPricing).map(([organizationName, pricingList]) => (
          <Paper key={organizationName} elevation={2} sx={{ mb: 4 }}>
            <Box sx={{ p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h6">
                🏢 {organizationName}
              </Typography>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Course Type</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Price Per Student</strong></TableCell>
                    <TableCell><strong>Effective Date</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pricingList.map((pricing) => (
                    <TableRow key={pricing.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {pricing.course_type_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {pricing.course_description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {editingId === pricing.id ? (
                          <TextField
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            type="number"
                            size="small"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MoneyIcon fontSize="small" />
                                </InputAdornment>
                              ),
                            }}
                            inputProps={{
                              step: "0.01",
                              min: "0"
                            }}
                            sx={{ minWidth: 120 }}
                          />
                        ) : (
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            {formatCurrency(pricing.price_per_student)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(pricing.effective_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={pricing.is_active ? 'Active' : 'Inactive'} 
                          color={pricing.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {editingId === pricing.id ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              onClick={() => handleEditSave(pricing.id)}
                              color="success"
                              size="small"
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton
                              onClick={handleEditCancel}
                              color="error"
                              size="small"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <IconButton
                            onClick={() => handleEditStart(pricing)}
                            color="primary"
                            size="small"
                            disabled={!pricing.is_active}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))
      )}

      {/* Instructions */}
      <Paper elevation={1} sx={{ p: 3, mt: 4, backgroundColor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          📋 Instructions
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • Click the edit icon to modify the price per student for any course type
          • Pricing is organization-specific, allowing different rates for different clients
          • All prices are in USD and represent the cost per student for that course type
          • Changes take effect immediately and will be used for future course billing
        </Typography>
        <Typography variant="body2" color="primary.main" fontWeight="medium">
          💡 Tip: Consider factors like course complexity, duration, and organizational agreements when setting prices
        </Typography>
      </Paper>
    </Box>
  );
};

export default CoursePricingManagement; 