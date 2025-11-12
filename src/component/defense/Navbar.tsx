import { useState, useEffect } from 'react';
import { useCamera } from '../../hooks/Camera/useCamera';
import { AppBar, Avatar, Badge, Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import { Settings } from 'lucide-react';
import SecurityIcon from '@mui/icons-material/Security';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();

    // Credentials
    const DEFENCE_LOCATION = '02999a4a-361c-498c-a250-d5d70dd39fb8';
    const DEFENCE_TOKEN = 'df2a423f93a9c512e1bc95ec29e1c44a843c71a3676aba595c891a8ce5e785a0';

    const { data } = useCamera(DEFENCE_LOCATION, DEFENCE_TOKEN);

    const handleNavigateToOffense = () => {
        navigate('/offense');
    };

    const handleNavigateToDefense = () => {
        navigate('/defense');
    };

    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100vh', 
                width: '100vw',
                backgroundColor: '#0f0f1e', 
                margin: 0, 
                padding: 0,
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
        >
            {/* Top Navigation Bar */}
            <AppBar 
                position="static" 
                elevation={0}
                sx={{ 
                    backgroundColor: '#121212',
                    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                    margin: 0,
                    padding: 0,
                }}
            >
                <Toolbar sx={{ minHeight: '64px !important', padding: '0 16px !important' }}>
                    {/* Logo */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 4, ml: 4 }}>
                        <Box
                            component="img"
                            src="https://cdn.discordapp.com/attachments/1437110414948171807/1437489635776397332/Tactical.jpg?ex=691416cc&is=6912c54c&hm=30a0836d84e6ee00eb28ee1b0b3fcfed9784adb85c19ddfcd78eb94f0d0f6de6&"
                            alt="Tactical Logo"
                            sx={{
                                width: 60,
                                height: 60,
                                objectFit: 'cover',
                            }}
                        />
                    </Box>

                    {/* Title */}
                    <Typography
                        variant="h5"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 500,
                            color: 'white',
                            letterSpacing: '1px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.2,
                        }}
                    >
                        <span>{data?.name} Command Post Visualization</span>
                    </Typography>

                    {/* System Status */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3 }}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: '#22c55e',
                                boxShadow: '0 0 10px #22c55e',
                            }}
                        />
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                            System Status: Online
                        </Typography>
                    </Box>

                    {/* Time */}
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 3 }}>
                        {currentTime.toLocaleTimeString('en-US', { hour12: false })} UTC
                    </Typography>

                    <Tooltip title="Defense Command" arrow placement="bottom">
                        <IconButton onClick={handleNavigateToDefense} sx={{ color: 'white', mr: 1, border: 2, borderRadius: '10px', bgcolor: '#ef4444' }}>
                            <Avatar
                                sx={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: '#ef4444',
                                }}
                            >
                                <SecurityIcon sx={{ fontSize: 20 }} />
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Offense Command" arrow placement="bottom">
                        <IconButton onClick={handleNavigateToOffense} sx={{ color: 'white', mr: 1, border: 2, borderRadius: '10px', bgcolor: '#3b82f6' }}>
                            <Avatar
                                sx={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: '#3b82f6',
                                }}
                            >
                                <AdsClickIcon sx={{ fontSize: 20 }} />
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                    <Avatar
                        sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: '#2563eb',
                        }}
                    />
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    flex: 1, 
                    overflow: 'hidden',
                    margin: 0,
                    padding: 0,
                }}
            >
                {/* Left Panel - Defense */}
            </Box>
        </Box>
    );
}