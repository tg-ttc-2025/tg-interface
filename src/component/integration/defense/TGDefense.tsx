// src/component/integration/defense/TGDefense.tsx

import { Box, Typography, Avatar, TextField, InputAdornment, Chip } from '@mui/material';
import { Search } from '@mui/icons-material';
import SecurityIcon from '@mui/icons-material/Security';
import { useState, useMemo } from 'react';
import type { DroneObject } from '../../../services/tgDefenseDetectionService';

interface DroneUpdate extends DroneObject {
    updateId: string;
    lastUpdated: number;
}

interface DefenseProps {
    allDrones: DroneUpdate[];
    onDroneClick?: (droneId: string) => void;
    isConnected?: boolean;
}

export default function TGDefense({ allDrones, onDroneClick, isConnected = false }: DefenseProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDrones = allDrones.filter((drone) =>
        drone.obj_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drone.details.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drone.objective.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate statistics
    const uniqueDronesCount = useMemo(() => {
        return new Set(filteredDrones.map(d => d.obj_id)).size;
    }, [filteredDrones]);

    const totalUpdatesCount = filteredDrones.length;
    const avgUpdatesPerDrone = uniqueDronesCount > 0 ? Math.round(totalUpdatesCount / uniqueDronesCount) : 0;

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

// Assuming this is within a frontend framework like React (Vite/CRA)
// and these environment variables are defined in your .env file
const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) return '';
    
    // 1. If it's already a full URL (e.g., from a pre-signed URL response), return it
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // 2. Define configuration from environment variables
    const minioUrl = import.meta.env.VITE_MINIO_URL || 'http://localhost:9000';
    const bucketName = import.meta.env.VITE_MINIO_BUCKET || 'tg-detections';

    // 3. Construct the direct public path using the path-style URL format:
    //    {MINIO_URL}/{BUCKET_NAME}/{PATH_IN_BUCKET}
    return `${minioUrl}/${bucketName}/${imagePath}`;
};

    const isRecentlyUpdated = (drone: DroneUpdate): boolean => {
        if (!drone.lastUpdated) return false;
        return Date.now() - drone.lastUpdated < 3000; // 3 seconds
    };

    const formatSpeed = (speed: number | string): string => {
        if (typeof speed === 'number') {
            return `${speed.toFixed(1)}`;
        }
        // If speed is already a string with units, return as is
        return speed.toString();
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
                            LIVE FEED
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#f87171',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                            }}
                        >
                            REAL-TIME ONLY
                        </Typography>
                    </Box>
                    <Chip
                        label={isConnected ? "LIVE" : "OFFLINE"}
                        size="small"
                        sx={{
                            backgroundColor: isConnected ? '#22c55e' : '#6b7280',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            animation: isConnected ? 'pulse 2s infinite' : 'none',
                            '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.7 },
                            }
                        }}
                    />
                </Box>
            </Box>

            {/* Search Bar */}
            <Box sx={{ padding: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search by ID, color, or objective..."
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

            {/* Statistics Bar */}
            <Box 
                sx={{ 
                    px: 2, 
                    pb: 2,
                    display: 'flex',
                    gap: 1.5,
                }}
            >
                {/* Total Drones */}
                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: 'rgba(220, 38, 38, 0.15)',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        borderRadius: '8px',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography 
                        sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 0.5,
                        }}
                    >
                        Objects
                    </Typography>
                    <Typography 
                        sx={{ 
                            color: '#dc2626', 
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            lineHeight: 1,
                        }}
                    >
                        {uniqueDronesCount}
                    </Typography>
                </Box>

                {/* Total Updates */}
                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '8px',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography 
                        sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 0.5,
                        }}
                    >
                        Detections
                    </Typography>
                    <Typography 
                        sx={{ 
                            color: '#22c55e', 
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            lineHeight: 1,
                        }}
                    >
                        {totalUpdatesCount}
                    </Typography>
                </Box>

                {/* Average Updates */}
                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography 
                        sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 0.5,
                        }}
                    >
                        Avg/Obj
                    </Typography>
                    <Typography 
                        sx={{ 
                            color: '#3b82f6', 
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            lineHeight: 1,
                        }}
                    >
                        {avgUpdatesPerDrone}
                    </Typography>
                </Box>
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
                {filteredDrones.length === 0 && (
                    <Box sx={{ 
                        textAlign: 'center', 
                        mt: 8,
                        p: 4,
                    }}>
                        <Typography sx={{ 
                            color: 'rgba(255, 255, 255, 0.3)', 
                            fontSize: '3rem',
                            mb: 2,
                        }}>
                            📡
                        </Typography>
                        <Typography sx={{ 
                            color: 'rgba(255, 255, 255, 0.5)', 
                            fontSize: '1rem',
                            fontWeight: 600,
                            mb: 1,
                        }}>
                            No Detections
                        </Typography>
                        <Typography sx={{ 
                            color: 'rgba(255, 255, 255, 0.3)', 
                            fontSize: '0.85rem',
                        }}>
                            Waiting for offense detections...
                        </Typography>
                    </Box>
                )}

                {filteredDrones.map((drone) => {
                    const droneColor = getColorHex(drone.details.color);
                    const imageUrl = drone.image?.publicUrl;
                    const recentlyUpdated = isRecentlyUpdated(drone);
                    
                    return (
                        <Box
                            key={drone.updateId}
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
                                animation: recentlyUpdated ? 'slideIn 0.5s ease-out, pulse 1s ease-in-out' : 'none',
                                '@keyframes slideIn': {
                                    '0%': {
                                        transform: 'translateX(-100%)',
                                        opacity: 0,
                                    },
                                    '100%': {
                                        transform: 'translateX(0)',
                                        opacity: 1,
                                    },
                                },
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
                                        zIndex: 1000,
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
                                    NEW
                                </Box>
                            )}

                            {imageUrl && (
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: '120px',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        mb: 1.5,
                                        position: 'relative',
                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    }}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`Detection ${drone.obj_id}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            console.warn('Failed to load image:', imageUrl);
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: '#22c55e',
                                            fontSize: '0.6rem',
                                            fontWeight: 600,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            border: '1px solid #22c55e',
                                        }}
                                    >
                                        📸 IMAGE
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
                                📍 {Number(drone.lat).toFixed(6)}, {Number(drone.lng).toFixed(6)}
                            </Typography>
                            
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', mb: 1 }}>
                                🚀 {formatSpeed(drone.details.speed)} m/s | {drone.size || 'medium'}
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
                                    label={drone.type.toUpperCase()}
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