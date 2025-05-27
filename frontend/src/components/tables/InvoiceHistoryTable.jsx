import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Typography,
    Tooltip,
    Chip,
    IconButton,
    Link as MuiLink
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';

// Helper functions (copied from AccountsReceivableTable - consider moving to utils)
const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString(); 
    } catch (e) {
        return 'Invalid Date';
    }
};
const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
};
const getStatusChipColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'paid': return 'success';
        case 'pending': return 'warning';
        case 'overdue': return 'error';
        default: return 'default';
    }
};

const InvoiceHistoryTable = ({ invoices = [] }) => {

    // Removed state/handlers for expansion from AR table

    if (!invoices || invoices.length === 0) {
        return <Typography sx={{ mt: 2, fontStyle: 'italic' }}>No matching invoices found.</Typography>;
    }

    // Optional: Add Sorting if needed

    return (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table stickyHeader size="small" aria-label="invoice history table">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Invoice Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Organization</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Course #</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Payment Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Aging</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Email Sent</TableCell>
                        {/* Removed Actions column, can be re-added if needed */}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {invoices.map((invoice, index) => (
                        <TableRow 
                            key={invoice.invoice_id || index} 
                            hover 
                            sx={{ backgroundColor: index % 2 !== 0 ? '#f9f9f9' : 'inherit'}}
                        >
                            <TableCell>{invoice.invoice_number}</TableCell> 
                            <TableCell>{formatDate(invoice.invoice_date)}</TableCell> 
                            <TableCell>{formatDate(invoice.due_date)}</TableCell> 
                            <TableCell>
                                {/* Optionally link to org detail page */}
                                <MuiLink component={RouterLink} to={`/accounting/organizations/${invoice.organization_id}`} underline="hover">
                                    {invoice.organization_name || '-'}
                                </MuiLink>
                            </TableCell>
                            <TableCell>{invoice.course_type_name || '-'}</TableCell>
                            <TableCell align="right">{formatCurrency(invoice.amount)}</TableCell>
                            <TableCell align="center">
                                <Chip 
                                    label={invoice.payment_status || 'Unknown'} 
                                    color={getStatusChipColor(invoice.payment_status)} 
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>{invoice.aging_bucket || '-'}</TableCell> 
                            <TableCell>{invoice.paid_date ? formatDate(invoice.paid_date) : '-'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default InvoiceHistoryTable; 