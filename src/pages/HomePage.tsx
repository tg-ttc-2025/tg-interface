import { Button, Stack, Box, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Dashboard, Security, Flight } from '@mui/icons-material';

export default function HomePage() {
  const navigate = useNavigate();
  
  const handleNavigateToDashboard = () => {
    navigate('/integration');
  };

  const handleNavigateToOffense = () => {
    navigate('/offense');
  };

  const handleNavigateToDefense = () => {
    navigate('/defense');
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        overflow: 'auto',
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: 'center',
            color: 'white',
            mb: 6,
          }}
        >
          {/* Logo */}
          <Box
            component="img"
            src="https://cdn.discordapp.com/attachments/1437110414948171807/1437489635776397332/Tactical.jpg?ex=691416cc&is=6912c54c&hm=30a0836d84e6ee00eb28ee1b0b3fcfed9784adb85c19ddfcd78eb94f0d0f6de6&"
            alt="Tactical Logo"
            sx={{
              width: 120,
              height: 120,
              borderRadius: '16px',
              margin: '0 auto 24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          />

          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              background: 'linear-gradient(45deg, #60a5fa 30%, #2563eb 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Tactical Command Center
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 6,
              fontWeight: 400,
            }}
          >
            Drone Command & Control System
          </Typography>
        </Box>

        {/* Buttons */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={3} 
          justifyContent="center"
          alignItems="center"
        >
          <Button
            variant="contained"
            size="large"
            startIcon={<Dashboard />}
            onClick={handleNavigateToDashboard}
            sx={{
              minWidth: 200,
              height: 60,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #2563eb 30%, #1d4ed8 90%)',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1d4ed8 30%, #1e40af 90%)',
                boxShadow: '0 6px 30px rgba(37, 99, 235, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s',
            }}
          >
            Main Dashboard
          </Button>

          <Button
            variant="contained"
            size="large"
            startIcon={<Flight />}
            onClick={handleNavigateToOffense}
            sx={{
              minWidth: 200,
              height: 60,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #dc2626 30%, #b91c1c 90%)',
              boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #b91c1c 30%, #991b1b 90%)',
                boxShadow: '0 6px 30px rgba(220, 38, 38, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s',
            }}
          >
            Offense Command
          </Button>

          <Button
            variant="contained"
            size="large"
            startIcon={<Security />}
            onClick={handleNavigateToDefense}
            sx={{
              minWidth: 200,
              height: 60,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #16a34a 30%, #15803d 90%)',
              boxShadow: '0 4px 20px rgba(22, 163, 74, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #15803d 30%, #166534 90%)',
                boxShadow: '0 6px 30px rgba(22, 163, 74, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s',
            }}
          >
            Defense Command
          </Button>
        </Stack>

        {/* Footer */}
        <Box
          sx={{
            mt: 8,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <Typography variant="body2">
            © 2025 Tactical of King Mongkut's Institute of Technology Ladkrabang. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}