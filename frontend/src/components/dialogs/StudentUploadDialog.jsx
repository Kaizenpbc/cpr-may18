import React, { useState, useRef } from 'react';
import Papa from 'papaparse'; // Import PapaParse
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
    List, ListItem, ListItemText, // For preview
    CircularProgress,
    LinearProgress
} from '@mui/material';
import * as api from '../../services/api';
import logger from '../../utils/logger';

const StudentUploadDialog = ({ open, onClose, courseId, onUploadComplete }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [parsedStudents, setParsedStudents] = useState([]);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null); // Ref to access file input

    // Reset state when dialog closes or file changes
    const resetState = () => {
        setSelectedFile(null);
        setParsedStudents([]);
        setParseError('');
        setUploadError('');
        setIsParsing(false);
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear the file input
        }
    };

    const handleClose = () => {
        resetState();
        onClose(); // Call the parent onClose handler
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            logger.info('File selected for upload:', selectedFile.name);
            setSelectedFile(selectedFile);
            // Automatically parse the file when selected
            parseFile(selectedFile);
        }
    };

    const parseFile = (file) => {
        setIsParsing(true);
        setParseError('');
        logger.debug('[parseFile] Starting parse...');
        Papa.parse(file, {
            header: true, 
            skipEmptyLines: true,
            complete: (results) => {
                logger.debug('[parseFile] Papa.parse complete. Results:', results);
                logger.debug('[parseFile] Detected headers (results.meta.fields):', results.meta.fields);

                // Trim headers before checking
                const detectedHeaders = results.meta.fields ? results.meta.fields.map(h => h.trim()) : [];
                logger.debug('[parseFile] Trimmed headers:', detectedHeaders);

                const hasRequiredHeaders = detectedHeaders.includes('first_name') && detectedHeaders.includes('last_name');
                logger.debug('[parseFile] Has required headers (first_name, last_name)?', hasRequiredHeaders);
                if (!hasRequiredHeaders) {
                     const errorMsg = 'CSV must contain at least \'first_name\' and \'last_name\' columns (case-sensitive).';
                     logger.warn('[parseFile] Setting parseError:', errorMsg);
                     setParseError(errorMsg);
                     setParsedStudents([]);
                // Log data length check
                } else if (results.data.length === 0) {
                     const errorMsg = 'CSV file has headers but no data rows.';
                     logger.warn('[parseFile] Setting parseError:', errorMsg);
                     setParseError(errorMsg);
                     setParsedStudents([]);
                } else {
                    logger.debug('[parseFile] Formatting student data...');
                    const formattedStudents = results.data.map(row => {
                        logger.debug('[parseFile] Processing row:', row);
                        return {
                            // Use the exact header keys detected by PapaParse, including whitespace
                            firstName: row['first_name']?.trim(), // Use key with space
                            lastName: row['last_name']?.trim(),  // This one was likely okay
                            email: row['Email']?.trim() || null     // This one was likely okay
                        }
                    }).filter(student => student.firstName && student.lastName);
                    
                    logger.debug('[parseFile] Formatted/Filtered Students:', formattedStudents);
                    if (formattedStudents.length === 0) {
                         const errorMsg = 'No valid student names found after processing rows.';
                         logger.warn('[parseFile] Setting parseError:', errorMsg);
                         setParseError(errorMsg);
                    }
                    logger.debug('[parseFile] Calling setParsedStudents with:', formattedStudents);
                    setParsedStudents(formattedStudents);
                }
                logger.debug('[parseFile] Setting isParsing to false.');
                setIsParsing(false);
            },
            error: (error) => {
                logger.error('[parseFile] Papa.parse error callback:', error);
                const errorMsg = `Error parsing CSV: ${error.message}`;
                setParseError(errorMsg);
                setIsParsing(false);
                setParsedStudents([]);
            }
        });
    };

    const handleUpload = async () => {
        logger.debug('[handleUpload] Function called.'); // Log entry
        if (!parsedStudents || parsedStudents.length === 0 || !courseId) {
            setUploadError('No valid student data to upload or course ID missing.');
            logger.warn('[handleUpload] Exiting: No valid data or courseId.'); // Log exit reason
            return;
        }
        setIsUploading(true);
        setUploadError('');
        try {
            logger.info('Starting file upload');
            const response = await api.organizationApi.uploadStudents(courseId, parsedStudents);
            if (response.success) {
                onUploadComplete(response.message); // Notify parent of success
                handleClose(); // Close dialog on success
            } else {
                setUploadError(response.message || 'Upload failed.');
            }
            logger.info('File uploaded successfully');
        } catch (err) {
            setUploadError(err.message || 'An error occurred during upload.');
            logger.error('Error uploading file:', err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            {isUploading && <LinearProgress sx={{ width: '100%', position: 'absolute', top: 0, left: 0 }} />}
            <DialogTitle>Upload Student List (CSV)</DialogTitle>
            <DialogContent dividers>
                {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
                {parseError && <Alert severity="warning" sx={{ mb: 2 }}>{parseError}</Alert>}
                
                <Typography variant="body2" gutterBottom>
                    Select a CSV file with columns: first_name, last_name, email (optional).
                    Ensure the first row contains these exact header names.
                </Typography>

                <Button 
                    variant="outlined" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing || isUploading}
                    sx={{ my: 2 }}
                >
                    {selectedFile ? `Selected: ${selectedFile.name}` : 'Choose CSV File'}
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".csv"
                        onChange={handleFileChange} 
                        style={{ // MUI recommended way to hide
                            clip: 'rect(0 0 0 0)',
                            clipPath: 'inset(50%)',
                            height: 1,
                            overflow: 'hidden',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            whiteSpace: 'nowrap',
                            width: 1,
                        }}
                    />
                </Button>

                {isParsing && <CircularProgress size={24} />} 

                {parsedStudents.length > 0 && (
                    <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                        <Typography variant="subtitle2">Preview ({parsedStudents.length} students found):</Typography>
                        <List dense disablePadding>
                            {parsedStudents.slice(0, 10).map((student, index) => ( // Show preview of first 10
                                <ListItem disableGutters key={index}>
                                    <ListItemText primary={`${student.firstName} ${student.lastName}`} secondary={student.email || 'No email'} />
                                </ListItem>
                            ))}
                            {parsedStudents.length > 10 && (
                                 <ListItem disableGutters>
                                    <ListItemText secondary={`...and ${parsedStudents.length - 10} more`} />
                                </ListItem>
                            )}
                        </List>
                    </Box>
                )}

            </DialogContent>
            <DialogActions>
                {/* Log button disabled state */}
                {logger.debug('[DialogActions Render] Button Disabled Check:', {
                    isUploading,
                    isParsing,
                    parsedStudentsLength: parsedStudents.length,
                    hasParseError: !!parseError,
                    isDisabled: isUploading || isParsing || parsedStudents.length === 0 || !!parseError
                })}
                <Button onClick={handleClose} disabled={isUploading}>Cancel</Button>
                <Button 
                    onClick={handleUpload} 
                    variant="contained" 
                    disabled={isUploading || isParsing || parsedStudents.length === 0 || !!parseError}
                >
                    {isUploading ? <CircularProgress size={24} /> : 'Upload List'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StudentUploadDialog; 