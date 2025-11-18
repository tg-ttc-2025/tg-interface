// component/defense/integration/offense/TGOffenseHistory.tsx
import { Box, Typography, TextField, MenuItem, Chip, CircularProgress, Avatar } from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import HistoryIcon from '@mui/icons-material/History';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import type { OffenseMoveUpdate } from '../../../types/offenseMove.type';


interface TGOffenseHistoryProps {
    allHistory: OffenseMoveUpdate[];
    onHistorySelect: (codeName: string | null) => void;
    onClearFilters: () => void;
    onFilterChange?: (filters: { codeName: string | null; objective: string | null; groupId: string | null }) => void;
    isLoading?: boolean;
}

export default function TGOffenseHistory({
    allHistory,
    onHistorySelect,
    onClearFilters,
    onFilterChange,
    isLoading = false
}: TGOffenseHistoryProps) {
    const [selectedCodeName, setSelectedCodeName] = useState<string>('ALL');
    const [selectedObjective, setSelectedObjective] = useState<string>('ALL');
    const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

    // Notify parent of filter changes
    useEffect(() => {
        if (onFilterChange) {
            onFilterChange({
                codeName: selectedCodeName === 'ALL' ? null : selectedCodeName,
                objective: selectedObjective === 'ALL' ? null : selectedObjective,
                groupId: selectedGroup === 'ALL' ? null : selectedGroup,
            });
        }
    }, [selectedCodeName, selectedObjective, selectedGroup, onFilterChange]);

    // Get unique values for filters
    const filterOptions = useMemo(() => {
        const codeNames = new Set<string>();
        const objectives = new Set<string>();
        const groups = new Set<number>();

        allHistory.forEach(move => {
            codeNames.add(move.codeName);
            objectives.add(move.objective);
            groups.add(move.groupId);
        });

        return {
            codeNames: Array.from(codeNames).sort(),
            objectives: Array.from(objectives).sort(),
            groups: Array.from(groups).sort((a, b) => a - b),
        };
    }, [allHistory]);

    // Filter history based on selections
    const filteredHistory = useMemo(() => {
        return allHistory.filter(move => {
            if (selectedCodeName !== 'ALL' && move.codeName !== selectedCodeName) return false;
            if (selectedObjective !== 'ALL' && move.objective !== selectedObjective) return false;
            if (selectedGroup !== 'ALL' && move.groupId.toString() !== selectedGroup) return false;
            return true;
        });
    }, [allHistory, selectedCodeName, selectedObjective, selectedGroup]);

    // Statistics
    const stats = useMemo(() => {
        const uniqueDrones = new Set(filteredHistory.map(d => d.codeName)).size;
        return {
            total: filteredHistory.length,
            uniqueDrones,
            attackers: filteredHistory.filter(d => d.objective === 'attacker').length,
            defenders: filteredHistory.filter(d => d.objective === 'defender').length,
            reconnaissance: filteredHistory.filter(d => d.objective === 'reconnaissance').length,
            avgPerDrone: uniqueDrones > 0 ? Math.round(filteredHistory.length / uniqueDrones) : 0,
        };
    }, [filteredHistory]);

    const handleCodeNameChange = (value: string) => {
        setSelectedCodeName(value);
        onHistorySelect(value === 'ALL' ? null : value);
    };

    const getObjectiveColor = (objective: string): string => {
        switch (objective) {
            case 'attacker': return '#ef4444';
            case 'defender': return '#3b82f6';
            case 'reconnaissance': return '#f59e0b';
            case 'patrol': return '#10b981';
            case 'escort': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getColorHex = (color?: string): string => {
        if (!color) return '#3b82f6';
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
        return colorMap[color.toLowerCase()] || '#3b82f6';
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
                    borderLeft: '8px solid #eab308',
                    bgcolor: '#3a2e1e',
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
                            backgroundColor: '#eab308',
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
                                color: '#fcd34d',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                            }}
                        >
                            OFFENSE RECORDS
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Filters */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography
                    color={'white'}
                    sx={{
                        pb: 1.5,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                    }}
                >
                    FILTER OPTIONS
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Code Name Filter */}
                    <TextField
                        select
                        size="small"
                        label="Drone Name"
                        value={selectedCodeName}
                        onChange={(e) => handleCodeNameChange(e.target.value)}
                        sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                borderRadius: '0px',
                                '& fieldset': {
                                    borderColor: 'rgba(234, 179, 8, 0.3)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(234, 179, 8, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#eab308',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '0.85rem',
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#eab308',
                            },
                        }}
                    >
                        <MenuItem value="ALL">All Drones</MenuItem>
                        {filterOptions.codeNames.map(name => (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                        ))}
                    </TextField>

                    {/* Objective Filter */}
                    <TextField
                        select
                        size="small"
                        label="Objective"
                        value={selectedObjective}
                        onChange={(e) => setSelectedObjective(e.target.value)}
                        sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                borderRadius: '0px',
                                '& fieldset': {
                                    borderColor: 'rgba(234, 179, 8, 0.3)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(234, 179, 8, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#eab308',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '0.85rem',
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#eab308',
                            },
                        }}
                    >
                        <MenuItem value="ALL">All Objectives</MenuItem>
                        {filterOptions.objectives.map(obj => (
                            <MenuItem key={obj} value={obj}>{obj}</MenuItem>
                        ))}
                    </TextField>

                    {/* Group Filter */}
                    <TextField
                        select
                        size="small"
                        label="Group"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                borderRadius: '0px',
                                '& fieldset': {
                                    borderColor: 'rgba(234, 179, 8, 0.3)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(234, 179, 8, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#eab308',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '0.85rem',
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#eab308',
                            },
                        }}
                    >
                        <MenuItem value="ALL">All Groups</MenuItem>
                        {filterOptions.groups.map(group => (
                            <MenuItem key={group} value={group.toString()}>Group {group}</MenuItem>
                        ))}
                    </TextField>
                </Box>
            </Box>

            {/* Statistics Bar */}
            <Box
                sx={{
                    px: 5,
                    py: 3,
                    display: 'flex',
                    gap: 2,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                {/* Total Records */}
                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography
                        sx={{
                            color: '#eab308',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 0.5,
                        }}
                    >
                        Records
                    </Typography>
                    <Typography
                        sx={{
                            color: '#eab308',
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            lineHeight: 1,
                        }}
                    >
                        {stats.total}
                    </Typography>
                </Box>

                {/* Unique Drones */}
                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: 'rgba(252, 211, 77, 0.1)',
                        border: '1px solid rgba(252, 211, 77, 0.3)',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography
                        sx={{
                            color: '#fcd34d',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 0.5,
                        }}
                    >
                        Drones
                    </Typography>
                    <Typography
                        sx={{
                            color: '#fcd34d',
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            lineHeight: 1,
                        }}
                    >
                        {stats.uniqueDrones}
                    </Typography>
                </Box>

                {/* Average */}
                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: 'rgba(253, 224, 71, 0.1)',
                        border: '1px solid rgba(253, 224, 71, 0.3)',
                        padding: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography
                        sx={{
                            color: '#fde047',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 0.5,
                        }}
                    >
                        Avg
                    </Typography>
                    <Typography
                        sx={{
                            color: '#fde047',
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            lineHeight: 1,
                        }}
                    >
                        {stats.avgPerDrone}
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
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#eab308',
                        borderRadius: '4px',
                    },
                }}
            >
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress sx={{ color: '#eab308' }} />
                    </Box>
                ) : filteredHistory.length === 0 ? (
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
                            📋
                        </Typography>
                        <Typography sx={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            mb: 1,
                        }}>
                            No History Data
                        </Typography>
                        <Typography sx={{
                            color: 'rgba(255, 255, 255, 0.3)',
                            fontSize: '0.85rem',
                        }}>
                            Adjust filters or wait for data...
                        </Typography>
                    </Box>
                ) : (
                    filteredHistory.map((move) => {
                        const droneColor = getColorHex(move.color);
                        const objectiveColor = getObjectiveColor(move.objective);

                        return (
                            <Box
                                key={move.id}
                                sx={{
                                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                    border: '1px solid rgba(234, 179, 8, 0.3)',
                                    borderLeft: `4px solid ${droneColor}`,
                                    borderRadius: '8px',
                                    padding: 2,
                                    mb: 2,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                        border: '1px solid rgba(234, 179, 8, 0.5)',
                                        borderLeft: `4px solid ${droneColor}`,
                                        transform: 'translateX(4px)',
                                        boxShadow: `0 0 20px ${droneColor}40`,
                                    },
                                }}
                            >
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
                                        {move.codeName}
                                    </Typography>
                                    <Chip
                                        label={move.objective}
                                        size="small"
                                        sx={{
                                            backgroundColor: objectiveColor,
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '0.65rem',
                                            height: '20px',
                                            textTransform: 'uppercase',
                                        }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <Chip
                                        label={`Group ${move.groupId}`}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(234, 179, 8, 0.2)',
                                            color: '#fcd34d',
                                            fontSize: '0.65rem',
                                            height: '20px',
                                        }}
                                    />
                                    <Chip
                                        label={move.type}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(252, 211, 77, 0.2)',
                                            color: '#fde047',
                                            fontSize: '0.65rem',
                                            height: '20px',
                                        }}
                                    />
                                </Box>

                                <Typography sx={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '0.85rem',
                                    mb: 0.5,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <GpsFixedIcon sx={{ fontSize: '1rem', mr: 0.75, color: '#eab308' }} />
                                    {Number(move.lat).toFixed(6)}, {Number(move.lng).toFixed(6)}
                                </Typography>

                                <Typography sx={{
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    fontSize: '0.75rem',
                                    mt: 1,
                                }}>
                                    {new Date(move.timestamp).toLocaleString()}
                                </Typography>
                            </Box>
                        );
                    })
                )}
            </Box>
        </Box>
    );
}