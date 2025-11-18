import { Box, Button, Switch, FormControlLabel, Tabs, Tab } from '@mui/material';
import { useState, useEffect, useMemo } from 'react';

// --- Defense Imports ---
import TGDefense from '../component/integration/defense/TGDefense';
import TGHistory from '../component/integration/defense/TGHistory';
import MapComponent from '../component/map/MapComponent'; // Defense Map
import { useTGDetections } from '../hooks/Defense/useTGDefenseDetection';
import { useTGSocket } from '../hooks/Socket/useTGSocket';
import type { DroneUpdate as DefenseDroneUpdate } from '../types/drone.type';

// --- Offense Imports ---
import TGOffense from '../component/integration/offense/TGOffense';
import TGOffenseHistory from '../component/integration/offense/TGOffenseHistory';
import MapOffenseComponent from '../component/map/MapOffenseComponent'; // Offense Map
import { useOffenseSocket } from '../hooks/Socket/useOffenseSocket';
import { useOffenseMoveDetection } from '../hooks/Offense/useOffenseMoveDetection';
import type { OffenseMoveUpdate } from '../types/offenseMove.type';

// Helper type from Offense Page
type ValidOffenseDrone = Omit<OffenseMoveUpdate, 'size' | 'updateId' | 'color' | 'lastUpdated' | 'speed'> & { 
  size: number; 
  updateId: string;
  color: string;
  lastUpdated: number;
  speed: number;
};

// --- Helper Styles ---
const errorBoxStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
};

const dangerBoxStyle = {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
};
// ---

