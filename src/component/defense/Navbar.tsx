import { useState, useEffect } from 'react';
import { useCamera } from '../../hooks/Camera/useCamera';
import { 
    AppBar, 
    Avatar, 
    Box, 
    IconButton, 
    Toolbar, 
    Tooltip, 
    Typography,
    Popover,
    Card,
    CardHeader,
    CardContent,
    Divider,
    Collapse,
} from '@mui/material';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import SecurityIcon from '@mui/icons-material/Security';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();

    const DEFENCE_LOCATION = '02999a4a-361c-498c-a250-d5d70dd39fb8';
    const DEFENCE_TOKEN = 'df2a423f93a9c512e1bc95ec29e1c44a843c71a3676aba595c891a8ce5e785a0';

    const { data } = useCamera(DEFENCE_LOCATION, DEFENCE_TOKEN);

    const handleNavigateToOffense = () => {
        navigate('/tg-offense');
    };

    const handleNavigateToDefense = () => {
        navigate('/tg-defense');
    };

    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    
    const [showRawData, setShowRawData] = useState(false);

    const handleOpenDataPopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseDataPopover = () => {
        setAnchorEl(null);
        setShowRawData(false); 
    };

    const open = Boolean(anchorEl);
    const id = open ? 'data-popover' : undefined;

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
                    {/* ... (Logo, Title, Status, Time, and Nav Buttons remain the same) ... */}
                    
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
                        variant="h6"
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
                        {data?.name} KMITL
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

                    <Tooltip title="Show Camera Data" arrow placement="bottom">
                        <Avatar
                            sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: '#2563eb',
                                cursor: 'pointer',
                                '&:hover': {
                                    opacity: 0.8
                                }
                            }}
                            onClick={handleOpenDataPopover}
                            aria-describedby={id}
                        />
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <Box 
                sx={{ 
                    display: 'flex', 
                    flex: 1, 
                    overflow: 'hidden',
                    margin: 0,
                    padding: 0,
                }}
            >
            </Box>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleCloseDataPopover}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        backgroundColor: 'transparent', // Popover itself is transparent
                        boxShadow: 'none',
                        borderRadius: '8px',
                        marginTop: '8px',
                        overflow: 'hidden',
                    }
                }}
            >
                <Card sx={{ 
                    width: 360, 
                    backgroundColor: '#1e293b',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))'
                }}>
                    <CardHeader
                        title={
                            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>
                                {data?.Institute || 'Loading...'}
                            </Typography>
                        }
                        subheader={
                            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                                ID: {data?.id || '...'}
                            </Typography>
                        }
                    />
                    <CardContent sx={{ pt: 0 }}>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>Team:</Typography>
                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{data?.name || 'N/A'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>Sort:</Typography>
                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{data?.sort || 'N/A'}</Typography>
                            </Box>
                        </Box>
                        
                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', my: 1 }} />

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}
                            onClick={() => setShowRawData(!showRawData)}
                        >
                            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                Show Raw Data
                            </Typography>
                            <IconButton
                                size="small"
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    transform: showRawData ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s',
                                }}
                            >
                                <ExpandMoreIcon />
                            </IconButton>
                        </Box>

                        <Collapse in={showRawData}>
                            <Box
                                component="pre"
                                sx={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    color: '#f1f1f1',
                                    padding: 1.5,
                                    borderRadius: '8px',
                                    overflow: 'auto',
                                    maxHeight: '200px',
                                    fontSize: '0.75rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    mt: 1,
                                    margin: 0,
                                }}
                            >
                                {data ? JSON.stringify(data, null, 2) : 'No data...'}
                            </Box>
                        </Collapse>
                    </CardContent>
                </Card>
            </Popover>
        </Box>
    );
}