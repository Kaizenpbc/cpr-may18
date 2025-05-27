import React, { useState, useEffect, useCallback } from 'react';
import logger from '../../utils/logger';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Grid,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    // Add other filter controls as needed (Select, DatePickers etc.)
} from '@mui/material';
import * as api from '../../services/api.ts'; // Adjust path
// Import the dedicated history table component
import InvoiceHistoryTable from '../tables/InvoiceHistoryTable';

const TransactionHistoryView = () => {
    const [allInvoices, setAllInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // TODO: Add state for filter values (date range, org, status, search term)
    const [searchTerm, setSearchTerm] = useState('');
    const [organizations, setOrganizations] = useState([]); // For dropdown
    const [selectedOrgId, setSelectedOrgId] = useState(''); // Filter value
    const [selectedMonth, setSelectedMonth] = useState(''); // YYYY-MM format
    const [selectedStatus, setSelectedStatus] = useState(''); // e.g., Pending, Paid, Overdue

    const fetchAllInvoices = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await api.getInvoices(); // Use the existing endpoint for now
            setAllInvoices(data || []);
            setFilteredInvoices(data || []); // Initialize filtered list
            logger.info('[TransactionHistory] Invoices loaded:', data);
        } catch (err) {
            logger.error('Error loading invoice history:', err);
            setError(err.message || 'Failed to load invoice history.');
            setAllInvoices([]);
            setFilteredInvoices([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch Organizations for filter dropdown
    const fetchOrganizations = useCallback(async () => {
        try {
            logger.debug('[fetchOrganizations] Fetching organizations...'); // Log start
            const orgData = await api.getOrganizations(); 
            logger.debug('[fetchOrganizations] API Response:', orgData); // Log raw response
            // Extract data array from API response
            const organizations = orgData?.data || orgData || [];
            setOrganizations(Array.isArray(organizations) ? organizations : []);
            logger.debug('[fetchOrganizations] State updated with:', organizations); // Log what was set
        } catch (err) {
            logger.error("Error fetching organizations for filter:", err);
            // Handle error - maybe show a snackbar or log it
            setOrganizations([]); // Set empty array on error
        }
    }, []);

    useEffect(() => {
        fetchAllInvoices();
        fetchOrganizations(); // Fetch orgs on mount
    }, [fetchAllInvoices, fetchOrganizations]);

    // Filtering Logic
    useEffect(() => {
        let result = [...allInvoices];
        
        // Apply search term filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(inv => 
                inv.invoice_number?.toLowerCase().includes(lowerSearch) ||
                inv.course_type_name?.toLowerCase().includes(lowerSearch) ||
                inv.organization_name?.toLowerCase().includes(lowerSearch)
            );
        }

        // Apply Organization filter
        if (selectedOrgId) {
            result = result.filter(inv => inv.organization_id === parseInt(selectedOrgId));
        }

        // Apply Month filter (Invoice Date)
        if (selectedMonth) { // selectedMonth is YYYY-MM
            try {
                // Get first day of selected month
                const start = new Date(selectedMonth + '-01T00:00:00'); 
                // Get first day of *next* month
                const nextMonth = new Date(start);
                nextMonth.setMonth(start.getMonth() + 1);
                
                result = result.filter(inv => {
                    if (!inv.invoice_date) return false;
                    const invoiceDate = new Date(inv.invoice_date);
                    // Check if invoiceDate is >= start and < nextMonth
                    return invoiceDate >= start && invoiceDate < nextMonth;
                });
            } catch (e) { logger.error("Error parsing month filter date"); }
        }

        // Apply Status filter
        if (selectedStatus) {
            // Case-insensitive comparison is safer
            result = result.filter(inv => inv.payment_status?.toLowerCase() === selectedStatus.toLowerCase());
        }

        logger.debug('[TransactionHistory] Applying filters. Result length:', result.length);
        setFilteredInvoices(result);
        // Update dependencies
    }, [searchTerm, selectedOrgId, selectedMonth, selectedStatus, allInvoices]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedOrgId('');
        setSelectedMonth(''); // Clear month
        setSelectedStatus(''); // Clear status
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>Invoice / Transaction History</Typography>
            
            {/* Filter Section - Placeholder */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Filters</Typography>
                <Grid container spacing={2} alignItems="flex-end">
                    {/* Search Term */}
                    <Grid item xs={12} sm={6} md={3}>
                         <TextField 
                            fullWidth label="Search Invoice/Course/Org #" variant="outlined" size="small"
                            value={searchTerm} onChange={handleSearchChange}
                         />
                    </Grid>
                    {/* Organization Select */}
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="org-filter-label">Organization</InputLabel>
                            <Select
                                labelId="org-filter-label"
                                value={selectedOrgId}
                                label="Organization"
                                onChange={(e) => setSelectedOrgId(e.target.value)}
                            >
                                <MenuItem value=""><em>All Organizations</em></MenuItem>
                                {Array.isArray(organizations) && organizations.sort((a, b) => a.name.localeCompare(b.name)).map((org) => (
                                    <MenuItem key={org.id} value={org.id}>
                                        {org.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                     {/* Month Select */}
                     <Grid item xs={6} sm={4} md={2}>
                         <TextField 
                            fullWidth 
                            label="Month (Invoice Date)" 
                            type="month"
                            size="small" 
                            InputLabelProps={{ shrink: true }}
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                         />
                     </Grid>
                    {/* Status Select */}
                    <Grid item xs={6} sm={4} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="status-filter-label">Status</InputLabel>
                            <Select
                                labelId="status-filter-label"
                                value={selectedStatus}
                                label="Status"
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <MenuItem value=""><em>All Statuses</em></MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Paid">Paid</MenuItem>
                                <MenuItem value="Overdue">Overdue</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item>
                        <Button variant="outlined" onClick={handleClearFilters}>Clear Filters</Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Table Section */}
            {isLoading ? (
                <CircularProgress />
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <> 
                    {/* Render the actual history table component here */}
                    <InvoiceHistoryTable invoices={filteredInvoices} /> 
                    {/* Remove or adjust count display as needed */}
                    {/* <Typography>Displaying {filteredInvoices.length} of {allInvoices.length} total invoices.</Typography> */}
                </>
            )}
        </Box>
    );
};

export default TransactionHistoryView; 