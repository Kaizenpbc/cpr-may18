import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';
import logger from '../../utils/logger';
import {
    Box,
    Container,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    CircularProgress,
    Alert,
    Snackbar,
    Button,
    AppBar,
    Toolbar
} from '@mui/material';
import {
    ReceiptLong as BillingIcon, 
    RequestQuote as ReceivablesIcon, // Example icon
    History as HistoryIcon, // Add History icon
    Assessment as ReportsIcon, // Add Reports icon
    Logout as LogoutIcon,
} from '@mui/icons-material';
import ReadyForBillingTable from '../tables/ReadyForBillingTable'; // Import the table
import AccountsReceivableTable from '../tables/AccountsReceivableTable'; // Import AR table
// Import ViewStudentsDialog if needed for the Review button
import ViewStudentsDialog from '../dialogs/ViewStudentsDialog'; 
import InvoiceDetailDialog from '../dialogs/InvoiceDetailDialog'; // Import Invoice Detail Dialog
import RecordPaymentDialog from '../dialogs/RecordPaymentDialog'; // Import Record Payment Dialog
import TransactionHistoryView from '../../components/views/TransactionHistoryView';
import ReportsView from '../../components/views/ReportsView';

const drawerWidth = 240;

const AccountingPortal = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [selectedView, setSelectedView] = useState('billingReady'); // Default view
    // State for Billing Ready view
    const [billingQueue, setBillingQueue] = useState([]);
    const [isLoadingBillingQueue, setIsLoadingBillingQueue] = useState(false);
    const [billingQueueError, setBillingQueueError] = useState('');
    // State for View Students dialog
    const [showViewStudentsDialog, setShowViewStudentsDialog] = useState(false);
    const [selectedCourseForView, setSelectedCourseForView] = useState(null);
    // State for success/error messages
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    // Add state for AR view
    const [invoices, setInvoices] = useState([]);
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
    const [invoicesError, setInvoicesError] = useState('');
    // Add state for Invoice Detail Dialog
    const [showInvoiceDetailDialog, setShowInvoiceDetailDialog] = useState(false);
    const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState(null);
    // Add state for Record Payment Dialog
    const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null); // Store the whole invoice object

    // Add showSnackbar helper
    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    // Handler to load billing queue
    const loadBillingQueue = useCallback(async () => {
        setIsLoadingBillingQueue(true);
        setBillingQueueError('');
        logger.debug('[loadBillingQueue] Fetching billing queue...');
        try {
            const data = await api.getBillingQueue();
            logger.debug('[loadBillingQueue] API Response:', data);
            setBillingQueue(data || []);
            logger.debug('[loadBillingQueue] State updated:', data || []);
        } catch (err) {
            const errorMsg = err.message || 'Failed to load queue.';
            logger.error('Error loading billing queue:', err);
            setBillingQueueError(errorMsg);
            logger.debug('[loadBillingQueue] Error state set:', errorMsg);
            setBillingQueue([]);
        } finally {
            setIsLoadingBillingQueue(false);
            logger.debug('[loadBillingQueue] Finished.');
        }
    }, []);

    // Handler to load invoices
    const loadInvoices = useCallback(async () => {
        setIsLoadingInvoices(true);
        setInvoicesError('');
        logger.debug('[loadInvoices] Fetching invoices...');
        try {
            const data = await api.getInvoices();
            logger.debug('[loadInvoices] API Response:', data);
            setInvoices(data || []);
            logger.debug('[loadInvoices] State updated:', data || []);
        } catch (err) {
            const errorMsg = err.message || 'Failed to load invoices.';
            logger.error('Error loading invoices:', err);
            setInvoicesError(errorMsg);
            logger.debug('[loadInvoices] Error state set:', errorMsg);
            setInvoices([]);
        } finally {
            setIsLoadingInvoices(false);
            logger.debug('[loadInvoices] Finished.');
        }
    }, []);

    // Load data based on selected view
    useEffect(() => {
        if (selectedView === 'billingReady') {
            loadBillingQueue();
        } else if (selectedView === 'receivables') {
            loadInvoices(); // Load invoices for AR view
        }
    }, [selectedView, loadBillingQueue, loadInvoices]);

    const handleLogout = () => {
        // Construct and show message
        const firstName = user?.first_name || 'Accounting User';
        const logoutMessage = `Goodbye ${firstName}, Have a Great Day!`;
        showSnackbar(logoutMessage, 'info'); 
        
        // Delay logout
        setTimeout(() => {
            logout();
            navigate('/');
        }, 1500); 
    };

    // --- Action Handlers ---
    const handleCreateInvoiceClick = async (course) => {
        logger.debug("Create Invoice clicked for course:", course);
        try {
            const response = await api.createInvoice(course.course_id);
            if (response.success) {
                setSnackbar({ open: true, message: response.message || 'Invoice created!', severity: 'success' });
                loadBillingQueue();
            } else {
                setSnackbar({ open: true, message: response.message || 'Failed to create invoice.', severity: 'error' });
            }
        } catch (err) {
            logger.error("Error creating invoice:", err);
            setSnackbar({ open: true, message: err.message || 'An error occurred.', severity: 'error' });
        }
    };

    const handleReviewCourseClick = (course_id) => {
        logger.debug("Review/View Details clicked for course:", course_id);
        setSelectedCourseForView(course_id);
        setShowViewStudentsDialog(true);
    };

    const handleViewStudentsDialogClose = () => {
        setShowViewStudentsDialog(false);
        setSelectedCourseForView(null);
    };

    // Open Record Payment Dialog
    const handleRecordPaymentClick = (invoice) => {
        logger.debug("Record Payment clicked for invoice:", invoice);
        setSelectedInvoiceForPayment(invoice);
        setShowRecordPaymentDialog(true);
    };

    // Close Record Payment Dialog
    const handleRecordPaymentDialogClose = () => {
        setShowRecordPaymentDialog(false);
        setSelectedInvoiceForPayment(null);
    };

    // Handler after payment is successfully recorded in the dialog
    const handlePaymentSuccessfullyRecorded = (message) => {
        setSnackbar({ open: true, message: message, severity: 'success' });
        // Refresh the invoice list to show updated status and potentially new totals
        loadInvoices(); 
    };

    // handleViewDetailsClick can likely reuse handleReviewCourseClick
    const handleViewDetailsClick = (invoice_id) => {
        logger.debug("View Details clicked for invoice:", invoice_id);
        setSelectedInvoiceForDetail(invoice_id);
        setShowInvoiceDetailDialog(true);
    };

    // Close handler for Invoice Detail Dialog
    const handleInvoiceDetailDialogClose = () => {
        setShowInvoiceDetailDialog(false);
        setSelectedInvoiceForDetail(null);
    };

    const handleEmailInvoiceClick = (invoice_id) => {
        logger.debug(`[AccountingPortal] handleEmailInvoiceClick called for Invoice ID: ${invoice_id}`);
        
        const selectedInvoice = invoices.find(inv => inv.invoice_id === invoice_id);
        if (!selectedInvoice) {
            logger.error(`[AccountingPortal] Could not find invoice data for ID ${invoice_id} in state.`);
            showSnackbar(`Error: Could not find invoice data for ID ${invoice_id}.`, 'error');
            return; 
        }

        logger.debug('[AccountingPortal] Found selected invoice data, setting state to open dialog:', selectedInvoice);
        setSelectedInvoiceForDetail(selectedInvoice);
        setShowInvoiceDetailDialog(true);
    };
    // --- End Action Handlers ---

    const renderSelectedView = () => {
        logger.debug(`[renderSelectedView] Rendering view: ${selectedView}`);
        switch (selectedView) {
            case 'billingReady':
                logger.debug(`[renderSelectedView: billingReady] State: isLoading=${isLoadingBillingQueue}, error=${billingQueueError}, queue=${JSON.stringify(billingQueue)}`);
                if (isLoadingBillingQueue) return <CircularProgress />;
                if (billingQueueError) return <Alert severity="error">{billingQueueError}</Alert>;
                return (
                    <ReadyForBillingTable 
                        courses={billingQueue} 
                        onCreateInvoiceClick={handleCreateInvoiceClick}
                        onReviewClick={handleReviewCourseClick}
                    />
                );
            case 'receivables':
                if (isLoadingInvoices) return <CircularProgress />;
                if (invoicesError) return <Alert severity="error">{invoicesError}</Alert>;
                return (
                    <AccountsReceivableTable 
                        invoices={invoices}
                        onRecordPaymentClick={handleRecordPaymentClick}
                        onViewDetailsClick={handleViewDetailsClick} 
                        onEmailInvoiceClick={handleEmailInvoiceClick} 
                    />
                );
            case 'history': 
                logger.debug('[renderSelectedView: history]');
                return <TransactionHistoryView />;
            case 'reports': 
                logger.debug('[renderSelectedView: reports]');
                return <ReportsView />;
            default:
                return <Typography>Select a view</Typography>;
        }
    };

    return (
        <Box sx={{ display: 'flex' }}>
            {/* --- AppBar --- */}
            <AppBar
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
                        Accounting Portal
                    </Typography>
                    <Typography variant="body1" noWrap sx={{ mr: 2 }}>
                         Welcome {user?.first_name || 'Accounting User'}!
                    </Typography>
                </Toolbar>
            </AppBar>

             {/* --- Drawer --- */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
            >
                 {/* Toolbar spacer */}
                 <Toolbar />
                 <Box sx={{ overflow: 'auto' }}>
                     <List>
                        {/* Billing Ready Item - Apply Styles */}
                        <ListItem 
                            component="div"
                            selected={selectedView === 'billingReady'}
                            onClick={() => setSelectedView('billingReady')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selectedView === 'billingReady' ? 'primary.light' : 'transparent',
                                color: selectedView === 'billingReady' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selectedView === 'billingReady' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selectedView === 'billingReady' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}><BillingIcon /></ListItemIcon>
                            <ListItemText primary="Ready for Billing" />
                        </ListItem>
                        {/* Accounts Receivable Item - Apply Styles */}
                        <ListItem 
                            component="div"
                            selected={selectedView === 'receivables'}
                            onClick={() => setSelectedView('receivables')}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selectedView === 'receivables' ? 'primary.light' : 'transparent',
                                color: selectedView === 'receivables' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selectedView === 'receivables' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selectedView === 'receivables' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}><ReceivablesIcon /></ListItemIcon>
                            <ListItemText primary="Accounts Receivable" />
                        </ListItem>
                        {/* Invoice History Item - NEW */}
                        <ListItem 
                            component="div"
                            selected={selectedView === 'history'}
                            onClick={() => setSelectedView('history')}
                             sx={{ // Apply styling 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selectedView === 'history' ? 'primary.light' : 'transparent',
                                color: selectedView === 'history' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selectedView === 'history' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selectedView === 'history' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}><HistoryIcon /></ListItemIcon>
                            <ListItemText primary="Invoice History" />
                        </ListItem>
                        {/* Reports Item - NEW */}
                        <ListItem 
                            component="div"
                            selected={selectedView === 'reports'}
                            onClick={() => setSelectedView('reports')}
                             sx={{ // Apply styling 
                                cursor: 'pointer', 
                                py: 1.5, 
                                backgroundColor: selectedView === 'reports' ? 'primary.light' : 'transparent',
                                color: selectedView === 'reports' ? 'primary.contrastText' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: selectedView === 'reports' ? 'primary.contrastText' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: selectedView === 'reports' ? 'primary.main' : 'action.hover',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}><ReportsIcon /></ListItemIcon>
                            <ListItemText primary="Reports" />
                        </ListItem>
                        <Divider sx={{ my: 1 }} />
                         {/* Logout Item - Apply Styles */}
                        <ListItem 
                            component="div"
                            onClick={handleLogout}
                            sx={{ 
                                cursor: 'pointer', 
                                py: 1.5, 
                                '&:hover': { backgroundColor: 'action.hover'} 
                            }}
                        >
                            <ListItemIcon><LogoutIcon /></ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItem>
                     </List>
                 </Box>
            </Drawer>
             {/* --- Main Content --- */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                 {/* Toolbar spacer */}
                <Toolbar />
                <Container maxWidth="lg">
                     {/* Remove original welcome */}
                    {renderSelectedView()}
                </Container>
            </Box>

            {/* View Students Dialog for Review button */}
            {showViewStudentsDialog && (
                <ViewStudentsDialog
                    open={showViewStudentsDialog}
                    onClose={handleViewStudentsDialogClose}
                    courseId={selectedCourseForView}
                />
            )}

            {/* Invoice Detail Dialog */}
            {showInvoiceDetailDialog && (
                <InvoiceDetailDialog 
                    open={showInvoiceDetailDialog}
                    onClose={handleInvoiceDetailDialogClose}
                    invoice={selectedInvoiceForDetail}
                    onEmailInvoice={handleEmailInvoiceClick}
                />
            )}

            {/* Record Payment Dialog */}
            {showRecordPaymentDialog && selectedInvoiceForPayment && (
                <RecordPaymentDialog
                    open={showRecordPaymentDialog}
                    onClose={handleRecordPaymentDialogClose}
                    invoice={selectedInvoiceForPayment}
                    onPaymentRecorded={handlePaymentSuccessfullyRecorded}
                />
            )}

            {/* Snackbar - Update anchorOrigin */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Set position
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AccountingPortal; 