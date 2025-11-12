import { Box, Button, Switch, FormControlLabel, Tabs, Tab } from '@mui/material';
import { useState, useEffect, useMemo } from 'react';
import TGDefense from '../component/integration/defense/TGDefense';
import TGHistory from '../component/integration/defense/TGHistory';
import MapComponent from '../component/map/MapComponent';
import Navbar from '../component/defense/Navbar';
import { useTGDetections } from '../hooks/Defense/useTGDefenseDetection';
import { useTGSocket } from '../hooks/Socket/useTGSocket';
import type { DroneUpdate } from '../types/drone.type';

export default function TGDefensePage() {
    const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
    
    const [liveFeed, setLiveFeed] = useState<DroneUpdate[]>([]);
    const [historyData, setHistoryData] = useState<DroneUpdate[]>([]);
    
    const [isStarted, setIsStarted] = useState(true);
    const [showRoutes, setShowRoutes] = useState(true);
    const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
    
    const [historyFilterObjId, setHistoryFilterObjId] = useState<string | null>(null);
    
    const [mapState, setMapState] = useState({
        center: [100.5018, 13.7563] as [number, number],
        zoom: 13,
    });

    const { data: historyDataFromAPI, isLoading, error, refetch } = useTGDetections(true, 500);

    // Connect to TG-SYSTEM WebSocket
    const { realtimeData, isConnected, error: socketError } = useTGSocket(isStarted);

    // Helper function to add raw data to drone objects
    const enrichDroneWithRawData = (drone: any, source: 'api' | 'websocket'): DroneUpdate => {
        // For API data, we should have full TGDetectionObject
        if (source === 'api' && drone.rawDetection) {
            return {
                ...drone,
                updateId: `${drone.obj_id}-${Date.now()}-hist`,
                lastUpdated: Date.now(),
                rawData: {
                    id: drone.rawDetection.id,
                    alt: drone.rawDetection.alt?.toString(),
                    groundHeight: drone.rawDetection.groundHeight,
                    timestamp: drone.rawDetection.timestamp,
                    createdAt: drone.rawDetection.createdAt,
                    updatedAt: drone.rawDetection.updatedAt,
                    images: drone.rawDetection.images.map((img: any) => ({
                        id: img.id,
                        fileName: img.fileName,
                        fileSize: img.fileSize.toString(),
                        mimeType: img.mimeType,
                        isPrimary: img.isPrimary,
                        publicUrl: img.publicUrl || '',
                    })),
                },
            };
        }
        
        // For WebSocket data, we might not have all raw data
        // But we can still include what we have
        return {
            ...drone,
            updateId: `${drone.obj_id}-${Date.now()}-${Math.random()}`,
            lastUpdated: Date.now(),
            rawData: drone.rawData || undefined,
        };
    };

    useEffect(() => {
        if (historyDataFromAPI && historyDataFromAPI.length > 0) {
            console.log('Loading historical data:', historyDataFromAPI.length, 'detections');
            const dronesWithUpdateId = historyDataFromAPI.map((drone) => 
                enrichDroneWithRawData(drone, 'api')
            );
            setHistoryData(dronesWithUpdateId);
        }
    }, [historyDataFromAPI]);

    // Handle real-time updates from WebSocket
    useEffect(() => {
        if (realtimeData?.objects && realtimeData.objects.length > 0) {
            console.log('Received real-time data:', realtimeData);
            
            setLiveFeed((prev) => {
                const newDetections = realtimeData.objects.map((drone) => 
                    enrichDroneWithRawData(drone, 'websocket')
                );
                
                console.log('Adding to live feed:', newDetections.length);
                const updated = [...newDetections, ...prev];
                return updated.slice(0, 100);
            });

            setHistoryData((prev) => {
                const newDetections = realtimeData.objects.map((drone) => 
                    enrichDroneWithRawData(drone, 'websocket')
                );
                return [...newDetections, ...prev];
            });
        }
    }, [realtimeData]);

    const filteredHistoryData = useMemo(() => {
        if (!historyFilterObjId) {
            console.log('📋 Showing all history:', historyData.length, 'records');
            return historyData;
        }
        
        const filtered = historyData.filter(d => d.obj_id === historyFilterObjId);
        console.log(`Filtered history for "${historyFilterObjId}":`, filtered.length, 'records');
        return filtered;
    }, [historyData, historyFilterObjId]);

    const displayedDrones = useMemo(() => {
        if (activeTab === 'live') {
            return liveFeed;
        } else {
            return filteredHistoryData;
        }
    }, [activeTab, liveFeed, filteredHistoryData]);

    const droneRoutes = useMemo(() => {
        const routes = new Map<string, DroneUpdate[]>();
        
        displayedDrones.forEach((drone) => {
            if (!routes.has(drone.obj_id)) {
                routes.set(drone.obj_id, []);
            }
            routes.get(drone.obj_id)!.push(drone);
        });
        
        routes.forEach((updates) => {
            updates.sort((a, b) => a.lastUpdated - b.lastUpdated);
        });
        
        console.log('Drone routes computed:', routes.size, 'unique drones');
        return routes;
    }, [displayedDrones]);

    const latestDrones = useMemo(() => {
        const latest = new Map<string, DroneUpdate>();
        
        displayedDrones.forEach((drone) => {
            const existing = latest.get(drone.obj_id);
            if (!existing || drone.lastUpdated > existing.lastUpdated) {
                latest.set(drone.obj_id, drone);
            }
        });
        
        const result = Array.from(latest.values());
        console.log('📍 Latest positions:', result.length, 'drones');
        console.log('Sample drone data:', result[0]); // Debug log
        return result;
    }, [displayedDrones]);

    const handleDroneClick = (droneId: string) => {
        console.log('🎯 Drone clicked:', droneId);
        setSelectedDroneId(droneId);
    };

    const handleMapMove = (lng: number, lat: number, zoom: number) => {
        setMapState({
            center: [lng, lat],
            zoom: zoom,
        });
    };

    const handleRouteToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setShowRoutes(event.target.checked);
        console.log('🛤️ Route visibility:', event.target.checked);
    };

    const handleStartStop = () => {
        setIsStarted(prev => !prev);
        console.log('⚡ Detection system:', !isStarted ? 'STARTED' : 'STOPPED');
    };

    const handleClearLiveFeed = () => {
        setLiveFeed([]);
        console.log('🧹 Live feed cleared');
    };

    const handleRefreshHistory = () => {
        refetch();
        console.log('🔄 Refreshing history...');
    };

    const handleHistorySelect = (objId: string | null) => {
        console.log('History filter changed to:', objId || 'ALL');
        setHistoryFilterObjId(objId);
    };

    const handleClearHistoryFilters = () => {
        console.log('🧹 Clearing history filters');
        setHistoryFilterObjId(null);
    };

    return (
        <>
        <Box sx={{ marginTop: '67px' }}>
            <Navbar />
        </Box>
        <Box sx={{ position: 'relative', display: 'flex', width: '100vw', height: '90vh', overflow: 'hidden' }}>

            {/* Sidebar with Tabs */}
            <Box sx={{ 
                width: '450px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(18, 18, 18, 0.95)',
            }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{
                        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        '& .MuiTab-root': {
                            color: 'rgba(255, 255, 255, 0.5)', 
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        },
                        '& .Mui-selected': {
                            color: 'white !important', 
                            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: activeTab === 'live' ? '#dc2626' : '#3b82f6',
                            height: 3,
                        },
                    }}
                >
                    <Tab label="Live Feed" value="live" /> 
                    <Tab label="History" value="history" />
                </Tabs>

                {/* Content based on active tab */}
                {activeTab === 'live' ? (
                    <TGDefense 
                        allDrones={liveFeed}
                        onDroneClick={handleDroneClick}
                        isConnected={isConnected}
                    />
                ) : (
                    <TGHistory
                        allHistory={historyData}
                        onHistorySelect={handleHistorySelect}
                        onClearFilters={handleClearHistoryFilters}
                        isLoading={isLoading}
                    />
                )}
            </Box>
            
            {/* Control Panel */}
            <Box sx={{ 
                position: 'absolute', 
                top: 20, 
                left: 470, 
                zIndex: 1000,
                display: 'flex',
            }}>
                {/* Route Toggle Switch */}
                <Box sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    padding: '4px 12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showRoutes}
                                onChange={handleRouteToggle}
                                name="routeToggle"
                                color='error'
                            />
                        }
                        label="Route Line"
                        sx={{
                            '& .MuiTypography-root': {
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                color: '#1f2937',
                            }
                        }}
                    />
                </Box>

                {/* Start/Stop Button */}
                <Button
                    variant="contained"
                    onClick={handleStartStop}
                    sx={{
                        backgroundColor: isStarted ? '#dc2626' : '#22c55e',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        padding: '8px 20px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        '&:hover': {
                            backgroundColor: isStarted ? '#b91c1c' : '#16a34a',
                        }
                    }}
                >
                    {isStarted ? '⏸ PAUSE' : '▶ START'}
                </Button>

                {/* Clear Live Feed / Refresh History */}
                {activeTab === 'live' ? (
                    <Button
                        variant="contained"
                        onClick={handleClearLiveFeed}
                        sx={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            padding: '8px 20px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            '&:hover': {
                                backgroundColor: '#4b5563',
                            }
                        }}
                    >
                        CLEAR
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={handleRefreshHistory}
                        sx={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            padding: '8px 20px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            '&:hover': {
                                backgroundColor: '#2563eb',
                            }
                        }}
                    >
                        🔄 REFRESH
                    </Button>
                )}
            </Box>

            {/* Loading/Error States */}
            {isLoading && activeTab === 'history' && (
                <Box sx={{
                    position: 'absolute',
                    top: 80,
                    left: 470,
                    zIndex: 999,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                }}>
                    Loading historical data...
                </Box>
            )}

            {(error || socketError) && (
                <Box sx={{
                    position: 'absolute',
                    top: 80,
                    left: 470,
                    zIndex: 999,
                    backgroundColor: 'rgba(220, 38, 38, 0.9)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    maxWidth: '300px',
                }}>
                    ⚠️ {error?.toString() || socketError}
                </Box>
            )}

            <Box sx={{ flex: 1, position: 'relative' }}>
                <MapComponent
                    center={mapState.center}
                    zoom={mapState.zoom}
                    drones={latestDrones}
                    droneRoutes={showRoutes ? droneRoutes : undefined}
                    selectedDroneId={selectedDroneId}
                    onMapMove={handleMapMove}
                />
            </Box>
        </Box>
        </>
    );
}