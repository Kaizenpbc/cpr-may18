import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Avatar
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    AccountCircle as AccountCircleIcon
} from '@mui/icons-material';

const InstructorPortalHeader = ({ user, onLogout }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [notificationsAnchorEl, setNotificationsAnchorEl] = React.useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleNotificationsMenu = (event) => {
        setNotificationsAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationsClose = () => {
        setNotificationsAnchorEl(null);
    };

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    Instructor Portal
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        size="large"
                        aria-label="show notifications"
                        color="inherit"
                        onClick={handleNotificationsMenu}
                    >
                        <NotificationsIcon />
                    </IconButton>
                    <Menu
                        anchorEl={notificationsAnchorEl}
                        open={Boolean(notificationsAnchorEl)}
                        onClose={handleNotificationsClose}
                    >
                        <MenuItem onClick={handleNotificationsClose}>No new notifications</MenuItem>
                    </Menu>

                    <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        {user?.first_name ? (
                            <Avatar sx={{ width: 32, height: 32 }}>
                                {user.first_name.charAt(0)}
                            </Avatar>
                        ) : (
                            <AccountCircleIcon />
                        )}
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleClose}>Profile</MenuItem>
                        <MenuItem onClick={handleClose}>Settings</MenuItem>
                        <MenuItem onClick={onLogout}>Logout</MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default InstructorPortalHeader; 