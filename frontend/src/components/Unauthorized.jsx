import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography, Button, Box } from '@mui/material';
import logger from '../utils/logger';

const Unauthorized = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoBack = () => {
        logger.info('User navigating back from unauthorized page');
        navigate(-1);
    };

    return (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Unauthorized Access
            </Typography>
            <Typography variant="body1" paragraph>
                You don&apos;t have permission to access this page.
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={handleGoBack}
            >
                Go Back
            </Button>
        </Box>
    );
};

export default Unauthorized; 