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
} from '@mui/icons-material';
import { useState, useMemo } from 'react';

interface DroneObject {
    obj_id: string;
    type: string;
    lat: number | string;
    lng: number | string;
    objective: string;
    size: string;
    details: {
        color: string;
        speed: number | string;
    };
    image?: { publicUrl: string; filename: string; };
    images?: Array<any>;
}

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
    
    // Get unique object IDs
    const uniqueObjIds = useMemo(() => {
        const ids = new Set(allHistory.map(d => d.obj_id));
        return Array.from(ids).sort();
    }, [allHistory]);

    // FIXED: Apply filters in the correct order
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

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
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
                <Box sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    
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
                            borderRadius: '0px','& .MuiInputBase-input': {
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
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                        Objects
                    </Typography>
                    <Typography sx={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>
                        {stats.uniqueObjects}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                        Records
                    </Typography>
                    <Typography sx={{ color: '#22c55e', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>
                        {stats.totalDetections}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                        Avg
                    </Typography>
                    <Typography sx={{ color: '#a855f7', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>
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

                {!isLoading && filteredHistory.map((detection) => {
                    const droneColor = getColorHex(detection.details.color);
                    const isSelected = selectedObjId === detection.obj_id;
                    
                    return (
                        <Box
                            key={detection.updateId}
                            sx={{
                                backgroundColor: isSelected 
                                    ? '#7b693cff' 
                                    : '#392d13ff',
                                border: `1px solid ${isSelected ? '#8b671dff' : '#fab833ff'}`,
                                borderLeft: `4px solid #fab833ff`,
                                borderRadius: '8px',
                                padding: 2,
                                mb: 1.5,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: '#634914ff',
                                    border: '1px solid #b7882cff',
                                    borderLeft: `4px solid #fab833ff`,
                                    transform: 'translateX(4px)',
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: droneColor,
                                        boxShadow: `0 0 6px ${droneColor}`,
                                    }}
                                />
                                <Typography sx={{ color: 'white', fontWeight: 600, flex: 1, fontSize: '0.9rem' }}>
                                    {detection.obj_id}
                                </Typography>
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.65rem' }}>
                                    {formatTimestamp(detection.lastUpdated)}
                                </Typography>
                            </Box>

                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', mb: 0.5 }}>
                                📍 {Number(detection.lat).toFixed(6)}, {Number(detection.lng).toFixed(6)}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                <Chip
                                    label={detection.type.toUpperCase()}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(59, 130, 246, 0.3)',
                                        color: 'white',
                                        fontSize: '0.65rem',
                                        height: '20px',
                                    }}
                                />
                                <Chip
                                    label={detection.details.color}
                                    size="small"
                                    sx={{
                                        backgroundColor: droneColor,
                                        color: 'white',
                                        fontSize: '0.65rem',
                                        height: '20px',
                                    }}
                                />
                                <Chip
                                    label={`${detection.details.speed} m/s`}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        fontSize: '0.65rem',
                                        height: '20px',
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