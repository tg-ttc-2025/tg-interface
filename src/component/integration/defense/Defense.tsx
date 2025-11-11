import { Box, Typography, Avatar, TextField, InputAdornment, Chip, CircularProgress } from '@mui/material';
import { Search } from '@mui/icons-material';
import SecurityIcon from '@mui/icons-material/Security';
import { useState, useEffect } from 'react';
import type { DroneObject } from '../../../services/defenseDetectionService';
import { useSocket } from '../../../hooks/Socket/useSocket';
import { useDetections } from '../../../hooks/Defense/useDefenseDetection';

interface DefenseProps {
    onDroneClick?: (droneId: string) => void;
}

export default function Defense({ onDroneClick }: DefenseProps) {
    const DEFENCE_LOCATION = '02999a4a-361c-498c-a250-d5d70dd39fb8';
    const DEFENCE_TOKEN = 'df2a423f93a9c512e1bc95ec29e1c44a843c71a3676aba595c891a8ce5e785a0';

    const [allDetections, setAllDetections] = useState<DroneObject[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isStarted, setIsStarted] = useState(true);

    const { data: historyData, isLoading, error } = useDetections(
        DEFENCE_LOCATION, 
        DEFENCE_TOKEN, 
        isStarted
    );

    const { realtimeData, isConnected } = useSocket(DEFENCE_LOCATION, isStarted);

    // Initialize with historical data
    useEffect(() => {
        if (historyData?.objects) {
            setAllDetections(historyData.objects);
        }
    }, [historyData]);

    // Handle real-time updates - UPDATE existing drones or ADD new ones
    useEffect(() => {
        if (realtimeData?.objects) {
            setAllDetections((prev) => {
                const updated = [...prev];
                
                realtimeData.objects.forEach((newDrone) => {
                    const existingIndex = updated.findIndex(
                        (drone) => drone.obj_id === newDrone.obj_id
                    );
                    
                    if (existingIndex !== -1) {
                        // Update existing drone - preserve position in array but update data
                        updated[existingIndex] = {
                            ...newDrone,
                            // Add timestamp for tracking updates
                            lastUpdated: Date.now()
                        };
                    } else {
                        // Add new drone at the beginning
                        updated.unshift({
                            ...newDrone,
                            lastUpdated: Date.now()
                        });
                    }
                });
                
                // Sort by last updated (most recent first)
                return updated.sort((a, b) => {
                    const aTime = (a as any).lastUpdated || 0;
                    const bTime = (b as any).lastUpdated || 0;
                    return bTime - aTime;
                });
            });
        }
    }, [realtimeData]);

    const filteredDrones = allDetections.filter((drone) =>
        drone.obj_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drone.details.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drone.objective.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDroneCardClick = (droneId: string) => {
        if (onDroneClick) {
            onDroneClick(droneId);
        }
    };

    const getColorHex = (color: string): string => {
        const colorMap: Record<string, string> = {
            red: '#ef4444',
            black: '#1f2937',
            gray: '#6b7280',
            grey: '#6b7280',
            blue: '#3b82f6',
            green: '#22c55e',
            yellow: '#eab308',
            white: '#f9fafb',
            orange: '#f97316',
        };
        return colorMap[color.toLowerCase()] || '#ef4444';
    };

    const getImageUrl = (imagePath?: string): string => {
        if (!imagePath) return '';
        if (imagePath.startsWith('/api')) {
            return `https://tesa-api.crma.dev${imagePath}`;
        }
        return imagePath;
    };

    // Check if drone was recently updated (within last 3 seconds)
    const isRecentlyUpdated = (drone: any): boolean => {
        if (!drone.lastUpdated) return false;
        return Date.now() - drone.lastUpdated < 3000;
    };

    return (
        <Box
            sx={{
                width: '450px',
                height: '100%',
                backgroundColor: 'rgba(18, 18, 18, 0.95)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '2px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '4px 0 20px rgba(0, 0, 0, 0.5)',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    borderLeft: '8px solid #dc2626',
                    bgcolor: '#2A1716',
                    padding: 3,
                    borderBottom: '2px solid #404040',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        sx={{
                            width: 50,
                            height: 50,
                            backgroundColor: '#dc2626',
                        }}
                    >
                        <SecurityIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            DEFENSE
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#f87171',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                            }}
                        >
                            ENEMY DRONES
                        </Typography>
                    </Box>
                    <Chip
                        label={isConnected ? 'LIVE' : 'OFFLINE'}
                        size="small"
                        sx={{
                            backgroundColor: isConnected ? '#22c55e' : '#6b7280',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                        }}
                    />
                </Box>
            </Box>

            {/* Search Bar */}
            <Box sx={{ padding: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search drones..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                            </InputAdornment>
                        ),
                        sx: {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            borderRadius: '8px',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(220, 38, 38, 0.5)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#dc2626',
                            },
                        },
                    }}
                />
            </Box>

            {/* Drone Count */}
            <Box sx={{ px: 2, pb: 1 }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
                    Detected: <strong style={{ color: '#dc2626' }}>{filteredDrones.length}</strong> drones
                </Typography>
            </Box>

            {/* Content Area */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 2,
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#dc2626',
                        borderRadius: '4px',
                    },
                }}
            >

                {!isLoading && filteredDrones.length === 0 && (
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', mt: 4 }}>
                        No enemy drones detected
                    </Typography>
                )}

                {filteredDrones.map((drone) => {
                    const droneColor = getColorHex(drone.details.color);
                    const imageUrl = getImageUrl((drone as any).image?.path);
                    const recentlyUpdated = isRecentlyUpdated(drone);
                    
                    return (
                        <Box
                            key={drone.obj_id}
                            onClick={() => handleDroneCardClick(drone.obj_id)}
                            sx={{
                                backgroundColor: recentlyUpdated 
                                    ? 'rgba(220, 38, 38, 0.25)' 
                                    : 'rgba(220, 38, 38, 0.1)',
                                border: `1px solid ${recentlyUpdated ? 'rgba(220, 38, 38, 0.6)' : 'rgba(220, 38, 38, 0.3)'}`,
                                borderLeft: `4px solid ${droneColor}`,
                                borderRadius: '8px',
                                padding: 2,
                                mb: 2,
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                animation: recentlyUpdated ? 'pulse 1s ease-in-out' : 'none',
                                '@keyframes pulse': {
                                    '0%, 100%': {
                                        opacity: 1,
                                    },
                                    '50%': {
                                        opacity: 0.8,
                                    },
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(220, 38, 38, 0.2)',
                                    border: '1px solid rgba(220, 38, 38, 0.5)',
                                    borderLeft: `4px solid ${droneColor}`,
                                    transform: 'translateX(4px)',
                                    boxShadow: `0 0 20px ${droneColor}40`,
                                },
                            }}
                        >
                            {recentlyUpdated && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        zIndex:1000,
                                        top: 8,
                                        right: 8,
                                        backgroundColor: '#22c55e',
                                        color: 'white',
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Updated
                                </Box>
                            )}

                            {/* Drone Image Thumbnail */}
                            {imageUrl && (
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: '120px',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        mb: 1.5,
                                        position: 'relative',
                                    }}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`Drone ${drone.obj_id}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 4,
                                            right: 4,
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            fontSize: '0.6rem',
                                            fontWeight: 600,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        LIVE
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        backgroundColor: droneColor,
                                        boxShadow: `0 0 8px ${droneColor}`,
                                    }}
                                />
                                <Typography sx={{ color: 'white', fontWeight: 600, flex: 1 }}>
                                    {drone.obj_id}
                                </Typography>
                                <Typography sx={{ 
                                    color: 'rgba(255, 255, 255, 0.5)', 
                                    fontSize: '0.7rem',
                                    fontWeight: 500,
                                }}>
                                    Click to locate →
                                </Typography>
                            </Box>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', mb: 0.5 }}>
                                📍 {drone.lat.toFixed(6)}, {drone.lng.toFixed(6)}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', mb: 1 }}>
                                🚀 {drone.details.speed} m/s | {drone.size}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label={drone.objective}
                                    size="small"
                                    sx={{
                                        backgroundColor: drone.objective.toLowerCase() === 'kill' ? '#dc2626' : '#f59e0b',
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                    }}
                                />
                                <Chip
                                    label={drone.details.color}
                                    size="small"
                                    sx={{
                                        backgroundColor: droneColor,
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                    }}
                                />
                                <Chip
                                    label={drone.type}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        fontSize: '0.7rem',
                                    }}
                                />
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}