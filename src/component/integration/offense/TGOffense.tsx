// component/defense/integration/offense/TGOffense.tsx
import { Box, Typography, Avatar, TextField, InputAdornment, Chip, CircularProgress } from '@mui/material';
import { Search } from '@mui/icons-material';
import { useState, useMemo, useEffect } from 'react';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import SpeedIcon from '@mui/icons-material/Speed';
import HeightIcon from '@mui/icons-material/Height';
import AirIcon from '@mui/icons-material/Air';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import type { OffenseMoveUpdate } from '../../../types/offenseMove.type';

interface TGOffenseProps {
    allDrones: OffenseMoveUpdate[];
    onDroneClick: (droneId: string) => void;
    isConnected: boolean;
}

interface WeatherData {
    temp: number;
    feels_like: number;
    humidity: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather_main: string;
    weather_description: string;
    clouds: number;
    pressure: number;
}

export default function TGOffense({ allDrones, onDroneClick, isConnected = false }: TGOffenseProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [weatherError, setWeatherError] = useState<string | null>(null);

    // Fetch weather data when drones are available
    useEffect(() => {
        const fetchWeather = async () => {
            if (allDrones.length === 0) return;

            // Get the latest drone position
            const latestDrone = allDrones[0];
            if (!latestDrone || !latestDrone.lat || !latestDrone.lng) return;

            const lat = latestDrone.lat;
            const lng = latestDrone.lng;

            setWeatherLoading(true);
            setWeatherError(null);

            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=45282f8105520ebb9937bdf6bcf73eb6&units=metric`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch weather data');
                }

                const data = await response.json();

                setWeatherData({
                    temp: data.main.temp,
                    feels_like: data.main.feels_like,
                    humidity: data.main.humidity,
                    visibility: data.visibility / 1000, // Convert to km
                    wind_speed: data.wind.speed,
                    wind_deg: data.wind.deg,
                    wind_gust: data.wind.gust,
                    weather_main: data.weather[0].main,
                    weather_description: data.weather[0].description,
                    clouds: data.clouds.all,
                    pressure: data.main.pressure,
                });
            } catch (error) {
                console.error('Weather fetch error:', error);
                setWeatherError('Unable to fetch weather');
            } finally {
                setWeatherLoading(false);
            }
        };

        // Fetch weather initially
        fetchWeather();

        // Refresh weather every 5 minutes
        const interval = setInterval(fetchWeather, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [allDrones]);

    const filteredDrones = useMemo(() => {
        return allDrones.filter((drone) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                drone.codeName?.toLowerCase().includes(searchLower) ||
                drone.color?.toLowerCase().includes(searchLower) ||
                drone.objective?.toLowerCase().includes(searchLower) ||
                drone.mission?.toLowerCase().includes(searchLower)
            );
        });
    }, [allDrones, searchTerm]);

    const uniqueDronesCount = useMemo(() => {
        return new Set(filteredDrones.map(d => d.codeName)).size;
    }, [filteredDrones]);

    const totalUpdatesCount = filteredDrones.length;
    const avgUpdatesPerDrone = uniqueDronesCount > 0 ? Math.round(totalUpdatesCount / uniqueDronesCount) : 0;

    const handleDroneCardClick = (droneId: string) => {
        if (onDroneClick) {
            onDroneClick(droneId);
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

    const isRecentlyUpdated = (drone: OffenseMoveUpdate): boolean => {
        if (!drone.lastUpdated) return false;
        return Date.now() - drone.lastUpdated < 3000;
    };

    const formatSpeed = (speed?: number): string => {
        if (typeof speed === 'number') {
            return `${speed.toFixed(1)}`;
        }
        return '0.0';
    };

    const formatThaiDateTime = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
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

    const getWindDirection = (deg: number): string => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(((deg % 360) / 45)) % 8;
        return directions[index];
    };

    const getFlightCondition = (): { status: string; color: string } => {
        if (!weatherData) return { status: 'Unknown', color: '#6b7280' };

        const windSpeed = weatherData.wind_speed;
        const visibility = weatherData.visibility;
        const conditions = weatherData.weather_main.toLowerCase();

        // Critical conditions
        if (windSpeed > 15 || visibility < 1 || conditions.includes('storm') || conditions.includes('thunder')) {
            return { status: 'CRITICAL', color: '#dc2626' };
        }
        
        // Poor conditions
        if (windSpeed > 10 || visibility < 3 || conditions.includes('rain') || conditions.includes('snow')) {
            return { status: 'POOR', color: '#f59e0b' };
        }
        
        // Fair conditions
        if (windSpeed > 7 || visibility < 5 || weatherData.clouds > 70) {
            return { status: 'FAIR', color: '#eab308' };
        }
        
        // Good conditions
        return { status: 'GOOD', color: '#22c55e' };
    };

    const flightCondition = getFlightCondition();

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
                    borderLeft: '8px solid #3b82f6',
                    bgcolor: '#1e3a5f',
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
                            backgroundColor: '#3b82f6',
                        }}
                    >
                        <AdsClickIcon sx={{ fontSize: 30 }} />
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
                            OFFENSE
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#93c5fd',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                            }}
                        >
                            OUR DRONES
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
                                '20%': { opacity: 0.7 },
                            }
                        }}
                    />
                </Box>
            </Box>

            {/* Search Bar */}
            <Box sx={{ marginTop: 1, marginBottom: 1 }}>
                <TextField
                    fullWidth
                    placeholder="Search by name, color, or objective..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.1rem' }} />
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
                                borderColor: 'rgba(59, 130, 246, 0.5)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#3b82f6',
                            },
                        },
                    }}
                />
            </Box>

            {/* Weather Information Section - Single Line */}
            <Box
                sx={{
                    px: 2,
                    pb: 2,
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                }}
            >
                {weatherLoading ? (
                    <Box sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        py: 1 
                    }}>
                        <CircularProgress size={20} sx={{ color: '#3b82f6' }} />
                    </Box>
                ) : weatherError ? (
                    <Box sx={{
                        flex: 1,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        padding: 1,
                        textAlign: 'center',
                    }}>
                        <Typography sx={{ color: '#ef4444', fontSize: '0.7rem' }}>
                            {weatherError}
                        </Typography>
                    </Box>
                ) : weatherData ? (
                    <>
                        {/* Flight Status */}
                        <Box
                            sx={{
                                backgroundColor: `${flightCondition.color}20`,
                                border: `1px solid ${flightCondition.color}`,
                                borderRadius: '6px',
                                padding: '6px 10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: '70px',
                            }}
                        >
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.6rem', mb: 0.3 }}>
                                Flight
                            </Typography>
                            <Typography sx={{ color: flightCondition.color, fontWeight: 700, fontSize: '0.7rem' }}>
                                {flightCondition.status}
                            </Typography>
                        </Box>

                        {/* Wind */}
                        <Box
                            sx={{
                                flex: 1,
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                                <AirIcon sx={{ color: '#60a5fa', fontSize: '0.9rem' }} />
                                <Typography sx={{ color: '#93c5fd', fontSize: '0.6rem' }}>Wind</Typography>
                            </Box>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                                {weatherData.wind_speed.toFixed(1)} m/s
                            </Typography>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.55rem' }}>
                                {getWindDirection(weatherData.wind_deg)}
                            </Typography>
                        </Box>

                        {/* Temperature */}
                        <Box
                            sx={{
                                flex: 1,
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                                <ThermostatIcon sx={{ color: '#60a5fa', fontSize: '0.9rem' }} />
                                <Typography sx={{ color: '#93c5fd', fontSize: '0.6rem' }}>Temp</Typography>
                            </Box>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                                {weatherData.temp.toFixed(1)}°C
                            </Typography>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.55rem' }}>
                                Feels {weatherData.feels_like.toFixed(0)}°
                            </Typography>
                        </Box>

                        {/* Visibility */}
                        <Box
                            sx={{
                                flex: 1,
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                                <VisibilityIcon sx={{ color: '#60a5fa', fontSize: '0.9rem' }} />
                                <Typography sx={{ color: '#93c5fd', fontSize: '0.6rem' }}>Vis</Typography>
                            </Box>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                                {weatherData.visibility.toFixed(1)} km
                            </Typography>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.55rem', textTransform: 'capitalize' }}>
                                {weatherData.weather_description.split(' ')[0]}
                            </Typography>
                        </Box>

                        {/* Humidity */}
                        <Box
                            sx={{
                                flex: 1,
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                                <WaterDropIcon sx={{ color: '#60a5fa', fontSize: '0.9rem' }} />
                                <Typography sx={{ color: '#93c5fd', fontSize: '0.6rem' }}>Humid</Typography>
                            </Box>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                                {weatherData.humidity}%
                            </Typography>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.55rem' }}>
                                ☁️ {weatherData.clouds}%
                            </Typography>
                        </Box>
                    </>
                ) : (
                    <Box sx={{
                        flex: 1,
                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                        border: '1px solid rgba(107, 114, 128, 0.3)',
                        borderRadius: '6px',
                        padding: 1,
                        textAlign: 'center',
                    }}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
                            Waiting for drone data...
                        </Typography>
                    </Box>
                )}
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
                        backgroundColor: '#3b82f6',
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
                    const droneColor = getColorHex(drone.color);
                    const objectiveColor = getObjectiveColor(drone.objective);
                    const recentlyUpdated = isRecentlyUpdated(drone);

                    return (
                        <Box
                            key={drone.updateId || drone.id}
                            onClick={() => handleDroneCardClick(drone.codeName)}
                            sx={{
                                backgroundColor: recentlyUpdated
                                    ? 'rgba(59, 130, 246, 0.25)'
                                    : 'rgba(59, 130, 246, 0.1)',
                                border: `1px solid ${recentlyUpdated ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.3)'}`,
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
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.5)',
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
                                        backgroundColor: '#3b82f6',
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
                                    {drone.codeName}
                                </Typography>
                                <Chip
                                    label={drone.objective}
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

                            {/* Group & Mission Info */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <Chip
                                    label={`Group ${drone.groupId}`}
                                    size="small"
                                    sx={{
                                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                        color: '#93c5fd',
                                        fontSize: '0.65rem',
                                        height: '20px',
                                    }}
                                />
                                {drone.mission && (
                                    <Chip
                                        label={drone.mission}
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(147, 197, 253, 0.2)',
                                            color: '#93c5fd',
                                            fontSize: '0.65rem',
                                            height: '20px',
                                            textTransform: 'capitalize',
                                        }}
                                    />
                                )}
                            </Box>

                            <Typography sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '0.85rem',
                                mb: 0.5,
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <GpsFixedIcon sx={{ fontSize: '1rem', mr: 0.75, color: '#3b82f6' }} />
                                {Number(drone.lat).toFixed(6)}, {Number(drone.lng).toFixed(6)}
                            </Typography>

                            {drone.speed !== undefined && (
                                <Typography sx={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '0.85rem',
                                    mb: 0.5,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <SpeedIcon sx={{ fontSize: '1rem', mr: 0.75, color: '#60a5fa' }} />
                                    {formatSpeed(drone.speed)} m/s
                                </Typography>
                            )}

                            {drone.alt !== undefined && (
                                <Typography sx={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '0.85rem',
                                    mb: 0.5,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <HeightIcon sx={{ fontSize: '1rem', mr: 0.75, color: '#93c5fd' }} />
                                    {drone.alt.toFixed(1)} m
                                </Typography>
                            )}

                            {drone.target && (
                                <Typography sx={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '0.75rem',
                                    mt: 1,
                                    fontStyle: 'italic',
                                }}>
                                    🎯 Target: {drone.target}
                                </Typography>
                            )}

                            {drone.createdAt && (
                                <Typography sx={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '0.75rem',
                                    mt: 1,
                                    fontStyle: 'italic',
                                }}>
                                    Time: {formatThaiDateTime(drone.createdAt)}
                                </Typography>
                            )}

                            <Typography sx={{
                                color: 'rgba(96, 165, 250, 0.8)',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                mt: 1,
                                textAlign: 'right',
                            }}>
                                Click to locate →
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}