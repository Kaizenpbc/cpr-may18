import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip
} from '@mui/material';
import {
    Preview as PreviewIcon,
    PictureAsPdf as PdfIcon,
    Receipt as InvoiceIcon
} from '@mui/icons-material';

const PDFDemo = () => {
    const handlePreview = () => {
        const previewUrl = 'http://localhost:3001/api/v1/accounting/invoices/1/preview';
        window.open(previewUrl, '_blank', 'width=800,height=1000,scrollbars=yes');
    };

    const handleDownloadPDF = async () => {
        try {
            // Get the auth token from localStorage
            const token = localStorage.getItem('accessToken');
            
            const response = await fetch('http://localhost:3001/api/v1/accounting/invoices/1/pdf', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Check if the response is actually a PDF
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/pdf')) {
                console.error('Response is not a PDF:', contentType);
                const text = await response.text();
                console.error('Response body:', text);
                throw new Error('Server did not return a PDF file');
            }

            // Get the PDF blob
            const blob = await response.blob();
            
            // Verify the blob size
            if (blob.size === 0) {
                throw new Error('PDF file is empty');
            }
            
            console.log('PDF blob size:', blob.size, 'bytes');
            
            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Invoice-INV-2025-393804.pdf';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // Clean up after a short delay
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert(`Failed to download PDF: ${error.message}`);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom align="center" color="primary">
                🎉 PDF Invoice Generation Demo
            </Typography>
            
            <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
                Professional invoice generation with preview and PDF download functionality
            </Typography>

            <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} md={8}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <InvoiceIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    Sample Invoice: INV-2025-393804
                                </Typography>
                                <Chip 
                                    label="Pending" 
                                    color="warning" 
                                    size="small" 
                                    sx={{ ml: 2 }}
                                />
                            </Box>
                            
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Organization:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        CDI
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Course Type:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        Advanced CPR
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Amount:
                                    </Typography>
                                    <Typography variant="h6" color="primary" fontWeight="bold">
                                        $50.00
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Students:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        1 student
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                                ✨ Features Included:
                            </Typography>
                            <Box component="ul" sx={{ pl: 2 }}>
                                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                                    Professional company branding and layout
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                                    Complete invoice details with HST calculation
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                                    Course information and student count
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                                    Multiple payment method instructions
                                </Typography>
                                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                                    Professional terms and conditions
                                </Typography>
                                <Typography component="li" variant="body2">
                                    Print-ready PDF format for client delivery
                                </Typography>
                            </Box>
                        </CardContent>
                        
                        <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                            <Button
                                variant="outlined"
                                startIcon={<PreviewIcon />}
                                onClick={handlePreview}
                                size="large"
                                sx={{ mr: 1 }}
                            >
                                Preview Invoice
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<PdfIcon />}
                                onClick={handleDownloadPDF}
                                size="large"
                                color="secondary"
                                sx={{ mr: 1 }}
                            >
                                Download PDF
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    const token = localStorage.getItem('accessToken');
                                    console.log('Current token:', token);
                                    console.log('Token length:', token ? token.length : 0);
                                    alert(`Token available: ${token ? 'Yes' : 'No'}\nLength: ${token ? token.length : 0}`);
                                }}
                                size="small"
                                color="info"
                            >
                                Check Token
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ p: 3, mt: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="h6" gutterBottom align="center">
                    🚀 Implementation Complete!
                </Typography>
                <Typography variant="body1" align="center">
                    The PDF generation system is now fully integrated into the Accounting Portal.
                    <br />
                    Navigate to <strong>Invoice History</strong> to see the Preview and Download buttons on all invoices.
                </Typography>
            </Paper>
        </Box>
    );
};

export default PDFDemo; 