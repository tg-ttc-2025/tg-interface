import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, ToggleButton, ToggleButtonGroup, Paper } from '@mui/material';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhdGNoYWxlcm0iLCJhIjoiY21nZnpiYzU3MGRzdTJrczlkd3RxamN4YyJ9.k288gnCNLdLgczawiB79gQ';

// --- UPDATED INTERFACE ---
interface DroneData {
  obj_id: string;
  type: string;
  lat: number;
  lng: number;
  objective: string;
  size: string;
  details: {
    color: string;
    speed: number;
  };
  image?: {
    publicUrl: string;
    filename: string;
  };
  rawData?: {
    id: string;
    alt?: string;
    groundHeight?: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
    images: Array<{
      id: string;
      fileName: string;
      fileSize: string;
      mimeType: string;
      isPrimary: boolean;
      publicUrl: string;
    }>;
  };
}

interface DroneUpdate extends DroneData {
  updateId: string;
  lastUpdated: number;
}

interface DronePosition {
  lat: number;
  lng: number;
  timestamp: number;
}

interface MapProps {
  center: [number, number];
  zoom: number;
  drones?: DroneData[];
  droneRoutes?: Map<string, DroneUpdate[]>;
  selectedDroneId?: string | null;
  onMapMove?: (lng: number, lat: number, zoom: number) => void;
}

