import { useState, useEffect, useRef } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Badge } from '@mui/material';
import { Settings, Notifications } from '@mui/icons-material';
import MapComponent from '../../map/MapComponent';
import { useCamera } from '../../../hooks/Camera/useCamera';
import Defense from '../defense/Defense';
import Offense from '../offense/Offense';

interface DroneData {
  id: number;
  longitude: number;
  latitude: number;
  name: string;
  type: 'ally' | 'enemy';
  speed: number;
  altitude: number;
  heading: number;
  location: string;
  token: string;
}

export default function Dashboard() {
    const [drones, setDrones] = useState<DroneData[]>([]);
    const [mapCenter, setMapCenter] = useState<[number, number]>([100.5231, 13.7563]);
    const [mapZoom, setMapZoom] = useState(13);
    const dronesDataRef = useRef<DroneData[]>([]);
    const animationFrameRef = useRef<number | undefined>(undefined);
    
    // Credentials
    const DEFENCE_LOCATION = '02999a4a-361c-498c-a250-d5d70dd39fb8';
    const DEFENCE_TOKEN = 'df2a423f93a9c512e1bc95ec29e1c44a843c71a3676aba595c891a8ce5e785a0';
    const OFFENCE_LOCATION = 'd5fd9af8-098a-4cfb-bf02-8e89026af5f6';
    const OFFENCE_TOKEN = '6e69670b-687d-439f-8c4e-b50dd087ce18';

    const { data } = useCamera(OFFENCE_LOCATION, OFFENCE_TOKEN);

  // Initial drones data
  const initialDrones: DroneData[] = [
    {
      id: 1,
      longitude: 100.5231,
      latitude: 13.7563,
      name: 'ALLY-01',
      type: 'ally',
      speed: 45,
      altitude: 120,
      heading: 45,
      location: DEFENCE_LOCATION,
      token: DEFENCE_TOKEN,
    },
    {
      id: 2,
      longitude: 100.5118,
      latitude: 13.7460,
      name: 'ALLY-02',
      type: 'ally',
      speed: 38,
      altitude: 95,
      heading: 180,
      location: DEFENCE_LOCATION,
      token: DEFENCE_TOKEN,
    },
    {
      id: 3,
      longitude: 100.5432,
      latitude: 13.7567,
      name: 'ENEMY-01',
      type: 'enemy',
      speed: 52,
      altitude: 150,
      heading: 270,
      location: OFFENCE_LOCATION,
      token: OFFENCE_TOKEN,
    },
    {
      id: 4,
      longitude: 100.5350,
      latitude: 13.7400,
      name: 'ENEMY-02',
      type: 'enemy',
      speed: 48,
      altitude: 180,
      heading: 90,
      location: OFFENCE_LOCATION,
      token: OFFENCE_TOKEN,
    },
  ];

  // Function to update drone position
  const updateDronePosition = (drone: DroneData, deltaTime: number): DroneData => {
    const speedInDegreesPerSecond = (drone.speed / 111000) * deltaTime;
    const headingRad = (drone.heading * Math.PI) / 180;
    
    const newLongitude = drone.longitude + speedInDegreesPerSecond * Math.sin(headingRad);
    const newLatitude = drone.latitude + speedInDegreesPerSecond * Math.cos(headingRad);
    
    const headingChange = (Math.random() - 0.5) * 10;
    let newHeading = drone.heading + headingChange;
    if (newHeading < 0) newHeading += 360;
    if (newHeading >= 360) newHeading -= 360;

    const bounds = {
      minLng: 100.48,
      maxLng: 100.58,
      minLat: 13.72,
      maxLat: 13.78,
    };

    let finalLng = newLongitude;
    let finalLat = newLatitude;
    let finalHeading = newHeading;

    if (newLongitude < bounds.minLng || newLongitude > bounds.maxLng) {
      finalLng = drone.longitude;
      finalHeading = (drone.heading + 180) % 360;
    }
    if (newLatitude < bounds.minLat || newLatitude > bounds.maxLat) {
      finalLat = drone.latitude;
      finalHeading = (drone.heading + 180) % 360;
    }

    return {
      ...drone,
      longitude: finalLng,
      latitude: finalLat,
      heading: finalHeading,
    };
  };

  // Initialize drones and start animation
  useEffect(() => {
    dronesDataRef.current = [...initialDrones];
    setDrones(initialDrones);

    let lastTime = Date.now();
    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      dronesDataRef.current = dronesDataRef.current.map(drone => 
        updateDronePosition(drone, deltaTime)
      );

      setDrones([...dronesDataRef.current]);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleDroneClick = (longitude: number, latitude: number) => {
    setMapCenter([longitude, latitude]);
    setMapZoom(16);
  };

  const handleMapMove = (lng: number, lat: number, zoom: number) => {
    // Optional: Update state when map moves
  };

  // Get current time
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
          {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 4, ml:4}}>
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
            variant="h5"
            sx={{
              flexGrow: 1,
              fontWeight: 500,
              color: 'white',
              letterSpacing: '1px',
            }}
          >
            TTC Command Post Visualization"
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

          {/* Icons */}
          <IconButton sx={{ color: 'white', mr: 1, border:2, borderRadius:'10px', bgcolor:'#404040'}}>
            <Settings />
          </IconButton>
          <IconButton sx={{ color: 'white', mr: 1, border:2, borderRadius:'10px', bgcolor:'#404040'}}>
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: '#2563eb',
            }}
          />
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box 
        sx={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          margin: 0,
          padding: 0,
        }}
      >
        {/* Left Panel - Allies
        <Offense /> */}

        {/* Center - Map */}
        <Box sx={{ flex: 1, position: 'relative', margin: 0, padding: 0 }}>
          <MapComponent 
            center={mapCenter} 
            zoom={mapZoom}
            onMapMove={handleMapMove}
          />
        </Box>

        {/* Right Panel - Enemy */}
          {/* <Defense 
                        allDrones={allDrones}
                        onDroneClick={handleDroneClick}
                    /> */}
      </Box>
    </Box>
  );
}