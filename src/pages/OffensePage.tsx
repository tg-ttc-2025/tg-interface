import { Box, Button, Switch, FormControlLabel } from '@mui/material'; // Import Switch and FormControlLabel
import { useState, useEffect, useMemo } from 'react';

import { useSocket } from '../hooks/Socket/useSocket';
import { useDetections } from '../hooks/Defense/useDefenseDetection';
import type { DroneObject } from '../services/defenseDetectionService';
import Defense from '../component/integration/defense/Defense';
import MapComponent from '../component/map/MapComponent';
import Navbar from '../component/defense/Navbar';
import Offense from '../component/integration/offense/Offense';
import MapOffenseComponent from '../component/map/MapOffenseComponent';

interface DroneUpdate extends DroneObject {
    updateId: string;
    lastUpdated: number;
}

export default function OffensePage() {
    const OFFENSE_LOCATION = 'd5fd9af8-098a-4cfb-bf02-8e89026af5f6';
    const OFFENSE_TOKEN = '6e69670b-687d-439f-8c4e-b50dd087ce18';

    const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
    const [allDrones, setAllDrones] = useState<DroneUpdate[]>([]);
    const [isStarted, setIsStarted] = useState(true);
    const [showRoutes, setShowRoutes] = useState(true); // Initial state is true
    
    const [mapState, setMapState] = useState({
        center: [100.5018, 13.7563] as [number, number],
        zoom: 13,
    });

    const { data: historyData, isLoading, error } = useDetections(
        OFFENSE_LOCATION,
        OFFENSE_TOKEN,
        isStarted
    );

    const { realtimeData, isConnected } = useSocket(OFFENSE_LOCATION, isStarted);

    // Initialize with historical data
    useEffect(() => {
        if (historyData?.objects) {
            const dronesWithUpdateId = historyData.objects.map((drone) => ({
                ...drone,
                updateId: `${drone.obj_id}-${Date.now()}-init`,
                lastUpdated: Date.now()
            }));
            setAllDrones(dronesWithUpdateId);
        }
    }, [historyData]);

    // Handle real-time updates
    useEffect(() => {
        if (realtimeData?.objects && realtimeData.objects.length > 0) {
            console.log('Received real-time data:', realtimeData);
            
            setAllDrones((prev) => {
                const newCards = realtimeData.objects.map((drone) => ({
                    ...drone,
                    image: realtimeData.image,
                    updateId: `${drone.obj_id}-${Date.now()}-${Math.random()}`,
                    lastUpdated: Date.now()
                }));
                
                console.log('Updated drones array:', [...newCards, ...prev]);
                return [...newCards, ...prev];
            });
        }
    }, [realtimeData]);

    // Debug: Log state changes
    useEffect(() => {
        console.log('allDrones state updated:', allDrones);
    }, [allDrones]);

    // Group updates by obj_id for route visualization
    const droneRoutes = useMemo(() => {
        const routes = new Map<string, DroneUpdate[]>();
        
        allDrones.forEach((drone) => {
            if (!routes.has(drone.obj_id)) {
                routes.set(drone.obj_id, []);
            }
            routes.get(drone.obj_id)!.push(drone);
        });
        
        // Sort each route by timestamp (oldest first)
        routes.forEach((updates, objId) => {
            updates.sort((a, b) => a.lastUpdated - b.lastUpdated);
        });
        
        console.log('Drone routes computed:', routes);
        return routes;
    }, [allDrones]);

    // Get latest position for each drone
    const latestDrones = useMemo(() => {
        const latest = new Map<string, DroneUpdate>();
        
        allDrones.forEach((drone) => {
            const existing = latest.get(drone.obj_id);
            if (!existing || drone.lastUpdated > existing.lastUpdated) {
                latest.set(drone.obj_id, drone);
            }
        });
        
        const result = Array.from(latest.values());
        console.log('Latest drones computed:', result);
        return result;
    }, [allDrones]);

    const handleDroneClick = (droneId: string) => {
        console.log('Drone clicked:', droneId);
        setSelectedDroneId(droneId);
    };

    const handleMapMove = (lng: number, lat: number, zoom: number) => {
        setMapState({
            center: [lng, lat],
            zoom: zoom,
        });
    };

    // Handler for the Switch component
    const handleRouteToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setShowRoutes(event.target.checked);
    };

    return (
        <>
        <Box sx={{
            marginTop:'67px'
        }}>
            <Navbar />
        </Box>
        <Box sx={{position: 'relative' ,display: 'flex', width: '100vw', height: '90vh', overflow: 'hidden' }}>

            <Offense 
                allDrones={allDrones}
                onDroneClick={handleDroneClick}
            />
            
            {/* Route Toggle Switch */}
            <Box sx={{ position: 'absolute', top: 20, left: 470, zIndex: 1000, 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                borderRadius: '8px', 
                padding: '4px 12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={showRoutes}
                            onChange={handleRouteToggle}
                            name="routeToggle"
                        />
                    }
                    label="Drone Routes"
                    sx={{
                        '& .MuiTypography-root': {
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: '#1f2937', // Dark text color
                        }
                    }}
                />
            </Box>

            <Box sx={{ flex: 1, position: 'relative' }}>
                {/* <MapOffenseComponent
                    center={mapState.center}
                    zoom={mapState.zoom}
                    drones={latestDrones}
                    droneRoutes={showRoutes ? droneRoutes : undefined}
                    selectedDroneId={selectedDroneId}
                    onMapMove={handleMapMove}
                /> */}
            </Box>
        </Box>
        </>
    );
}