export default function MapComponent({ 
  center, 
  zoom, 
  drones = [], 
  droneRoutes,
  selectedDroneId, 
  onMapMove 
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, { 
    marker: mapboxgl.Marker; 
    color: string; 
    popup: mapboxgl.Popup;
    lastLat: number;
    lastLng: number;
    lastAlt?: number;
  }>>(new Map());
  
  const droneTrailsRef = useRef<Map<string, {
    positions: DronePosition[];
    trailMarkers: mapboxgl.Marker[];
  }>>(new Map());

  const pathLayersRef = useRef<Set<string>>(new Set());
  const is3DMode = useRef<boolean>(false);
  
  // State for map style toggle
  const [mapStyle, setMapStyle] = useState<'3d' | '2d'>('3d');

  const getColorHex = (color: string): string => {
    const colorMap: Record<string, string> = {
      red: '#ef4444',
      black: '#1f2937',
      gray: '#6b7280',
      grey: '#6b7280',
      blue: '#3b82f6',
      green: '#22c55e',
      yellow: '#eab308',
      white: '#f9fafb',
      orange: '#f97316',
    };
    return colorMap[color.toLowerCase()] || '#ef4444';
  };

  const getImageUrl = (publicUrl?: string): string => {
    return publicUrl || '';
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const formatFileSize = (size: string | number): string => {
    const bytes = typeof size === 'string' ? parseInt(size) : size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const calculateAltitude = (drone: DroneData): number => {
    if (!drone.rawData) return 0;
    
    const alt = drone.rawData.alt ? parseFloat(drone.rawData.alt) : 0;
    const groundHeight = drone.rawData.groundHeight ? parseFloat(drone.rawData.groundHeight) : 0;
    
    return alt;
  };

  const createTrailMarkerElement = (color: string, index: number): HTMLDivElement => {
    const el = document.createElement('div');
    el.className = 'drone-trail-marker';
    
    const opacity = Math.max(0.5, 1 - (index * 0.1));
    const size = Math.max(10, 16 - (index * 1));
    
    el.innerHTML = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        opacity: ${opacity};
        box-shadow: 0 0 8px ${color};
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${Math.max(4, size - 8)}px;
          height: ${Math.max(4, size - 8)}px;
          background-color: white;
          border-radius: 50%;
          opacity: 0.5;
        "></div>
      </div>
    `;
    
    return el;
  };

  const drawCompleteRoute = (objId: string, updates: DroneUpdate[], color: string) => {
    if (!map.current || updates.length < 2) return;

    const sourceId = `route-${objId}`;
    const lineLayerId = `route-line-${objId}`;
    const arrowLayerId = `route-arrow-${objId}`;

    try {
      if (map.current.getLayer(arrowLayerId)) {
        map.current.removeLayer(arrowLayerId);
        pathLayersRef.current.delete(arrowLayerId);
      }
      if (map.current.getLayer(lineLayerId)) {
        map.current.removeLayer(lineLayerId);
        pathLayersRef.current.delete(lineLayerId);
      }
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    } catch (e) {
      // Ignore errors
    }

    const coordinates = updates.map(update => {
      const altitude = calculateAltitude(update);
      return [update.lng, update.lat, altitude];
    });

    console.log(`🛤️ Drawing 3D route for ${objId} with ${coordinates.length} points`);

    try {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            objId: objId,
            color: color
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      map.current.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': color,
          'line-width': 3,
          'line-opacity': 0.7,
        }
      });

      map.current.addLayer({
        id: arrowLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 80,
          'icon-image': 'arrow-15',
          'icon-size': 1.2,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-rotation-alignment': 'map',
        },
        paint: {
          'icon-color': color,
          'icon-opacity': 0.8
        }
      });

      pathLayersRef.current.add(lineLayerId);
      pathLayersRef.current.add(arrowLayerId);

      console.log(`✅ 3D route drawn for ${objId}`);
    } catch (error) {
      console.error('❌ Error drawing 3D route:', error);
    }
  };

  const drawHistoricalMarkers = (objId: string, updates: DroneUpdate[], color: string) => {
    if (!map.current || updates.length < 2) return;

    const existingTrail = droneTrailsRef.current.get(objId);
    if (existingTrail) {
      existingTrail.trailMarkers.forEach(marker => marker.remove());
      droneTrailsRef.current.delete(objId);
    }

    const trailMarkers: mapboxgl.Marker[] = [];
    
    updates.slice(0, -1).forEach((update, index) => {
      const trailEl = createTrailMarkerElement(color, index);
      const altitude = calculateAltitude(update);
      
      const trailMarker = new mapboxgl.Marker({
        element: trailEl,
        anchor: 'center',
      })
        .setLngLat([update.lng, update.lat]);
      
      if (is3DMode.current && altitude > 0) {
        (trailMarker as any).setAltitude(altitude);
      }
      
      trailMarker.addTo(map.current!);

      const trailPopup = new mapboxgl.Popup({
        offset: 15,
        closeButton: false,
      }).setHTML(`
        <div style="padding: 8px; background: rgba(0,0,0,0.8); color: white; border-radius: 6px; font-size: 11px;">
          <strong>${update.obj_id}</strong> - Update #${index + 1}<br/>
          📍 ${update.lat.toFixed(6)}, ${update.lng.toFixed(6)}<br/>
          ${altitude > 0 ? `✈️ ${altitude.toFixed(1)}m altitude<br/>` : ''}
          ⏰ ${new Date(update.lastUpdated).toLocaleTimeString()}
        </div>
      `);
      trailMarker.setPopup(trailPopup);

      trailMarkers.push(trailMarker);
    });

    droneTrailsRef.current.set(objId, {
      positions: updates.map(u => ({ lat: u.lat, lng: u.lng, timestamp: u.lastUpdated })),
      trailMarkers: trailMarkers
    });

    console.log(`📍 Created ${trailMarkers.length} historical 3D markers for ${objId}`);
  };

  const createDroneMarkerElement = (drone: DroneData, altitude: number): HTMLDivElement => {
    const el = document.createElement('div');
    el.className = 'drone-marker';
    el.dataset.droneId = drone.obj_id;
    
    const droneColor = getColorHex(drone.details.color);

    if (!document.getElementById('drone-marker-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'drone-marker-styles';
      styleSheet.textContent = `
        .drone-marker {
          width: 50px;
          height: 50px;
          display: block;
          cursor: pointer;
          position: relative;
        }

        .drone-trail-marker {
          cursor: pointer;
        }

        .drone-marker:hover {
          transform: scale(1.1);
        }

        .drone-marker.selected {
          animation: bounce 0.6s ease;
        }

        .drone-marker.moving {
          animation: move-pulse 0.5s ease;
        }

        .drone-marker.flying {
          animation: drone-float 3s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }

        @keyframes move-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.5);
            opacity: 0;
          }
        }
        
        @keyframes drone-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-3px) rotate(2deg);
          }
          75% {
            transform: translateY(-3px) rotate(-2deg);
          }
        }

        .drone-marker-container {
          position: relative;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 30px;
          height: 30px;
          border: 3px solid currentColor;
          border-radius: 50%;
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          pointer-events: none;
        }

        .pulse-ring:nth-child(2) {
          animation-delay: 0.5s;
        }

        .pulse-ring:nth-child(3) {
          animation-delay: 1s;
        }

        .drone-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          background-color: currentColor;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drone-svg-icon {
          width: 20px;
          height: 20px;
        }

        .altitude-label {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
        }

        .mapboxgl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          max-height: 80vh;
          overflow-y: auto;
        }

        .mapboxgl-popup-tip {
          display: none;
        }

        .raw-data-section {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.6;
        }

        .raw-data-key {
          color: #60a5fa;
          font-weight: 600;
        }

        .raw-data-value {
          color: #d1d5db;
        }

        .raw-data-string {
          color: #86efac;
        }

        .raw-data-number {
          color: #fbbf24;
        }

        .raw-data-section::-webkit-scrollbar {
          width: 6px;
        }

        .raw-data-section::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
          border-radius: 3px;
        }

        .raw-data-section::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }
      `;
      document.head.appendChild(styleSheet);
    }

    const flyingClass = altitude > 10 ? ' flying' : '';

    el.innerHTML = `
      <div class="drone-marker-container${flyingClass}" style="color: ${droneColor};">
        <div class="pulse-ring"></div>
        <div class="pulse-ring"></div>
        <div class="pulse-ring"></div>
        <div class="drone-icon">
          <svg class="drone-svg-icon" style="color: white" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 10H14M10 10V14M10 10L6.50003 6.50003M14 10V14M14 10L17.5 6.50003M14 14H10M14 14L17.5 17.5M10 14L6.50003 17.5M9.96003 6.00003C9.86807 5.3566 9.59875 4.75148 9.18226 4.25249C8.76576 3.75349 8.21855 3.38033 7.60192 3.17481C6.9853 2.96929 6.32363 2.93954 5.69105 3.08888C5.05846 3.23823 4.47997 3.56077 4.02037 4.02037C3.56077 4.47997 3.23823 5.05846 3.08888 5.69105C2.93954 6.32363 2.96929 6.9853 3.17481 7.60192C3.38033 8.21855 3.75349 8.76576 4.25249 9.18226C4.75148 9.59875 5.3566 9.86807 6.00003 9.96003M18 9.96003C18.6435 9.86807 19.2486 9.59875 19.7476 9.18226C20.2466 8.76576 20.6197 8.21855 20.8252 7.60192C21.0308 6.9853 21.0605 6.32363 20.9112 5.69105C20.7618 5.05846 20.4393 4.47997 19.9797 4.02037C19.5201 3.56077 18.9416 3.23823 18.309 3.08888C17.6764 2.93954 17.0148 2.96929 16.3981 3.17481C15.7815 3.38033 15.2343 3.75349 14.8178 4.25249C14.4013 4.75148 14.132 5.3566 14.04 6.00003M14.04 18C14.132 18.6435 14.4013 19.2486 14.8178 19.7476C15.2343 20.2466 15.7815 20.6197 16.3981 20.8252C17.0148 21.0308 17.6764 21.0605 18.309 20.9112C18.9416 20.7618 19.5201 20.4393 19.9797 19.9797C20.4393 19.5201 20.7618 18.9416 20.9112 18.309C21.0605 17.6764 21.0308 17.0148 20.8252 16.3981C20.6197 15.7815 20.2466 15.2343 19.7476 14.8178C19.2486 14.4013 18.6435 14.132 18 14.04M6.00003 14.04C5.3566 14.132 4.75148 14.4013 4.25249 14.8178C3.75349 15.2343 3.38033 15.7815 3.17481 16.3981C2.96929 17.0148 2.93954 17.6764 3.08888 18.309C3.23823 18.9416 3.56077 19.5201 4.02037 19.9797C4.47997 20.4393 5.05846 20.7618 5.69105 20.9112C6.32363 21.0605 6.9853 21.0308 7.60192 20.8252C8.21855 20.6197 8.76576 20.2466 9.18226 19.7476C9.59875 19.2486 9.86807 18.6435 9.96003 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        ${altitude > 0 ? `<div class="altitude-label">✈️ ${altitude.toFixed(0)}m</div>` : ''}
      </div>
    `;

    return el;
  };

  const createPopupHTML = (drone: DroneData): string => {
    const droneColor = getColorHex(drone.details.color);
    const imageUrl = getImageUrl(drone.image?.publicUrl);
    const altitude = calculateAltitude(drone);
    
    return `
      <div style="
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        border: 2px solid ${droneColor};
        border-radius: 12px;
        color: white;
        font-family: 'Inter', sans-serif;
        min-width: 320px;
        max-width: 400px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      ">
        ${imageUrl ? `
          <div style="
            width: 100%;
            height: 160px;
            overflow: hidden;
            position: relative;
          ">
            <img 
              src="${imageUrl}" 
              alt="Drone Detection"
              style="
                width: 100%;
                height: 100%;
                object-fit: cover;
              "
              onerror="this.parentElement.style.display='none'"
            />
            <div style="
              position: absolute;
              top: 8px;
              right: 8px;
              background: rgba(0,0,0,0.7);
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
              backdrop-filter: blur(4px);
            ">
              LIVE FEED
            </div>
          </div>
        ` : ''}
        
        <div style="padding: 12px;">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
          ">
            <div style="
              width: 12px;
              height: 12px;
              background-color: ${droneColor};
              border-radius: 50%;
              box-shadow: 0 0 8px ${droneColor};
            "></div>
            <strong style="font-size: 14px; text-transform: uppercase; flex: 1;">${drone.obj_id}</strong>
            <div style="
              background: ${droneColor};
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
            ">
              ${drone.type.toUpperCase()}
            </div>
          </div>
          
          <div style="font-size: 12px; line-height: 1.8;">
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 12px;">
              <span style="color: rgba(255,255,255,0.6);">Mission:</span>
              <span style="
                background-color: ${drone.objective.toLowerCase() === 'kill' ? '#dc2626' : '#f59e0b'};
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 600;
                font-size: 10px;
                text-align: center;
              ">${drone.objective.toUpperCase()}</span>
              
              <span style="color: rgba(255,255,255,0.6);">Size:</span>
              <span style="font-weight: 600; text-transform: capitalize;">${drone.size}</span>
              
              <span style="color: rgba(255,255,255,0.6);">Speed:</span>
              <span style="font-weight: 600;">${drone.details.speed} m/s</span>

              ${drone.rawData?.alt ? `
              <span style="color: rgba(255,255,255,0.6);">Altitude:</span>
              <span style="font-weight: 600;">${drone.rawData.alt}m</span>
              ` : ''}

              ${drone.rawData?.groundHeight ? `
              <span style="color: rgba(255,255,255,0.6);">Ground Height:</span>
              <span style="font-weight: 600;">${drone.rawData.groundHeight}</span>
              ` : ''}

              ${altitude > 0 ? `
              <span style="color: rgba(255,255,255,0.6);">Flying At:</span>
              <span style="font-weight: 600; color: #3b82f6;">✈️ ${altitude.toFixed(1)}m</span>
              ` : ''}
              
              <span style="color: rgba(255,255,255,0.6);">Color:</span>
              <span style="
                font-weight: 600; 
                text-transform: capitalize;
                display: flex;
                align-items: center;
                gap: 6px;
              ">
                <span style="
                  display: inline-block;
                  width: 10px;
                  height: 10px;
                  background-color: ${droneColor};
                  border-radius: 50%;
                  border: 1px solid rgba(255,255,255,0.3);
                "></span>
                ${drone.details.color}
              </span>
            </div>
            
            <div style="
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid rgba(255,255,255,0.1);
              font-size: 10px;
              color: rgba(255,255,255,0.5);
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              ${drone.lat.toFixed(6)}, ${drone.lng.toFixed(6)}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // Function to toggle map style
  const toggleMapStyle = (
    event: React.MouseEvent<HTMLElement>,
    newStyle: '3d' | '2d' | null,
  ) => {
    if (!map.current || newStyle === null || newStyle === mapStyle) return;

    console.log(`🔄 Switching to ${newStyle} mode`);

    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();
    const currentBearing = map.current.getBearing();

    if (newStyle === '2d') {
      map.current.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
      map.current.once('style.load', () => {
        if (map.current) {
          map.current.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 1000
          });
          
          map.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          
          map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
          
          redrawAllContent();
        }
      });
    } else {
      map.current.setStyle('mapbox://styles/mapbox/standard');
      map.current.once('style.load', () => {
        if (map.current) {
          map.current.easeTo({
            pitch: 45,
            bearing: currentBearing,
            duration: 1000
          });
          
          map.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          
          map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
          
          const layers = map.current.getStyle().layers;
          const labelLayerId = layers?.find(
            (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
          )?.id;

          map.current.addLayer(
            {
              'id': 'add-3d-buildings',
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 15,
              'paint': {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
              }
            },
            labelLayerId
          );
          
          redrawAllContent();
        }
      });
    }

    setMapStyle(newStyle);
  };

  const redrawAllContent = () => {
    if (droneRoutes && droneRoutes.size > 0) {
      droneRoutes.forEach((updates, objId) => {
        if (updates.length >= 2) {
          const latestUpdate = updates[updates.length - 1];
          const color = getColorHex(latestUpdate.details.color);
          drawCompleteRoute(objId, updates, color);
          drawHistoricalMarkers(objId, updates, color);
        }
      });
    }

    markersRef.current.forEach((markerData) => {
      markerData.marker.remove();
    });
    markersRef.current.clear();

    drones.forEach((drone) => {
      const color = getColorHex(drone.details.color);
      createNewMarker(drone, color);
    });
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('🗺️ Initializing 3D map with buildings');

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [100.5391, 13.7465],
      zoom: 15.5,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('move', () => {
      if (map.current && onMapMove) {
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();
        onMapMove(center.lng, center.lat, zoom);
      }
    });

    map.current.on('load', () => {
      console.log('✅ Map loaded successfully');
      
      if (map.current) {
        map.current.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        
        map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        
        console.log('✅ 3D terrain enabled');

        const layers = map.current.getStyle().layers;
        const labelLayerId = layers?.find(
          (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
        )?.id;

        map.current.addLayer(
          {
            'id': 'add-3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            }
          },
          labelLayerId
        );

        console.log('✅ 3D buildings layer added');
      }
    });

    map.current.on('pitch', () => {
      if (map.current) {
        const pitch = map.current.getPitch();
        const was3D = is3DMode.current;
        is3DMode.current = pitch > 0;
        
        if (was3D !== is3DMode.current) {
          console.log(`📐 ${is3DMode.current ? 'Entered' : 'Exited'} 3D mode (pitch: ${pitch.toFixed(0)}°)`);
          updateMarkersFor3DMode();
        }
      }
    });

    map.current.dragRotate.enable();
    map.current.touchPitch.enable();

    return () => {
      if (map.current) {
        console.log('🗑️ Cleaning up map');
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const updateMarkersFor3DMode = () => {
    if (!map.current) return;
    
    console.log('🔄 Updating markers for 3D mode:', is3DMode.current);
    
    markersRef.current.forEach((markerData, droneId) => {
      const drone = drones.find(d => d.obj_id === droneId);
      if (drone) {
        const altitude = calculateAltitude(drone);
        
        markerData.marker.remove();
        const color = getColorHex(drone.details.color);
        createNewMarker(drone, color);
      }
    });
  };

  useEffect(() => {
    if (!map.current) {
      console.log('⚠️ Map not initialized yet');
      return;
    }

    const allKnownRouteLayerIds = Array.from(pathLayersRef.current);
    const allKnownDroneIdsWithRoutes = Array.from(droneTrailsRef.current.keys());

    if (allKnownRouteLayerIds.length > 0 || allKnownDroneIdsWithRoutes.length > 0) {
      console.log('🧹 Clearing all existing routes and trails');
      
      allKnownRouteLayerIds.forEach(layerId => {
        try {
          if (map.current!.getLayer(layerId)) {
            map.current!.removeLayer(layerId);
          }
        } catch (e) {}
      });

      allKnownDroneIdsWithRoutes.forEach(objId => {
        const sourceId = `route-${objId}`;
        try {
          if (map.current!.getSource(sourceId)) {
            map.current!.removeSource(sourceId);
          }
        } catch (e) {}
      });
      
      pathLayersRef.current.clear();
      
      droneTrailsRef.current.forEach((trail) => {
        trail.trailMarkers.forEach(marker => marker.remove());
      });
      droneTrailsRef.current.clear();
    }
    
    if (!droneRoutes || droneRoutes.size === 0) {
        console.log('✅ All routes cleared. No new routes to draw.');
        return;
    }

    console.log('\n=== 🗺️ Drawing all 3D drone routes ===');
    console.log('Routes to draw:', droneRoutes.size);
    
    droneRoutes.forEach((updates, objId) => {
      if (updates.length < 2) {
        console.log(`⚠️ Skipping ${objId}: only ${updates.length} update(s)`);
        return;
      }

      const latestUpdate = updates[updates.length - 1];
      const color = getColorHex(latestUpdate.details.color);

      console.log(`Processing 3D route for ${objId} with ${updates.length} updates`);

      drawCompleteRoute(objId, updates, color);
      drawHistoricalMarkers(objId, updates, color);
    });

    console.log('=== ✅ All 3D routes drawn ===\n');
  }, [droneRoutes]);

  useEffect(() => {
    if (!map.current || !selectedDroneId) return;

    const drone = drones.find(d => d.obj_id === selectedDroneId);
    if (!drone) return;

    console.log(`🎯 Flying to selected drone: ${selectedDroneId}`);

    const altitude = calculateAltitude(drone);

    map.current.flyTo({
      center: [drone.lng, drone.lat],
      zoom: 16,
      pitch: altitude > 0 ? 60 : 45,
      bearing: 0,
      duration: 1500,
      essential: true
    });

    const markerData = markersRef.current.get(selectedDroneId);
    if (markerData) {
      const markerElement = markerData.marker.getElement();
      markerElement.classList.add('selected');
      
      if (!markerData.popup.isOpen()) {
        markerData.marker.togglePopup();
      }

      setTimeout(() => {
        markerElement.classList.remove('selected');
      }, 600);
    }
  }, [selectedDroneId, drones]);

  useEffect(() => {
    if (!map.current) {
      console.log('⚠️ Map not initialized yet');
      return;
    }

    console.log('\n=== 🔄 Updating 3D drone markers ===');
    console.log('Drones count:', drones.length);
    console.log('3D Mode:', is3DMode.current);

    const currentDroneIds = new Set(drones.map(d => d.obj_id));
    
    markersRef.current.forEach((markerData, droneId) => {
      if (!currentDroneIds.has(droneId)) {
        console.log(`🗑️ Removing marker: ${droneId}`);
        markerData.marker.remove();
        markersRef.current.delete(droneId);
      }
    });

    drones.forEach((drone) => {
      const existingMarkerData = markersRef.current.get(drone.obj_id);
      const currentColor = getColorHex(drone.details.color);
      const altitude = calculateAltitude(drone);
      
      if (existingMarkerData) {
        const positionChanged = 
          Number(existingMarkerData.lastLat) !== Number(drone.lat) || 
          Number(existingMarkerData.lastLng) !== Number(drone.lng);

        const altitudeChanged = existingMarkerData.lastAlt !== altitude;
        const colorChanged = existingMarkerData.color !== currentColor;
        const imageUrl = getImageUrl(drone.image?.publicUrl);
        const storedImageUrl = existingMarkerData.popup.getElement()?.dataset.imageUrl;
        const imageChanged = imageUrl !== storedImageUrl;

        if (colorChanged || imageChanged || altitudeChanged) {
          console.log(`🔄 Recreating marker for ${drone.obj_id} (altitude: ${altitude.toFixed(1)}m)`);
          existingMarkerData.marker.remove();
          markersRef.current.delete(drone.obj_id);
          createNewMarker(drone, currentColor);
        } else if (positionChanged) {
          console.log(`🚁 DRONE ${drone.obj_id} MOVED! (altitude: ${altitude.toFixed(1)}m)`);
          
          const markerElement = existingMarkerData.marker.getElement();
          markerElement.classList.add('moving');
          
          existingMarkerData.marker.setLngLat([Number(drone.lng), Number(drone.lat)]);
          
          if (is3DMode.current && altitude > 0) {
            (existingMarkerData.marker as any).setAltitude(altitude);
          }
          
          existingMarkerData.lastLat = Number(drone.lat);
          existingMarkerData.lastLng = Number(drone.lng);
          existingMarkerData.lastAlt = altitude;
          existingMarkerData.popup.setHTML(createPopupHTML(drone));
          
          setTimeout(() => {
            markerElement.classList.remove('moving');
          }, 500);
        } else {
          existingMarkerData.popup.setHTML(createPopupHTML(drone));
        }
      } else {
        console.log(`➕ Creating new 3D marker for ${drone.obj_id} at altitude ${altitude.toFixed(1)}m`);
        createNewMarker(drone, currentColor);
      }
    });

    console.log('=== ✅ 3D Marker update complete ===\n');
  }, [drones]);

  const createNewMarker = (drone: DroneData, droneColor: string) => {
    if (!map.current) return;

    const altitude = calculateAltitude(drone);
    console.log(`📍 Creating 3D marker for ${drone.obj_id} at [${drone.lat}, ${drone.lng}, ${altitude.toFixed(1)}m]`);

    const el = createDroneMarkerElement(drone, altitude);
    
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
    })
      .setLngLat([Number(drone.lng), Number(drone.lat)]);
    
    if (altitude > 0) {
      (marker as any).setAltitude(altitude);
    }
    
    marker.addTo(map.current);

    const popup = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: false,
      closeOnClick: false,
      maxWidth: '420px',
      className: 'drone-popup'
    }).setHTML(createPopupHTML(drone));

    const popupElement = popup.getElement();
    if (popupElement) {
      popupElement.dataset.imageUrl = getImageUrl(drone.image?.publicUrl);
    }

    marker.setPopup(popup);

    el.addEventListener('mouseenter', () => {
      if (!popup.isOpen()) {
        marker.togglePopup();
      }
    });
    
    el.addEventListener('mouseleave', () => {
      if (popup.isOpen()) {
        marker.togglePopup();
      }
    });

    markersRef.current.set(drone.obj_id, { 
      marker, 
      color: droneColor,
      popup,
      lastLat: Number(drone.lat),
      lastLng: Number(drone.lng),
      lastAlt: altitude,
    });

    console.log(`✅ 3D Marker created successfully for ${drone.obj_id}`);
  };

  return (
    <Box
      ref={mapContainer}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* MUI Map Style Toggle Button - Positioned on the Right */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
        }}
      >
        <ToggleButtonGroup
          value={mapStyle}
          exclusive
          onChange={toggleMapStyle}
          aria-label="map style"
          size="small"
        >
          <ToggleButton value="3d" aria-label="3d view">
            <ViewInArIcon sx={{ mr: 0.5 }} fontSize="small" />
            3D Standard
          </ToggleButton>
          <ToggleButton value="2d" aria-label="2d view">
            <SatelliteAltIcon sx={{ mr: 0.5 }} fontSize="small" />
            2D Satellite
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>
    </Box>
  );
}