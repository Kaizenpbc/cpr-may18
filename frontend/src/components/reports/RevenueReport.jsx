import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Grid,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import * as api from '../../services/api.ts';
import { formatCurrency } from '../../utils/formatters';

// Function to get month name from YYYY-MM
const getMonthName = (monthStr) => {
    if (!monthStr || monthStr.length !== 7) return monthStr;
    const date = new Date(`${monthStr}-01T12:00:00`); // Use midday to avoid TZ issues
    return date.toLocaleString('default', { month: 'short' });
};

const RevenueReport = () => {
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Fetch data when selectedYear changes
    useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await api.getRevenueReport(selectedYear);
                const formattedData = data.map ? data.map(item => ({
                    ...item, 
                    shortMonth: getMonthName(item.month),
                    totalDue: item.balanceBroughtForward + item.totalInvoiced,
                    endingBalance: item.balanceBroughtForward + item.totalInvoiced - item.totalPaidInMonth
                })) : [];
                setReportData(formattedData);
            } catch (err) {
                setError(err.message || 'Could not load Revenue report.');
                setReportData([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReport();
    }, [selectedYear]); 

    const handleYearChange = (event) => {
        const year = parseInt(event.target.value, 10);
        if (!isNaN(year)) {
            setSelectedYear(year);
        }
    };

    // Generate year options (e.g., last 5 years + current)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Revenue Report</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="year-select-label">Year</InputLabel>
                    <Select
                        labelId="year-select-label"
                        value={selectedYear}
                        label="Year"
                        onChange={handleYearChange}
                    >
                        {yearOptions.map(year => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            
            {isLoading ? (
                <CircularProgress sx={{ m: 2 }} />
            ) : reportData.length === 0 ? (
                <Typography sx={{ m: 2 }}>No revenue data found for {selectedYear}.</Typography>
            ) : (
                <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom>Monthly Revenue Summary</Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Brought Forward</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Invoiced</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Due</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Paid (in Month)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ending Balance</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.map((row) => {
                                    const totalDue = row.balanceBroughtForward + row.totalInvoiced;
                                    return (
                                        <TableRow key={row.month} hover>
                                            <TableCell>{row.month}</TableCell>
                                            <TableCell align="right">{formatCurrency(row.balanceBroughtForward)}</TableCell>
                                            <TableCell align="right">{formatCurrency(row.totalInvoiced)}</TableCell>
                                            <TableCell align="right">{formatCurrency(totalDue)}</TableCell>
                                            <TableCell align="right">{formatCurrency(row.totalPaidInMonth)}</TableCell>
                                            <TableCell align="right">{formatCurrency(row.endingBalance)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                <TableRow sx={{ '& td, & th': { borderTop: '2px solid black', fontWeight: 'bold' } }}>
                                    <TableCell>Total ({selectedYear})</TableCell>
                                    <TableCell align="right"></TableCell>
                                    <TableCell align="right">{formatCurrency(reportData.reduce((sum, row) => sum + row.totalInvoiced, 0))}</TableCell>
                                    <TableCell align="right"></TableCell>
                                    <TableCell align="right">{formatCurrency(reportData.reduce((sum, row) => sum + row.totalPaidInMonth, 0))}</TableCell>
                                    <TableCell align="right"></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Paper>
    );
};

export default RevenueReport; 