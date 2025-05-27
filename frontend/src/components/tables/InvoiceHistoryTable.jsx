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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PreviewIcon from '@mui/icons-material/Preview';

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

    const handlePreview = (invoiceId) => {
        const previewUrl = `http://localhost:3001/api/v1/accounting/invoices/${invoiceId}/preview`;
        window.open(previewUrl, '_blank', 'width=800,height=1000,scrollbars=yes');
    };

    const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
        try {
            console.log(`[PDF Download] Starting download for invoice ${invoiceId}`);
            
            // Get the auth token from localStorage
            const token = localStorage.getItem('accessToken');
            console.log(`[PDF Download] Token available: ${token ? 'Yes' : 'No'}`);
            
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            console.log(`[PDF Download] Fetching PDF from: http://localhost:3001/api/v1/accounting/invoices/${invoiceId}/pdf`);
            
            const response = await fetch(`http://localhost:3001/api/v1/accounting/invoices/${invoiceId}/pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            console.log(`[PDF Download] Response status: ${response.status}`);
            console.log(`[PDF Download] Response headers:`, Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[PDF Download] Error response:`, errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            // Check if the response is actually a PDF
            const contentType = response.headers.get('content-type');
            console.log(`[PDF Download] Content-Type: ${contentType}`);
            
            if (!contentType || !contentType.includes('application/pdf')) {
                console.error('Response is not a PDF:', contentType);
                const text = await response.text();
                console.error('Response body:', text);
                throw new Error('Server did not return a PDF file');
            }

            // Get the PDF blob
            const blob = await response.blob();
            console.log(`[PDF Download] Blob created, size: ${blob.size} bytes, type: ${blob.type}`);
            
            // Verify the blob size
            if (blob.size === 0) {
                throw new Error('PDF file is empty');
            }
            
            // Try different download approaches
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                // For IE/Edge
                console.log('[PDF Download] Using IE/Edge download method');
                window.navigator.msSaveOrOpenBlob(blob, `Invoice-${invoiceNumber}.pdf`);
            } else {
                // For modern browsers - try multiple methods
                console.log('[PDF Download] Using modern browser download method');
                const url = window.URL.createObjectURL(blob);
                console.log(`[PDF Download] Object URL created: ${url}`);
                
                // Method 1: Try programmatic download
                try {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Invoice-${invoiceNumber}.pdf`;
                    link.style.display = 'none';
                    
                    // Add to DOM, click, and remove
                    document.body.appendChild(link);
                    console.log('[PDF Download] Link added to DOM, triggering click');
                    
                    // Try to trigger download
                    link.click();
                    
                    // Also try dispatching a click event as fallback
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    link.dispatchEvent(clickEvent);
                    
                    console.log('[PDF Download] Click events dispatched');
                    
                    // Clean up after a short delay
                    setTimeout(() => {
                        if (document.body.contains(link)) {
                            document.body.removeChild(link);
                        }
                        window.URL.revokeObjectURL(url);
                        console.log('[PDF Download] Cleanup completed');
                    }, 1000);
                    
                } catch (downloadError) {
                    console.error('[PDF Download] Programmatic download failed:', downloadError);
                    
                    // Method 2: Fallback - open in new tab
                    console.log('[PDF Download] Trying fallback: opening in new tab');
                    const newWindow = window.open(url, '_blank');
                    if (newWindow) {
                        console.log('[PDF Download] PDF opened in new tab');
                        // Clean up after user has time to save
                        setTimeout(() => {
                            window.URL.revokeObjectURL(url);
                        }, 10000);
                    } else {
                        console.error('[PDF Download] Failed to open new tab - popup blocked?');
                        alert('Download blocked by browser. Please check your popup blocker settings or try right-clicking the download button and selecting "Save link as..."');
                    }
                }
            }
            
            console.log('[PDF Download] Download initiated successfully');
            
        } catch (error) {
            console.error('[PDF Download] Error:', error);
            alert(`Failed to download PDF: ${error.message}`);
        }
    };

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
                        <TableCell sx={{ fontWeight: 'bold' }}>Course Type</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Payment Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Aging</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Email Sent</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {invoices.map((invoice, index) => (
                        <TableRow 
                            key={invoice.invoice_id || index} 
                            hover 
                            sx={{ backgroundColor: index % 2 !== 0 ? '#f9f9f9' : 'inherit'}}
                        >
                            <TableCell>
                                <strong>{invoice.invoice_number}</strong>
                            </TableCell> 
                            <TableCell>{formatDate(invoice.invoice_date)}</TableCell> 
                            <TableCell>{formatDate(invoice.due_date)}</TableCell> 
                            <TableCell>
                                <MuiLink component={RouterLink} to={`/accounting/organizations/${invoice.organization_id}`} underline="hover">
                                    {invoice.organization_name || '-'}
                                </MuiLink>
                            </TableCell>
                            <TableCell>{invoice.course_type_name || '-'}</TableCell>
                            <TableCell align="right">
                                <strong>{formatCurrency(invoice.amount)}</strong>
                            </TableCell>
                            <TableCell align="center">
                                <Chip 
                                    label={invoice.payment_status || 'Unknown'} 
                                    color={getStatusChipColor(invoice.payment_status)} 
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>{invoice.aging_bucket || '-'}</TableCell> 
                            <TableCell>{invoice.paid_date ? formatDate(invoice.paid_date) : '-'}</TableCell>
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    <Tooltip title="Preview Invoice">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handlePreview(invoice.invoice_id)}
                                            color="primary"
                                        >
                                            <PreviewIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Download PDF">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleDownloadPDF(invoice.invoice_id, invoice.invoice_number)}
                                            color="secondary"
                                        >
                                            <PictureAsPdfIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Direct Download Link">
                                        <IconButton 
                                            size="small" 
                                            component="a"
                                            href={`http://localhost:3001/api/v1/accounting/invoices/${invoice.invoice_id}/pdf`}
                                            target="_blank"
                                            download={`Invoice-${invoice.invoice_number}.pdf`}
                                            color="info"
                                            sx={{ fontSize: '12px' }}
                                        >
                                            📥
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default InvoiceHistoryTable; 