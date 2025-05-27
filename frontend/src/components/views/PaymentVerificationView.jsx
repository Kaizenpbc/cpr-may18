import React, { useState } from 'react';
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
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Alert,
    IconButton,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const PaymentVerificationView = () => {
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
    const [verificationAction, setVerificationAction] = useState('approve'); // 'approve' or 'reject'
    const [verificationNotes, setVerificationNotes] = useState('');

    const queryClient = useQueryClient();

    // Fetch pending payment submissions
    const { data: paymentsData, isLoading } = useQuery({
        queryKey: ['pending-payment-verifications'],
        queryFn: async () => {
            const response = await api.get('/accounting/payment-verifications');
            return response.data.data;
        }
    });

    // Verify payment mutation
    const verifyPaymentMutation = useMutation({
        mutationFn: async ({ paymentId, action, notes }) => {
            const response = await api.post(`/accounting/payments/${paymentId}/verify`, {
                action,
                notes
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['pending-payment-verifications']);
            queryClient.invalidateQueries(['accounting-invoices']);
            setVerificationDialogOpen(false);
            setVerificationNotes('');
        }
    });

    const handleVerificationClick = (payment, action) => {
        setSelectedPayment(payment);
        setVerificationAction(action);
        setVerificationDialogOpen(true);
    };

    const handleVerificationSubmit = () => {
        if (!selectedPayment) return;

        verifyPaymentMutation.mutate({
            paymentId: selectedPayment.payment_id,
            action: verificationAction,
            notes: verificationNotes
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                Payment Verification
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
                Review and verify payment submissions from organizations.
            </Typography>

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Organization</TableCell>
                                <TableCell>Invoice #</TableCell>
                                <TableCell>Payment Amount</TableCell>
                                <TableCell>Payment Method</TableCell>
                                <TableCell>Reference #</TableCell>
                                <TableCell>Submitted Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!paymentsData?.payments?.length ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <Typography variant="body2" color="text.secondary">
                                            No pending payment verifications
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paymentsData.payments.map((payment) => (
                                    <TableRow key={payment.payment_id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {payment.organization_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {payment.invoice_number}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatCurrency(payment.amount)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {payment.payment_method?.replace('_', ' ').toUpperCase()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {payment.reference_number || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDate(payment.submitted_by_org_at)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={<PendingIcon />}
                                                label="PENDING VERIFICATION"
                                                color="warning"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="View Details">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => {
                                                            setSelectedPayment(payment);
                                                            // Could open a detail dialog here
                                                        }}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Approve Payment">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleVerificationClick(payment, 'approve')}
                                                        color="success"
                                                    >
                                                        <ApproveIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Reject Payment">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleVerificationClick(payment, 'reject')}
                                                        color="error"
                                                    >
                                                        <RejectIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Verification Dialog */}
            <Dialog 
                open={verificationDialogOpen} 
                onClose={() => setVerificationDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {verificationAction === 'approve' ? 'Approve Payment' : 'Reject Payment'}
                    {selectedPayment && (
                        <Typography variant="subtitle2" color="text.secondary">
                            {selectedPayment.organization_name} - {selectedPayment.invoice_number}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    {selectedPayment && (
                        <Box sx={{ pt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Payment Amount</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {formatCurrency(selectedPayment.amount)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                                    <Typography variant="body1">
                                        {selectedPayment.payment_method?.replace('_', ' ').toUpperCase()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Reference Number</Typography>
                                    <Typography variant="body1">
                                        {selectedPayment.reference_number || '-'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Payment Date</Typography>
                                    <Typography variant="body1">
                                        {formatDate(selectedPayment.payment_date)}
                                    </Typography>
                                </Grid>
                                {selectedPayment.notes && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="text.secondary">Organization Notes</Typography>
                                        <Typography variant="body1">
                                            {selectedPayment.notes}
                                        </Typography>
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Verification Notes"
                                        multiline
                                        rows={3}
                                        value={verificationNotes}
                                        onChange={(e) => setVerificationNotes(e.target.value)}
                                        placeholder={verificationAction === 'approve' 
                                            ? "Optional notes about the approval..." 
                                            : "Required: Reason for rejection..."
                                        }
                                        required={verificationAction === 'reject'}
                                    />
                                </Grid>
                            </Grid>

                            <Alert 
                                severity={verificationAction === 'approve' ? 'success' : 'warning'} 
                                sx={{ mt: 2 }}
                            >
                                {verificationAction === 'approve' 
                                    ? 'This payment will be marked as verified and the invoice status will be updated to paid.'
                                    : 'This payment will be rejected and the organization will be notified to resubmit.'
                                }
                            </Alert>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setVerificationDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleVerificationSubmit}
                        variant="contained"
                        color={verificationAction === 'approve' ? 'success' : 'error'}
                        disabled={verifyPaymentMutation.isLoading || (verificationAction === 'reject' && !verificationNotes.trim())}
                    >
                        {verifyPaymentMutation.isLoading 
                            ? 'Processing...' 
                            : (verificationAction === 'approve' ? 'Approve Payment' : 'Reject Payment')
                        }
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PaymentVerificationView; 