import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import Navbar from "../component/defense/Navbar";
import Defense from "../component/integration/defense/Defense";
import MapComponent from "../component/map/MapComponent";
import { useDetections } from "../hooks/Defense/useDefenseDetection";
import { useSocket } from "../hooks/Socket/useSocket";
import type { DroneObject } from "../services/defenseDetectionService";


export default function DefensePage() {
    const [mapCenter, setMapCenter] = useState<[number, number]>([101.166279, 14.297567]);
    const [mapZoom, setMapZoom] = useState(13);
    const [allDrones, setAllDrones] = useState<DroneObject[]>([]);
    const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);

    const DEFENCE_LOCATION = '02999a4a-361c-498c-a250-d5d70dd39fb8';
    const DEFENCE_TOKEN = 'df2a423f93a9c512e1bc95ec29e1c44a843c71a3676aba595c891a8ce5e785a0';

    const { data: historyData } = useDetections(DEFENCE_LOCATION, DEFENCE_TOKEN, true);
    const { realtimeData } = useSocket(DEFENCE_LOCATION, true);

    // Initialize with historical data
    useEffect(() => {
        if (historyData?.objects) {
            console.log('Initial history data:', historyData.objects);
            setAllDrones(historyData.objects);
        }
    }, [historyData]);

    // Handle real-time updates - UPDATE existing drones or ADD new ones
    useEffect(() => {
        if (realtimeData?.objects) {
            console.log('Received real-time data:', realtimeData);
            
            setAllDrones((prevDrones) => {
                // Create a new array to ensure reference change
                const updatedDrones = [...prevDrones];
                
                realtimeData.objects.forEach((newDrone) => {
                    console.log('Processing drone:', newDrone.obj_id, 'at', newDrone.lat, newDrone.lng);
                    
                    const existingIndex = updatedDrones.findIndex(
                        (drone) => drone.obj_id === newDrone.obj_id
                    );
                    
                    if (existingIndex !== -1) {
                        // UPDATE existing drone
                        console.log('Updating existing drone:', newDrone.obj_id);
                        console.log('Old position:', updatedDrones[existingIndex].lat, updatedDrones[existingIndex].lng);
                        console.log('New position:', newDrone.lat, newDrone.lng);
                        
                        updatedDrones[existingIndex] = {
                            ...newDrone,
                            image: realtimeData.image || newDrone.image,
                            lastUpdated: Date.now()
                        };
                    } else {
                        // ADD new drone
                        console.log('Adding new drone:', newDrone.obj_id);
                        updatedDrones.unshift({
                            ...newDrone,
                            image: realtimeData.image || newDrone.image,
                            lastUpdated: Date.now()
                        });
                    }
                });
                
                // Sort by last updated
                const sorted = updatedDrones.sort((a, b) => {
                    const aTime = (a as any).lastUpdated || 0;
                    const bTime = (b as any).lastUpdated || 0;
                    return bTime - aTime;
                });
                
                console.log('Updated drones array:', sorted);
                return sorted;
            });
        }
    }, [realtimeData]);

    const handleMapMove = (lng: number, lat: number, zoom: number) => {
        // Optional: Update state when map moves
    };

    const handleDroneClick = (droneId: string) => {
        setSelectedDroneId(droneId);
        setTimeout(() => setSelectedDroneId(null), 2000);
    };

    // Debug: Log when allDrones changes
    useEffect(() => {
        console.log('allDrones state updated:', allDrones);
    }, [allDrones]);

    return (
        <Box sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <Navbar />
            
            {/* Map Layer with Drones */}
            <Box 
                sx={{ 
                    position: 'absolute',
                    top: '64px',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    margin: 0,
                    padding: 0,
                }}
            >
                <MapComponent 
                    center={mapCenter} 
                    zoom={mapZoom}
                    drones={allDrones}
                    selectedDroneId={selectedDroneId}
                    onMapMove={handleMapMove}
                />
            </Box>

            {/* Defense Panel Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '64px',
                    left: 0,
                    bottom: 0,
                    zIndex: 1000,
                }}
            >
                <Defense onDroneClick={handleDroneClick} />
            </Box>
        </Box>
    );
}