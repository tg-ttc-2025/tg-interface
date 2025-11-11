import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { MyLocation, Hub } from '@mui/icons-material';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhdGNoYWxlcm0iLCJhIjoiY21nZnpiYzU3MGRzdTJrczlkd3RxamN4YyJ9.k288gnCNLdLgczawiB79gQ';

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

export default function DroneMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const dronesDataRef = useRef<DroneData[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  const [lng, setLng] = useState(100.5231);
  const [lat, setLat] = useState(13.7563);
  const [zoom, setZoom] = useState(13);
  const [drones, setDrones] = useState<DroneData[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
    },
  ];

  // Function to create drone icon as HTML element using MUI HubIcon
  const createDroneElement = (type: 'ally' | 'enemy', heading: number): HTMLDivElement => {
    const el = document.createElement('div');
    const color = type === 'ally' ? '#2563eb' : '#dc2626';
    
    // Create MUI Hub icon as drone representation
    el.innerHTML = `
      <div style="
        width: 48px; 
        height: 48px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        transform: rotate(${heading}deg);
        transition: transform 0.3s ease;
      ">
        <svg style="width: 48px; height: 48px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));" viewBox="0 0 24 24" fill="${color}">
          <path d="M17,12L12,2L7,12L2,7V17L7,12L12,22L17,12L22,17V7L17,12Z" stroke="white" stroke-width="0.5"/>
        </svg>
      </div>
    `;
    
    el.style.cursor = 'pointer';
    
    return el;
  };

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

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('Initializing map...');

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      console.log('Map loaded!');
      setIsMapLoaded(true);
      
      dronesDataRef.current = [...initialDrones];
      setDrones(initialDrones);

      console.log('Adding drones:', initialDrones);

      // Create initial markers
      initialDrones.forEach((drone) => {
        if (!map.current) return;

        console.log(`Creating marker for ${drone.name} at [${drone.longitude}, ${drone.latitude}]`);

        const el = createDroneElement(drone.type, drone.heading);

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
        }).setHTML(
          `
          <div style="padding: 8px; min-width: 180px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${
              drone.type === 'ally' ? '#2563eb' : '#dc2626'
            };">
              ${drone.name}
            </h3>
            <p style="margin: 4px 0; font-size: 13px; color: #4a5568;">
              <strong>Type:</strong> ${drone.type === 'ally' ? '🔵 Allied Drone' : '🔴 Enemy Drone'}
            </p>
            <p style="margin: 4px 0; font-size: 13px; color: #4a5568;">
              <strong>Speed:</strong> ${drone.speed} km/h
            </p>
            <p style="margin: 4px 0; font-size: 13px; color: #4a5568;">
              <strong>Altitude:</strong> ${drone.altitude} m
            </p>
            <p style="margin: 4px 0; font-size: 13px; color: #4a5568;">
              <strong>Heading:</strong> ${drone.heading.toFixed(0)}°
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #718096;">
              ${drone.latitude.toFixed(5)}, ${drone.longitude.toFixed(5)}
            </p>
          </div>
          `
        );

        const marker = new mapboxgl.Marker(el)
          .setLngLat([drone.longitude, drone.latitude])
          .setPopup(popup)
          .addTo(map.current);

        markersRef.current.set(drone.id, marker);
        console.log(`Marker added for ${drone.name}`);
      });

      console.log('Total markers created:', markersRef.current.size);

      // Start animation loop
      let lastTime = Date.now();
      const animate = () => {
        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        dronesDataRef.current = dronesDataRef.current.map(drone => {
          const updatedDrone = updateDronePosition(drone, deltaTime);
          
          const marker = markersRef.current.get(drone.id);
          if (marker) {
            marker.setLngLat([updatedDrone.longitude, updatedDrone.latitude]);
            
            // Update icon rotation
            const el = marker.getElement();
            const svgContainer = el.querySelector('div') as HTMLDivElement;
            if (svgContainer) {
              svgContainer.style.transform = `rotate(${updatedDrone.heading}deg)`;
            }
            
            const popup = marker.getPopup();
            if (popup && popup.isOpen()) {
              popup.setHTML(
                `
                <div style="padding: 8px; min-width: 180px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${
                    updatedDrone.type === 'ally' ? '#2563eb' : '#dc2626'
                  };">
                    ${updatedDrone.name}
                  </h3>
                  <p style="margin: 4px 0; font-size: 13px; color: #4a5568;">
                    <strong>Type:</strong> ${updatedDrone.type === 'ally' ? '🔵 Allied Drone' : '🔴 Enemy Drone'}
                  </p>
                  <p style="margin: 4px 0; font-size: 13px; color: #4a5568;">
                    <strong>Speed:</strong> ${updatedDrone.speed} km/h
                  </p>
                  <p style="margin: 4px 0; font-size: 13px; color: #4a5568;">
                    <strong>Altitude:</strong> ${updatedDrone.altitude} m
                  </p>
                  <p style="margin: 4px 0; font-size: 13px; color: #4a5568;">
                    <strong>Heading:</strong> ${updatedDrone.heading.toFixed(0)}°
                  </p>
                  <p style="margin: 4px 0; font-size: 12px; color: #718096;">
                    ${updatedDrone.latitude.toFixed(5)}, ${updatedDrone.longitude.toFixed(5)}
                  </p>
                </div>
                `
              );
            }
          }
          
          return updatedDrone;
        });

        setDrones([...dronesDataRef.current]);
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    });

    map.current.on('move', () => {
      if (map.current) {
        setLng(Number(map.current.getCenter().lng.toFixed(4)));
        setLat(Number(map.current.getCenter().lat.toFixed(4)));
        setZoom(Number(map.current.getZoom().toFixed(2)));
      }
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const flyToLocation = (longitude: number, latitude: number) => {
    if (map.current) {
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        duration: 2000,
        essential: true,
      });
    }
  };

  const alliedDrones = drones.filter(d => d.type === 'ally');
  const enemyDrones = drones.filter(d => d.type === 'enemy');

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100vh' }}>
      <Box
        ref={mapContainer}
        sx={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* Debug Info */}
      {!isMapLoaded && (
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: 3,
            zIndex: 1000,
          }}
        >
          <Typography variant="h6">Loading map...</Typography>
        </Paper>
      )}

      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          padding: 2,
          minWidth: 200,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 1,
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          <MyLocation color="primary" />
          Map Info
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Longitude: {lng}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Latitude: {lat}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Zoom: {zoom}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Drones: {drones.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Map Loaded: {isMapLoaded ? 'Yes' : 'No'}
        </Typography>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          padding: 2,
          maxWidth: 320,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 1,
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: 2,
          }}
        >
          <Hub color="primary" />
          Drone Tracking
        </Typography>

        {/* Allied Drones */}
        <Box sx={{ marginBottom: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#2563eb', fontWeight: 600, marginBottom: 1 }}>
            🔵 Allied Drones ({alliedDrones.length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {alliedDrones.map((drone) => (
              <Chip
                key={drone.id}
                label={`${drone.name} - ${drone.speed} km/h`}
                onClick={() => flyToLocation(drone.longitude, drone.latitude)}
                sx={{
                  justifyContent: 'flex-start',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  '&:hover': {
                    opacity: 0.85,
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s',
                }}
                icon={<Hub sx={{ color: 'white !important' }} />}
              />
            ))}
          </Box>
        </Box>

        {/* Enemy Drones */}
        <Box>
          <Typography variant="subtitle2" sx={{ color: '#dc2626', fontWeight: 600, marginBottom: 1 }}>
            🔴 Enemy Drones ({enemyDrones.length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {enemyDrones.map((drone) => (
              <Chip
                key={drone.id}
                label={`${drone.name} - ${drone.speed} km/h`}
                onClick={() => flyToLocation(drone.longitude, drone.latitude)}
                sx={{
                  justifyContent: 'flex-start',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  '&:hover': {
                    opacity: 0.85,
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s',
                }}
                icon={<Hub sx={{ color: 'white !important' }} />}
              />
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}