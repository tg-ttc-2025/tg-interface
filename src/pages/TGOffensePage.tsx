import { Box, Button, Switch, FormControlLabel, Tabs, Tab } from '@mui/material';
import { useState, useMemo } from 'react';
import Navbar from '../component/defense/Navbar';
import MapOffenseComponent from '../component/map/MapOffenseComponent';
import TGOffense from '../component/integration/offense/TGOffense';

// --- Import Offense hooks and components ---
import { useOffenseSocket } from '../hooks/Socket/useOffenseSocket';
import { useOffenseMoveDetection } from '../hooks/Offense/useOffenseMoveDetection';
import type { OffenseMoveUpdate } from '../types/offenseMove.type';

import TGOffenseHistory from '../component/integration/offense/TGOffenseHistory'; 

// This helper type now matches the strict requirements of the map
type ValidOffenseDrone = Omit<OffenseMoveUpdate, 'size' | 'updateId' | 'color' | 'lastUpdated' | 'speed'> & { 
  size: number; 
  updateId: string;
  color: string;
  lastUpdated: number;
  speed: number;
};

export default function TGOffensePage() {
    // --- State ---
    const [selectedOffenseCodeName, setSelectedOffenseCodeName] = useState<string | null>(null);
    const [showRoutes, setShowRoutes] = useState(true);
    const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
    const [historyFilters, setHistoryFilters] = useState<{
        codeName: string | null;
        objective: string | null;
        groupId: string | null;
    }>({
        codeName: null,
        objective: null,
        groupId: null,
    });
    
    const [mapState, setMapState] = useState({
        center: [100.5018, 13.7563] as [number, number],
        zoom: 13,
    });

    // --- Data Hooks ---
    // 1. OFFENSE Live Feed (for Live Tab + Map)
    const { allDrones: offenseLiveDrones, isConnected: isOffenseSocketConnected } = useOffenseSocket();

    // 2. OFFENSE History (for History Tab)
    const { 
        data: offenseHistoryData, 
        isLoading: isHistoryLoading, 
        error: historyError, 
        refetch: refetchHistory 
    } = useOffenseMoveDetection(activeTab === 'history', 500);

    
    // --- Memos for Map Data ---

    // Type guard
    const isValidDrone = (drone: OffenseMoveUpdate): drone is ValidOffenseDrone => {
        return drone.size != null && 
               drone.updateId != null &&
               drone.color != null && 
               drone.lastUpdated != null &&
               drone.speed != null;
    };

    // LIVE Routes (for Live tab)
    const offenseLiveRoutes = useMemo(() => {
        const routes = new Map<string, OffenseMoveUpdate[]>();
        
        offenseLiveDrones.forEach((drone) => {
            if (!routes.has(drone.codeName)) {
                routes.set(drone.codeName, []);
            }
            routes.get(drone.codeName)!.push(drone);
        });

        const filteredRoutes = new Map<string, ValidOffenseDrone[]>();
        routes.forEach((updates, codeName) => {
            const validUpdates = updates.filter(isValidDrone); 
            
            if (validUpdates.length > 0) {
                validUpdates.sort((a, b) => a.lastUpdated - b.lastUpdated);
                filteredRoutes.set(codeName, validUpdates);
            }
        });
        
        return filteredRoutes;
    }, [offenseLiveDrones]);

    // HISTORY Routes (for History tab) - with filtering support
    const offenseHistoryRoutes = useMemo(() => {
        if (!offenseHistoryData || offenseHistoryData.length === 0) {
            return new Map<string, ValidOffenseDrone[]>();
        }

        // Apply filters
        let filteredData = offenseHistoryData;
        
        if (historyFilters.codeName) {
            filteredData = filteredData.filter(d => d.codeName === historyFilters.codeName);
        }
        if (historyFilters.objective) {
            filteredData = filteredData.filter(d => d.objective === historyFilters.objective);
        }
        if (historyFilters.groupId) {
            filteredData = filteredData.filter(d => d.groupId.toString() === historyFilters.groupId);
        }

        // Group by codeName
        const routes = new Map<string, OffenseMoveUpdate[]>();
        
        filteredData.forEach((drone) => {
            if (!routes.has(drone.codeName)) {
                routes.set(drone.codeName, []);
            }
            routes.get(drone.codeName)!.push(drone);
        });

        // Validate and sort
        const validRoutes = new Map<string, ValidOffenseDrone[]>();
        routes.forEach((updates, codeName) => {
            const validUpdates = updates.filter(isValidDrone); 
            
            if (validUpdates.length > 0) {
                validUpdates.sort((a, b) => a.lastUpdated - b.lastUpdated);
                validRoutes.set(codeName, validUpdates);
            }
        });
        
        return validRoutes;
    }, [offenseHistoryData, historyFilters]);

    // Latest drone positions (Live or History based on active tab)
    const latestOffenseDrones = useMemo(() => {
        const dataSource = activeTab === 'live' ? offenseLiveDrones : offenseHistoryData || [];
        
        const latest = new Map<string, any>();
        
        dataSource.forEach((drone) => {
            const existing = latest.get(drone.codeName);
            if (!existing || (drone.lastUpdated || 0) > (existing.lastUpdated || 0)) {
                latest.set(drone.codeName, drone);
            }
        });

        return Array.from(latest.values()).filter(isValidDrone) as ValidOffenseDrone[];
    }, [offenseLiveDrones, offenseHistoryData, activeTab]);


    // --- Event Handlers ---
    const handleOffenseDroneClick = (codeName: string) => {
        console.log('🎯 Offense Drone clicked:', codeName);
        setSelectedOffenseCodeName(codeName);
    };

    const handleMapMove = (lng: number, lat: number, zoom: number) => {
        setMapState({ center: [lng, lat], zoom: zoom });
    };

    const handleRouteToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setShowRoutes(event.target.checked);
        console.log('🛤️ Route visibility:', event.target.checked);
    };

    const handleRefreshHistory = () => {
        refetchHistory();
        console.log('🔄 Refreshing history...');
    };

    // Handler for history filters
    const handleHistoryFilterChange = (filters: {
        codeName: string | null;
        objective: string | null;
        groupId: string | null;
    }) => {
        setHistoryFilters(filters);
        console.log('🔍 History filters changed:', filters);
    };

    // Determine which routes to show on map
    const mapRoutes = activeTab === 'live' ? offenseLiveRoutes : offenseHistoryRoutes;

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
                            backgroundColor: activeTab === 'live' ? '#3b82f6' : '#eab308',
                            height: 3,
                        },
                    }}
                >
                    <Tab label="Live Feed" value="live" /> 
                    <Tab label="History" value="history" />
                </Tabs>

                {/* Content based on active tab */}
                {activeTab === 'live' ? (
                    <TGOffense 
                        allDrones={offenseLiveDrones}
                        onDroneClick={handleOffenseDroneClick}
                        isConnected={isOffenseSocketConnected}
                    />
                ) : (
                    <TGOffenseHistory
                        allHistory={offenseHistoryData as OffenseMoveUpdate[] || []}
                        onHistorySelect={setSelectedOffenseCodeName}
                        onClearFilters={() => setSelectedOffenseCodeName(null)}
                        onFilterChange={handleHistoryFilterChange}
                        isLoading={isHistoryLoading}
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
                gap: 1,
            }}>
                <Box sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    padding: '4px 12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showRoutes}
                                onChange={handleRouteToggle}
                                name="routeToggle"
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
                
                {activeTab === 'history' && (
                    <Button
                        variant="contained"
                        onClick={handleRefreshHistory}
                        sx={{
                            backgroundColor: '#eab308',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            padding: '8px 20px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            borderRadius: '8px',
                            '&:hover': {
                                backgroundColor: '#a78009ff',
                            }
                        }}
                    >
                        🔄 REFRESH
                    </Button>
                )}
            </Box>

            {isHistoryLoading && activeTab === 'history' && (
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
                    Loading offense history...
                </Box>
            )}

            {historyError && activeTab === 'history' && (
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
                    ⚠️ {historyError.message}
                </Box>
            )}

            {/* Map (Shows LIVE or HISTORY data based on active tab) */}
            <Box sx={{ flex: 1, position: 'relative' }}>
                <MapOffenseComponent
                    center={mapState.center}
                    zoom={mapState.zoom}
                    drones={latestOffenseDrones}
                    droneRoutes={showRoutes ? mapRoutes : undefined}
                    selectedDroneId={selectedOffenseCodeName}
                    onMapMove={handleMapMove}
                />
            </Box>
        </Box>
        </>
    );
}