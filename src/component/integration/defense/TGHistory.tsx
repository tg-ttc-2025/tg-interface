// src/component/integration/defense/TGHistory.tsx

import { 
    Box, 
    Typography, 
    Avatar, 
    TextField, 
    InputAdornment, 
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    CircularProgress,
    IconButton,
    Collapse,
} from '@mui/material';
import { 
    Search, 
    History as HistoryIcon,
    FilterList,
    Clear,
    GpsFixed as GpsFixedIcon,
    Speed as SpeedIcon,
    Height as HeightIcon,
} from '@mui/icons-material';
import { useState, useMemo, useEffect } from 'react';
import type { DroneObject } from '../../../types/drone.type';

interface DroneUpdate extends DroneObject {
    updateId: string;
    lastUpdated: number;
}

interface TGHistoryProps {
    allHistory: DroneUpdate[];
    onHistorySelect?: (objId: string | null) => void;
    onClearFilters?: () => void;
    isLoading?: boolean;
}

export default function TGHistory({ 
    allHistory, 
    onHistorySelect,
    onClearFilters,
    isLoading = false,
}: TGHistoryProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedObjId, setSelectedObjId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(new Set());
    
    // Get unique object IDs
    const uniqueObjIds = useMemo(() => {
        const ids = new Set(allHistory.map(d => d.obj_id));
        return Array.from(ids).sort();
    }, [allHistory]);

    // Apply filters
    const filteredHistory = useMemo(() => {
        let filtered = allHistory;

        // First, filter by selected Object ID if any
        if (selectedObjId) {
            filtered = filtered.filter(d => d.obj_id === selectedObjId);
        }

        // Then, apply search term filter
        if (searchTerm) {
            filtered = filtered.filter((drone) =>
                drone.obj_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                drone.details.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
                drone.objective.toLowerCase().includes(searchTerm.toLowerCase()) ||
                drone.type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    }, [allHistory, selectedObjId, searchTerm]);

    // Track recently updated items - FIXED: Use useEffect instead of useMemo
    useEffect(() => {
        const newIds = new Set<string>();
        const fiveSecondsAgo = Date.now() - 5000;
        
        filteredHistory.forEach(drone => {
            if (drone.lastUpdated > fiveSecondsAgo) {
                newIds.add(drone.updateId);
            }
        });
        
        // Only update if there are actually new items
        if (newIds.size > 0) {
            setRecentlyUpdatedIds(newIds);
            
            // Clear after animation
            const timer = setTimeout(() => {
                setRecentlyUpdatedIds(new Set());
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [filteredHistory.length]); // Only run when new items are added

    // Calculate statistics based on filtered results
    const stats = useMemo(() => {
        const uniqueObjects = new Set(filteredHistory.map(d => d.obj_id)).size;
        const totalDetections = filteredHistory.length;
        const avgPerObject = uniqueObjects > 0 ? Math.round(totalDetections / uniqueObjects) : 0;

        return {
            uniqueObjects,
            totalDetections,
            avgPerObject,
        };
    }, [filteredHistory]);

    // Handle object ID selection
    const handleObjIdSelect = (value: string) => { 
        const objId = value || null; 
        
        setSelectedObjId(objId);
        if (onHistorySelect) {
            onHistorySelect(objId);
        }
    };

    // Handle card click
    const handleDroneCardClick = (objId: string) => {
        if (onHistorySelect) {
            onHistorySelect(objId);
        }
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedObjId(null);
        if (onClearFilters) {
            onClearFilters();
        }
        if (onHistorySelect) {
            onHistorySelect(null);
        }
    };

    // Get image URL
    const getImageUrl = (detection: DroneUpdate): string | null => {
        if (detection.image?.publicUrl) {
            return detection.image.publicUrl;
        }
        if (detection.image && detection.image) {
            return detection.image.publicUrl || null;
        }
        return null;
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
        return colorMap[color.toLowerCase()] || '#eab308';
    };

    const formatTimestamp = (timestamp: any): any => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatSpeed = (speed: number | string): string => {
        const speedNum = typeof speed === 'string' ? parseFloat(speed) : speed;
        return speedNum.toFixed(1);
    };

    const getAltitude = (drone: DroneUpdate): string => {
        if (drone.rawData?.alt) {
            return drone.rawData.alt;
        }
        return '0';
    };

    const getLastUpdated = (drone: DroneUpdate): any => {
        if(drone.rawData?.updatedAt){
            return drone.rawData?.updatedAt;
        }
    }

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
                    borderLeft: '8px solid #F5B027',
                    bgcolor: '#a18b60ff',
                    paddingY: 2,
                    paddingX: 4,
                    borderBottom: '2px solid #404040',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        sx={{
                            width: 50,
                            height: 50,
                            backgroundColor: '#F5B027',
                        }}
                    >
                        <HistoryIcon sx={{ fontSize: 30 }} />
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
                            HISTORY
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                            }}
                        >
                            DETECTION LOG
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => setShowFilters(!showFilters)}
                        sx={{ color: 'white' }}
                    >
                        <FilterList />
                    </IconButton>
                </Box>
            </Box>

            {/* Filters Section */}
            <Collapse in={showFilters}>
                <Box sx={{ p: 2, bgcolor: 'rgba(245, 176, 39, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    
                    {/* Object ID Filter */}
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Filter by Object ID</InputLabel>
                        <Select
                            value={selectedObjId || ''}
                            label="Filter by Object ID"
                            onChange={(e) => handleObjIdSelect(e.target.value as string)}
                            sx={{
                                color: 'white',
                                '.MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#F5B027',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#F5B027',
                                },
                                '.MuiSvgIcon-root': {
                                    color: 'white',
                                },
                            }}
                        >
                            <MenuItem value={''}>--- Show All Objects ---</MenuItem>
                            {uniqueObjIds.map(id => (
                                <MenuItem key={id} value={id}>{id}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Clear Filters Button */}
                    {(selectedObjId || searchTerm) && (
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Clear />}
                            onClick={handleClearFilters}
                            sx={{
                                mt: 1,
                                color: 'white',
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                '&:hover': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            Clear All Filters
                        </Button>
                    )}
                </Box>
            </Collapse>

            {/* Search Bar */}
            <Box sx={{ marginTop:1, marginBottom:1}}>
                <TextField
                    fullWidth
                    placeholder={`Search ${selectedObjId ? selectedObjId + ' history' : 'all history'}...`}
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
                            borderRadius: '0px',
                            '& .MuiInputBase-input': {
                                padding: '6px 10px',
                                fontSize: '0.8rem', 
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#d99f2cff',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#F5B027',
                            },
                        },
                    }}
                />
            </Box>

            {/* Statistics */}
            <Box sx={{ px: 5, pb: 5, display: 'flex', gap: 2, mb: -5 }}>
                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: 'rgba(245, 176, 39, 0.15)',
                        border: '1px solid rgba(245, 176, 39, 0.3)',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                        Objects
                    </Typography>
                    <Typography sx={{ color: '#F5B027', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>
                        {stats.uniqueObjects}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: 'rgba(234, 179, 8, 0.15)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                        Records
                    </Typography>
                    <Typography sx={{ color: '#eab308', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>
                        {stats.totalDetections}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: 'rgba(217, 159, 44, 0.15)',
                        border: '1px solid rgba(217, 159, 44, 0.3)',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                        Avg
                    </Typography>
                    <Typography sx={{ color: '#d99f2c', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>
                        {stats.avgPerObject}
                    </Typography>
                </Box>
            </Box>

            {/* History List */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 2,
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: '#483d26ff',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#fab833ff',
                        borderRadius: '4px',
                    },
                }}
            >
                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                        <CircularProgress size={40} sx={{ color: '#fab833ff' }} />
                    </Box>
                )}

                {!isLoading && filteredHistory.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 8, p: 4 }}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '3rem', mb: 2 }}>
                            📋
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1rem', fontWeight: 600, mb: 1 }}>
                            No History Found
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.85rem' }}>
                            {selectedObjId 
                                ? `No records found for Object ID: ${selectedObjId}` 
                                : 'No detection records available'}
                        </Typography>
                    </Box>
                )}

                {!isLoading && filteredHistory.map((drone) => {
                    const droneColor = getColorHex(drone.details.color);
                    const imageUrl = getImageUrl(drone);
                    const recentlyUpdated = recentlyUpdatedIds.has(drone.updateId);
                    
                    return (
                        <Box
                            key={drone.updateId}
                            onClick={() => handleDroneCardClick(drone.obj_id)}
                            sx={{
                                backgroundColor: recentlyUpdated 
                                    ? 'rgba(245, 176, 39, 0.25)' 
                                    : 'rgba(245, 176, 39, 0.1)',
                                border: `1px solid ${recentlyUpdated ? 'rgba(245, 176, 39, 0.6)' : 'rgba(245, 176, 39, 0.3)'}`,
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
                                    backgroundColor: 'rgba(245, 176, 39, 0.2)',
                                    border: '1px solid rgba(245, 176, 39, 0.5)',
                                    borderLeft: `4px solid ${droneColor}`,
                                    transform: 'translateX(4px)',
                                    boxShadow: `0 0 20px ${droneColor}40`,
                                },
                            }}
                        >
                            {recentlyUpdated && (
                                <Typography
                                    sx={{
                                        position: 'absolute',
                                        zIndex: 1000,
                                        top: 8,
                                        right: 8,
                                        backgroundColor: '#eab308',
                                        color: 'white',
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    NEW
                                </Typography>
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
                                        border: '1px solid rgba(245, 176, 39, 0.2)',
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
                                    color: 'rgba(245, 176, 39, 0.8)', 
                                    fontSize: '0.7rem',
                                    fontWeight: 500,
                                }}>
                                    Click to locate →
                                </Typography>
                            </Box>

                            <Typography sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)', 
                                fontSize: '0.85rem', 
                                mb: 0.5,
                                display: 'flex',       
                                alignItems: 'center'  
                            }}>
                                <GpsFixedIcon sx={{ fontSize: '1rem', mr: 0.75, color: '#F5B027' }} /> 
                                {Number(drone.lat).toFixed(6)}, {Number(drone.lng).toFixed(6)}
                            </Typography>

                            <Typography sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)', 
                                fontSize: '0.85rem', 
                                mb: 0.5,
                                display:'flex',
                                alignItems: 'center'   
                            }}>
                                <SpeedIcon sx={{ fontSize: '1rem', mr: 0.75, color: '#eab308' }}/> 
                                {formatSpeed(drone.details.speed)} m/s
                            </Typography>

                            <Typography sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)', 
                                fontSize: '0.85rem', 
                                mb: 0.5,
                                display:'flex',
                                alignItems: 'center'   
                            }}>
                                <HeightIcon sx={{ fontSize: '1rem', mr: 0.75, color: '#d99f2c' }}/> 
                                {getAltitude(drone)} m
                            </Typography>

                            <Typography sx={{ 
                                color: 'rgba(255, 255, 255, 0.5)', 
                                fontSize: '0.7rem',
                                mt: 1,
                            }}>
                                {"Last updated: " + formatTimestamp(drone.rawData?.updatedAt)}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}