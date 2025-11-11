import { Box, Paper, Typography, Avatar, TextField, InputAdornment } from '@mui/material';
import { Search} from '@mui/icons-material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';

export default function Offense() {

  return (
    <Box
      sx={{
        width: '300px',
        height: '100vh',
        backgroundColor: '#121212',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: 3,
          borderLeft: '8px solid #00BFFF',
          bgcolor:'#0E3441',
          borderBottom: '2px solid #404040',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 50,
              height: 50,
              backgroundColor: '#2563eb',
            }}
          >
            <GpsFixedIcon sx={{ fontSize: 30 }} />
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
              OFFENSE
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#60a5fa',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              OUR DRONES
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}