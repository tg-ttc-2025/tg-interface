import { Box, Paper, Typography, Avatar, TextField, InputAdornment } from '@mui/material';
import { Search, Hub } from '@mui/icons-material';

interface DroneData {
  id: number;
  longitude: number;
  latitude: number;
  name: string;
  type: 'ally' | 'enemy';
  speed: number;
  altitude: number;
  heading: number;
}

interface EnemyProps {
  drones: DroneData[];
  onDroneClick: (longitude: number, latitude: number) => void;
}

export default function Enemy({ drones, onDroneClick }: EnemyProps) {
  const enemyDrones = drones.filter(d => d.type === 'enemy');

  return (
    <Box
      sx={{
        width: '280px',
        height: '100vh',
        backgroundColor: '#1a1a2e',
        borderLeft: '3px solid #dc2626',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: 3,
          borderBottom: '2px solid rgba(220, 38, 38, 0.3)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
          <Avatar
            sx={{
              width: 50,
              height: 50,
              backgroundColor: '#dc2626',
            }}
          >
            <Hub sx={{ fontSize: 30 }} />
          </Avatar>
          <Box>
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
              ENEMY THREATS
            </Typography>
          </Box>
        </Box>

        {/* Search Box */}
        <TextField
          placeholder="Search by Drone ID..."
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#f87171' }} />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(220, 38, 38, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(220, 38, 38, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#dc2626',
              },
            },
          }}
          sx={{
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(255, 255, 255, 0.5)',
              opacity: 1,
            },
          }}
        />
      </Box>

      {/* Drones List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: 2,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#dc2626',
            borderRadius: '3px',
          },
        }}
      >
        {enemyDrones.map((drone) => (
          <Paper
            key={drone.id}
            onClick={() => onDroneClick(drone.longitude, drone.latitude)}
            sx={{
              padding: 2,
              marginBottom: 2,
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                backgroundColor: 'rgba(220, 38, 38, 0.2)',
                borderColor: '#dc2626',
                transform: 'translateX(-5px)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, marginBottom: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 10px #ef4444',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': {
                      opacity: 1,
                    },
                    '50%': {
                      opacity: 0.5,
                    },
                  },
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#f87171',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {drone.name}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Speed:
                </Typography>
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                  {drone.speed} km/h
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Altitude:
                </Typography>
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                  {drone.altitude} m
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Heading:
                </Typography>
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                  {drone.heading.toFixed(0)}°
                </Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Footer - Drone Count */}
      <Box
        sx={{
          padding: 2,
          borderTop: '2px solid rgba(220, 38, 38, 0.3)',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#f87171',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          🔴 {enemyDrones.length} Enemy Threats Detected
        </Typography>
      </Box>
    </Box>
  );
}