// Main component
export default function IntegrationPage() {
    
    // --- State for BOTH pages ---
    
    // Defense State
    const [selectedDefenseDroneId, setSelectedDefenseDroneId] = useState<string | null>(null);
    const [liveFeedDefense, setLiveFeedDefense] = useState<DefenseDroneUpdate[]>([]);
    const [historyDataDefense, setHistoryDataDefense] = useState<DefenseDroneUpdate[]>([]);
    const [isStartedDefense, setIsStartedDefense] = useState(true);
    const [showRoutesDefense, setShowRoutesDefense] = useState(true);
    const [activeTabDefense, setActiveTabDefense] = useState<'live' | 'history'>('live');
    const [historyFilterObjId, setHistoryFilterObjId] = useState<string | null>(null);
    const [mapStateDefense, setMapStateDefense] = useState({
        center: [100.5231, 13.7367], // Bangkok Center
        zoom: 12,
    });

    // Offense State
    const [selectedOffenseCodeName, setSelectedOffenseCodeName] = useState<string | null>(null);
    const [showRoutesOffense, setShowRoutesOffense] = useState(true);
    const [activeTabOffense, setActiveTabOffense] = useState<'live' | 'history'>('live');
    const [mapStateOffense, setMapStateOffense] = useState({
        center: [100.5231, 13.7367], // Bangkok Center
        zoom: 12,
    });

    // --- Hooks for BOTH pages ---

    // Defense Hooks
    const { data: historyDataFromAPI, isLoading: isHistoryLoadingDefense, error: historyErrorDefense, refetch: refetchHistoryDefense } = useTGDetections(activeTabDefense === 'history', 500);
    const { realtimeData: realtimeDataDefense, isConnected: isConnectedDefense, error: socketErrorDefense } = useTGSocket(isStartedDefense);

    // Offense Hooks
    const { allDrones: offenseLiveDrones, isConnected: isConnectedOffense } = useOffenseSocket();
    const { data: offenseHistoryData, isLoading: isHistoryLoadingOffense, error: historyErrorOffense, refetch: refetchHistoryOffense } = useOffenseMoveDetection(activeTabOffense === 'history', 500);

    
    // --- Data Processing for DEFENSE ---
    
    const enrichDroneWithRawData = (drone: any, source: 'api' | 'websocket'): DefenseDroneUpdate => {
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
        return {
            ...drone,
            updateId: `${drone.obj_id}-${Date.now()}-${Math.random()}`,
            lastUpdated: Date.now(),
            rawData: drone.rawData || undefined,
        };
    };

    useEffect(() => {
        if (historyDataFromAPI && historyDataFromAPI.length > 0) {
            const dronesWithUpdateId = historyDataFromAPI.map((drone) => 
                enrichDroneWithRawData(drone, 'api')
            );
            setHistoryDataDefense(dronesWithUpdateId);
        }
    }, [historyDataFromAPI]);

    useEffect(() => {
        if (realtimeDataDefense?.objects && realtimeDataDefense.objects.length > 0) {
            setLiveFeedDefense((prev) => {
                const newDetections = realtimeDataDefense.objects.map((drone) => 
                    enrichDroneWithRawData(drone, 'websocket')
                );
                const updated = [...newDetections, ...prev];
                return updated.slice(0, 100);
            });
            setHistoryDataDefense((prev) => {
                const newDetections = realtimeDataDefense.objects.map((drone) => 
                    enrichDroneWithRawData(drone, 'websocket')
                );
                return [...newDetections, ...prev];
            });
        }
    }, [realtimeDataDefense]);

    const filteredHistoryDataDefense = useMemo(() => {
        if (!historyFilterObjId) {
            return historyDataDefense;
        }
        return historyDataDefense.filter(d => d.obj_id === historyFilterObjId);
    }, [historyDataDefense, historyFilterObjId]);

    const displayedDronesDefense = useMemo(() => {
        if (activeTabDefense === 'live') {
            return liveFeedDefense;
        } else {
            return filteredHistoryDataDefense;
        }
    }, [activeTabDefense, liveFeedDefense, filteredHistoryDataDefense]);

    const droneRoutesDefense = useMemo(() => {
        const routes = new Map<string, DefenseDroneUpdate[]>();
        displayedDronesDefense.forEach((drone) => {
            if (!routes.has(drone.obj_id)) {
                routes.set(drone.obj_id, []);
            }
            routes.get(drone.obj_id)!.push(drone);
        });
        routes.forEach((updates) => {
            updates.sort((a, b) => a.lastUpdated - b.lastUpdated);
        });
        return routes;
    }, [displayedDronesDefense]);

    const latestDronesDefense = useMemo(() => {
        const latest = new Map<string, DefenseDroneUpdate>();
        displayedDronesDefense.forEach((drone) => {
            const existing = latest.get(drone.obj_id);
            if (!existing || drone.lastUpdated > existing.lastUpdated) {
                latest.set(drone.obj_id, drone);
            }
        });
        return Array.from(latest.values());
    }, [displayedDronesDefense]);

    // --- Data Processing for OFFENSE ---

    const processedOffenseHistory = useMemo((): OffenseMoveUpdate[] => {
        return (offenseHistoryData as OffenseMoveUpdate[] || []);
    }, [offenseHistoryData]);

    const isValidDroneOffense = (drone: OffenseMoveUpdate): drone is ValidOffenseDrone => {
        return drone.size != null && 
               drone.updateId != null &&
               drone.color != null && 
               drone.lastUpdated != null &&
               drone.speed != null;
    };

    const filteredOffenseHistory = useMemo(() => {
        if (!selectedOffenseCodeName) {
            return processedOffenseHistory;
        }
        return processedOffenseHistory.filter(d => d.codeName === selectedOffenseCodeName);
    }, [processedOffenseHistory, selectedOffenseCodeName]);

    const displayedDronesOffense = useMemo((): OffenseMoveUpdate[] => {
        if (activeTabOffense === 'live') {
            return offenseLiveDrones;
        } else {
            return filteredOffenseHistory;
        }
    }, [activeTabOffense, offenseLiveDrones, filteredOffenseHistory]);

    const offenseDroneRoutes = useMemo(() => {
        const routes = new Map<string, OffenseMoveUpdate[]>();
        displayedDronesOffense.forEach((drone) => {
            if (!routes.has(drone.codeName)) {
                routes.set(drone.codeName, []);
            }
            routes.get(drone.codeName)!.push(drone);
        });
        const filteredRoutes = new Map<string, ValidOffenseDrone[]>();
        routes.forEach((updates, codeName) => {
            const validUpdates = updates.filter(isValidDroneOffense); 
            if (validUpdates.length > 0) {
                validUpdates.sort((a, b) => (a.lastUpdated || 0) - (b.lastUpdated || 0));
                filteredRoutes.set(codeName, validUpdates);
            }
        });
        return filteredRoutes;
    }, [displayedDronesOffense]);

    const latestOffenseDrones = useMemo(() => {
        const latest = new Map<string, OffenseMoveUpdate>();
        displayedDronesOffense.forEach((drone) => {
            const existing = latest.get(drone.codeName);
            if (!existing || (drone.lastUpdated || 0) > (existing.lastUpdated || 0)) {
                latest.set(drone.codeName, drone);
            }
        });
        return Array.from(latest.values()).filter(isValidDroneOffense);
    }, [displayedDronesOffense]);

    
    // --- Event Handlers for BOTH pages ---
    
    // Defense Handlers
    const handleMapMoveDefense = (lng: number, lat: number, zoom: number) => setMapStateDefense({ center: [lng, lat], zoom: zoom });
    const handleRouteToggleDefense = (event: React.ChangeEvent<HTMLInputElement>) => setShowRoutesDefense(event.target.checked);
    const handleStartStopDefense = () => setIsStartedDefense(prev => !prev);
    const handleClearLiveFeedDefense = () => setLiveFeedDefense([]);
    const handleRefreshHistoryDefense = () => refetchHistoryDefense();
    const handleHistorySelectDefense = (objId: string | null) => {
        setHistoryFilterObjId(objId);
        setSelectedDefenseDroneId(objId); // Also select it on the map
    };
    const handleClearHistoryFiltersDefense = () => setHistoryFilterObjId(null);
    const handleDroneClickDefense = (droneId: string) => setSelectedDefenseDroneId(droneId);

    // Offense Handlers
    const handleMapMoveOffense = (lng: number, lat: number, zoom: number) => setMapStateOffense({ center: [lng, lat], zoom: zoom });
    const handleRouteToggleOffense = (event: React.ChangeEvent<HTMLInputElement>) => setShowRoutesOffense(event.target.checked);
    const handleRefreshHistoryOffense = () => refetchHistoryOffense();
    const handleOffenseDroneClick = (codeName: string) => setSelectedOffenseCodeName(codeName);
    const handleHistorySelectOffense = (codeName: string | null) => setSelectedOffenseCodeName(codeName);
    const handleClearHistoryFiltersOffense = () => setSelectedOffenseCodeName(null);

    // --- Render ---
    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100vw', 
            height: '100vh', 
            overflow: 'hidden', 
            bgcolor: '#0f0f1e',
            margin: 0,
            padding: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        }}>
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%', height: '100%' }}>
                
                {/* === OFFENSE SIDEBAR (Left) === */}
                <Box sx={{ 
                    width: '450px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(18, 18, 18, 0.95)',
                    flexShrink: 0,
                    borderRight: '1px solid #444'
                }}>
                    <Tabs
                        value={activeTabOffense}
                        onChange={(_, newValue) => setActiveTabOffense(newValue)}
                        variant="fullWidth"
                        sx={{
                            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, fontSize: '0.85rem' },
                            '& .Mui-selected': { color: 'white !important', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                            '& .MuiTabs-indicator': { backgroundColor: activeTabOffense === 'live' ? '#3b82f6' : '#eab308', height: 3 },
                        }}
                    >
                        <Tab label="Offense Live" value="live" /> 
                        <Tab label="Offense History" value="history" />
                    </Tabs>

                    {activeTabOffense === 'live' ? (
                        <TGOffense 
                            allDrones={offenseLiveDrones}
                            onDroneClick={handleOffenseDroneClick}
                            isConnected={isConnectedOffense}
                        />
                    ) : (
                        <TGOffenseHistory
                            allHistory={processedOffenseHistory}
                            onHistorySelect={handleHistorySelectOffense}
                            onClearFilters={handleClearHistoryFiltersOffense}
                            isLoading={isHistoryLoadingOffense}
                        />
                    )}
                </Box>

                {/* === CENTER MAPS (Stacked) === */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    
                    {/* Offense Map (Top) */}
                    <Box sx={{ flex: 1, position: 'relative', borderBottom: '1px solid #444' }}>
                        <MapOffenseComponent
                            center={mapStateOffense.center}
                            zoom={mapStateOffense.zoom}
                            drones={latestOffenseDrones} 
                            droneRoutes={showRoutesOffense ? offenseDroneRoutes : undefined}
                            selectedDroneId={selectedOffenseCodeName}
                            onMapMove={handleMapMoveOffense}
                        />
                        {/* Controls for Offense Map */}
                        <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, display: 'flex', gap: 1 }}>
                            <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '4px 12px', borderRadius: '8px' }}>
                                <FormControlLabel
                                    control={<Switch checked={showRoutesOffense} onChange={handleRouteToggleOffense} size="small" />}
                                    label="Offense Routes"
                                    sx={{ '& .MuiTypography-root': { fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' } }}
                                />
                            </Box>
                            {activeTabOffense === 'history' && (
                                <Button size="small" variant="contained" onClick={handleRefreshHistoryOffense} sx={{ bgcolor: '#eab308', '&:hover': { bgcolor: '#a78009ff' } }}>
                                    REFRESH
                                </Button>
                            )}
                        </Box>
                        {/* Loading/Error for Offense History */}
                        {isHistoryLoadingOffense && activeTabOffense === 'history' && (
                            <Box sx={{ position: 'absolute', top: 80, left: 20, zIndex: 999, ...errorBoxStyle }}>
                                Loading offense history...
                            </Box>
                        )}
                        {historyErrorOffense && activeTabOffense === 'history' && (
                            <Box sx={{ position: 'absolute', top: 80, left: 20, zIndex: 999, ...errorBoxStyle, ...dangerBoxStyle }}>
                                ⚠️ {historyErrorOffense.message}
                            </Box>
                        )}
                    </Box>

                    {/* Defense Map (Bottom) */}
                    <Box sx={{ flex: 1, position: 'relative' }}>
                        <MapComponent // Using the defense map
                            center={mapStateDefense.center}
                            zoom={mapStateDefense.zoom}
                            drones={latestDronesDefense}
                            droneRoutes={showRoutesDefense ? droneRoutesDefense : undefined}
                            selectedDroneId={selectedDefenseDroneId}
                            onMapMove={handleMapMoveDefense}
                        />
                        {/* Controls for Defense Map */}
                        <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, display: 'flex', gap: 1 }}>
                            <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '4px 12px', borderRadius: '8px' }}>
                                <FormControlLabel
                                    control={<Switch checked={showRoutesDefense} onChange={handleRouteToggleDefense} color="error" size="small" />}
                                    label="Defense Routes"
                                    sx={{ '& .MuiTypography-root': { fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' } }}
                                />
                            </Box>
                            <Button size="small" variant="contained" onClick={handleStartStopDefense} sx={{ bgcolor: isStartedDefense ? '#dc2626' : '#22c55e', '&:hover': { bgcolor: isStartedDefense ? '#b91c1c' : '#16a34a' } }}>
                                {isStartedDefense ? '⏸' : '▶'}
                            </Button>
                            {activeTabDefense === 'live' ? (
                                <Button size="small" variant="contained" onClick={handleClearLiveFeedDefense} sx={{ bgcolor: '#6b7280', '&:hover': { bgcolor: '#4b5563' } }}>
                                    CLEAR
                                </Button>
                            ) : (
                                <Button size="small" variant="contained" onClick={handleRefreshHistoryDefense} sx={{ bgcolor: '#eab308', '&:hover': { bgcolor: '#a78009ff' } }}>
                                    REFRESH
                                </Button>
                            )}
                        </Box>
                        {/* Loading/Error for Defense History */}
                        {isHistoryLoadingDefense && activeTabDefense === 'history' && (
                             <Box sx={{ position: 'absolute', top: 80, left: 20, zIndex: 999, ...errorBoxStyle }}>
                                Loading defense history...
                            </Box>
                        )}
                        {(historyErrorDefense || socketErrorDefense) && (
                            <Box sx={{ position: 'absolute', top: 80, left: 20, zIndex: 999, ...errorBoxStyle, ...dangerBoxStyle }}>
                                ⚠️ {historyErrorDefense?.toString() || socketErrorDefense}
                            </Box>
                        )}
                    </Box>

                </Box>

                {/* === DEFENSE SIDEBAR (Right) === */}
                <Box sx={{ 
                    width: '450px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(18, 18, 18, 0.95)',
                    flexShrink: 0,
                    borderLeft: '1px solid #444'
                }}>
                    <Tabs
                        value={activeTabDefense}
                        onChange={(_, newValue) => setActiveTabDefense(newValue)}
                        variant="fullWidth"
                        sx={{
                            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, fontSize: '0.85rem' },
                            '& .Mui-selected': { color: 'white !important', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                            '& .MuiTabs-indicator': { backgroundColor: activeTabDefense === 'live' ? '#dc2626' : '#eab308', height: 3 },
                        }}
                    >
                        <Tab label="Defense Live" value="live" /> 
                        <Tab label="Defense History" value="history" />
                    </Tabs>

                    {activeTabDefense === 'live' ? (
                        <TGDefense 
                            allDrones={liveFeedDefense}
                            onDroneClick={handleDroneClickDefense}
                            isConnected={isConnectedDefense}
                        />
                    ) : (
                        <TGHistory
                            allHistory={historyDataDefense}
                            onHistorySelect={handleHistorySelectDefense}
                            onClearFilters={handleClearHistoryFiltersDefense}
                            isLoading={isHistoryLoadingDefense}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
}