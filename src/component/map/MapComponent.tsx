import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { renderToStaticMarkup } from 'react-dom/server';
import HubIcon from '@mui/icons-material/Hub';

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhdGNoYWxlcm0iLCJhIjoiY21nZnpiYzU3MGRzdTJrczlkd3RxamN4YyJ9.k288gnCNLdLgczawiB79gQ';

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
    path: string;
    filename: string;
  };
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
  selectedDroneId?: string | null;
  onMapMove?: (lng: number, lat: number, zoom: number) => void;
}

export default function MapComponent({ center, zoom, drones = [], selectedDroneId, onMapMove }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, { 
    marker: mapboxgl.Marker; 
    color: string; 
    popup: mapboxgl.Popup;
    lastLat: number;
    lastLng: number;
  }>>(new Map());
  
  // Store trail markers and paths for each drone
  const droneTrailsRef = useRef<Map<string, {
    positions: DronePosition[];
    trailMarkers: mapboxgl.Marker[];
  }>>(new Map());

  // Store path layer IDs for cleanup
  const pathLayersRef = useRef<Set<string>>(new Set());

  // Color mapping for drones
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

  // Get full image URL
  const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) return '';
    if (imagePath.startsWith('/api')) {
      return `https://tesa-api.crma.dev${imagePath}`;
    }
    return imagePath;
  };

  // Create trail marker (smaller, semi-transparent marker for old positions)
  const createTrailMarkerElement = (color: string, index: number): HTMLDivElement => {
    const el = document.createElement('div');
    el.className = 'drone-trail-marker';
    
    const opacity = Math.max(0.5, 1 - (index * 0.15));
    const size = Math.max(12, 20 - (index * 2));
    
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
          width: ${size - 8}px;
          height: ${size - 8}px;
          background-color: white;
          border-radius: 50%;
          opacity: 0.5;
        "></div>
      </div>
    `;
    
    return el;
  };

  // Draw path line using Mapbox layers
  const drawPathLineWithMapbox = (droneId: string, fromLat: number, fromLng: number, toLat: number, toLng: number, color: string) => {
    if (!map.current) {
        console.log('❌ Map not available for drawing path');
        return;
    }

    const timestamp = Date.now();
    const sourceId = `path-source-${droneId}-${timestamp}`;
    const lineLayerId = `path-line-${droneId}-${timestamp}`;
    const arrowLayerId = `path-arrow-${droneId}-${timestamp}`;

    console.log(`🎨 Drawing Mapbox path from [${fromLat}, ${fromLng}] to [${toLat}, ${toLng}] with color ${color}`);

    try {
        // Add source
        map.current.addSource(sourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {
                    color: color
                },
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [fromLng, fromLat],
                        [toLng, toLat]
                    ]
                }
            }
        });

        // Add animated dashed line layer
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
                'line-width': 4,
                'line-opacity': 0.9,
                'line-dasharray': [2, 1],
                'line-blur': 0.5
            }
        });

        // Add arrow symbols along the path
        map.current.addLayer({
            id: arrowLayerId,
            type: 'symbol',
            source: sourceId,
            layout: {
                'symbol-placement': 'line',
                'symbol-spacing': 50,
                'icon-image': 'arrow-15', // Built-in Mapbox arrow icon
                'icon-size': 1.5,
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'icon-rotation-alignment': 'map',
            },
            paint: {
                'icon-color': color,
                'icon-opacity': 1
            }
        });

        // Store layer IDs
        pathLayersRef.current.add(lineLayerId);
        pathLayersRef.current.add(arrowLayerId);

        console.log('✅ Mapbox path line and arrows added successfully');

        // Animate the line (optional)
        let dashOffset = 0;
        const animate = () => {
            if (map.current && map.current.getLayer(lineLayerId)) {
                dashOffset -= 0.1;
                map.current.setPaintProperty(lineLayerId, 'line-dasharray', [2, 1]);
                requestAnimationFrame(animate);
            }
        };
        // animate(); // Uncomment for animation

        // Remove after 60 seconds
        setTimeout(() => {
            if (map.current) {
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
                    console.log('🗑️ Removed Mapbox path layers');
                } catch (error) {
                    console.error('Error removing layers:', error);
                }
            }
        }, 60000);

    } catch (error) {
        console.error('❌ Error creating path line:', error);
    }
};

 const createDroneMarkerElement = (drone: DroneData): HTMLDivElement => {
    const el = document.createElement('div');
    el.className = 'drone-marker';
    el.dataset.droneId = drone.obj_id;
    
    const droneColor = getColorHex(drone.details.color);

    // Inject global styles only once
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
            transform: translateY(-2px) rotate(2deg);
          }
          75% {
            transform: translateY(-2px) rotate(-2deg);
          }
        }

        @keyframes propeller-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
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
          animation: drone-float 3s ease-in-out infinite;
          width: 20px;
          height: 20px;
        }

        .mapboxgl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .mapboxgl-popup-tip {
          display: none;
        }
      `;
      document.head.appendChild(styleSheet);
    }

    // Use real drone SVG from healthicons
el.innerHTML = `
  <div class="drone-marker-container" style="color: ${droneColor};">
    <div class="pulse-ring"></div>
    <div class="pulse-ring"></div>
    <div class="pulse-ring"></div>
    <div class="drone-icon">
    <svg style="color: white" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10H14M10 10V14M10 10L6.50003 6.50003M14 10V14M14 10L17.5 6.50003M14 14H10M14 14L17.5 17.5M10 14L6.50003 17.5M9.96003 6.00003C9.86807 5.3566 9.59875 4.75148 9.18226 4.25249C8.76576 3.75349 8.21855 3.38033 7.60192 3.17481C6.9853 2.96929 6.32363 2.93954 5.69105 3.08888C5.05846 3.23823 4.47997 3.56077 4.02037 4.02037C3.56077 4.47997 3.23823 5.05846 3.08888 5.69105C2.93954 6.32363 2.96929 6.9853 3.17481 7.60192C3.38033 8.21855 3.75349 8.76576 4.25249 9.18226C4.75148 9.59875 5.3566 9.86807 6.00003 9.96003M18 9.96003C18.6435 9.86807 19.2486 9.59875 19.7476 9.18226C20.2466 8.76576 20.6197 8.21855 20.8252 7.60192C21.0308 6.9853 21.0605 6.32363 20.9112 5.69105C20.7618 5.05846 20.4393 4.47997 19.9797 4.02037C19.5201 3.56077 18.9416 3.23823 18.309 3.08888C17.6764 2.93954 17.0148 2.96929 16.3981 3.17481C15.7815 3.38033 15.2343 3.75349 14.8178 4.25249C14.4013 4.75148 14.132 5.3566 14.04 6.00003M14.04 18C14.132 18.6435 14.4013 19.2486 14.8178 19.7476C15.2343 20.2466 15.7815 20.6197 16.3981 20.8252C17.0148 21.0308 17.6764 21.0605 18.309 20.9112C18.9416 20.7618 19.5201 20.4393 19.9797 19.9797C20.4393 19.5201 20.7618 18.9416 20.9112 18.309C21.0605 17.6764 21.0308 17.0148 20.8252 16.3981C20.6197 15.7815 20.2466 15.2343 19.7476 14.8178C19.2486 14.4013 18.6435 14.132 18 14.04M6.00003 14.04C5.3566 14.132 4.75148 14.4013 4.25249 14.8178C3.75349 15.2343 3.38033 15.7815 3.17481 16.3981C2.96929 17.0148 2.93954 17.6764 3.08888 18.309C3.23823 18.9416 3.56077 19.5201 4.02037 19.9797C4.47997 20.4393 5.05846 20.7618 5.69105 20.9112C6.32363 21.0605 6.9853 21.0308 7.60192 20.8252C8.21855 20.6197 8.76576 20.2466 9.18226 19.7476C9.59875 19.2486 9.86807 18.6435 9.96003 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    </div>
  </div>
`;

    return el;
  };

  // Create popup HTML with image
  const createPopupHTML = (drone: DroneData): string => {
    const droneColor = getColorHex(drone.details.color);
    const imageUrl = getImageUrl(drone.image?.path);
    
    return `
      <div style="
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        border: 2px solid ${droneColor};
        border-radius: 12px;
        color: white;
        font-family: 'Inter', sans-serif;
        min-width: 280px;
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

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('🗺️ Initializing map');

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: center,
      zoom: zoom,
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
    });

    return () => {
      if (map.current) {
        console.log('🗑️ Cleaning up map');
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle selected drone (fly to location)
  useEffect(() => {
    if (!map.current || !selectedDroneId) return;

    const drone = drones.find(d => d.obj_id === selectedDroneId);
    if (!drone) return;

    console.log(`🎯 Flying to selected drone: ${selectedDroneId}`);

    map.current.flyTo({
      center: [drone.lng, drone.lat],
      zoom: 16,
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

  // Update drone markers WITH TRAIL AND VISIBLE PATHS
  useEffect(() => {
    if (!map.current) {
      console.log('⚠️ Map not initialized yet');
      return;
    }

    console.log('\n=== 🔄 Updating markers with trail ===');
    console.log('Drones count:', drones.length);
    console.log('Drones:', drones.map(d => ({ id: d.obj_id, lat: d.lat, lng: d.lng })));

    const currentDroneIds = new Set(drones.map(d => d.obj_id));
    
    // Remove markers for drones that no longer exist
    markersRef.current.forEach((markerData, droneId) => {
      if (!currentDroneIds.has(droneId)) {
        console.log(`🗑️ Removing marker: ${droneId}`);
        markerData.marker.remove();
        markersRef.current.delete(droneId);
      }
    });

    // Add or update markers for current drones
    drones.forEach((drone) => {
      console.log(`\n--- Processing drone: ${drone.obj_id} ---`);
      console.log('Drone position:', { lat: drone.lat, lng: drone.lng });

      const existingMarkerData = markersRef.current.get(drone.obj_id);
      const currentColor = getColorHex(drone.details.color);
      
      if (existingMarkerData) {
        console.log('Existing marker found');
        console.log('Stored position:', { lat: existingMarkerData.lastLat, lng: existingMarkerData.lastLng });
        console.log('New position:', { lat: drone.lat, lng: drone.lng });

        const positionChanged = 
          Number(existingMarkerData.lastLat) !== Number(drone.lat) || 
          Number(existingMarkerData.lastLng) !== Number(drone.lng);

        console.log('Position changed?', positionChanged);

        const colorChanged = existingMarkerData.color !== currentColor;
        const imageUrl = getImageUrl(drone.image?.path);
        const storedImagePath = existingMarkerData.popup.getElement()?.dataset.imagePath;
        const imageChanged = imageUrl !== storedImagePath;

        if (colorChanged || imageChanged) {
          console.log('🔄 Recreating marker due to color/image change');
          existingMarkerData.marker.remove();
          markersRef.current.delete(drone.obj_id);
          createNewMarker(drone, currentColor);
        } else if (positionChanged) {
          console.log(`🚁 DRONE ${drone.obj_id} MOVED!`);
          console.log(`   FROM: [${existingMarkerData.lastLat}, ${existingMarkerData.lastLng}]`);
          console.log(`   TO:   [${drone.lat}, ${drone.lng}]`);
          
          // CREATE TRAIL MARKER at old position
          const trailEl = createTrailMarkerElement(currentColor, 0);
          const trailMarker = new mapboxgl.Marker({
            element: trailEl,
            anchor: 'center',
          })
            .setLngLat([Number(existingMarkerData.lastLng), Number(existingMarkerData.lastLat)])
            .addTo(map.current!);

          // Add popup to trail marker
          const trailPopup = new mapboxgl.Popup({
            offset: 15,
            closeButton: false,
          }).setHTML(`
            <div style="padding: 8px; background: rgba(0,0,0,0.8); color: white; border-radius: 6px; font-size: 11px;">
              <strong>${drone.obj_id}</strong> - Previous Position<br/>
              📍 ${existingMarkerData.lastLat.toFixed(6)}, ${existingMarkerData.lastLng.toFixed(6)}
            </div>
          `);
          trailMarker.setPopup(trailPopup);

          // Store trail data
          if (!droneTrailsRef.current.has(drone.obj_id)) {
            droneTrailsRef.current.set(drone.obj_id, {
              positions: [],
              trailMarkers: []
            });
          }
          
          const trailData = droneTrailsRef.current.get(drone.obj_id)!;
          trailData.positions.push({
            lat: existingMarkerData.lastLat,
            lng: existingMarkerData.lastLng,
            timestamp: Date.now()
          });
          trailData.trailMarkers.push(trailMarker);

          // 🎨 DRAW PATH LINE using Mapbox layers
          console.log('📐 About to draw path line...');
          drawPathLineWithMapbox(
            drone.obj_id,
            existingMarkerData.lastLat,
            existingMarkerData.lastLng,
            drone.lat,
            drone.lng,
            currentColor
          );

          // Update main drone marker position
          const markerElement = existingMarkerData.marker.getElement();
          markerElement.classList.add('moving');
          existingMarkerData.marker.setLngLat([Number(drone.lng), Number(drone.lat)]);
          existingMarkerData.lastLat = Number(drone.lat);
          existingMarkerData.lastLng = Number(drone.lng);
          existingMarkerData.popup.setHTML(createPopupHTML(drone));
          
          console.log('✅ Trail marker created and path line drawn!');
          
          setTimeout(() => {
            markerElement.classList.remove('moving');
          }, 500);
        } else {
          console.log('ℹ️ No changes, updating popup only');
          existingMarkerData.popup.setHTML(createPopupHTML(drone));
        }
      } else {
        console.log('➕ Creating new marker');
        createNewMarker(drone, currentColor);
      }
    });

    console.log('=== ✅ Marker update complete ===\n');
  }, [drones]);

  // Helper function to create new marker
  const createNewMarker = (drone: DroneData, droneColor: string) => {
    if (!map.current) return;

    console.log(`📍 Creating new marker for ${drone.obj_id} at [${drone.lat}, ${drone.lng}]`);

    const el = createDroneMarkerElement(drone);
    
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
    })
      .setLngLat([Number(drone.lng), Number(drone.lat)])
      .addTo(map.current);

    const popup = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: false,
      closeOnClick: false,
      maxWidth: '300px',
      className: 'drone-popup'
    }).setHTML(createPopupHTML(drone));

    const popupElement = popup.getElement();
    if (popupElement) {
      popupElement.dataset.imagePath = getImageUrl(drone.image?.path);
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
    });

    console.log(`✅ Marker created successfully for ${drone.obj_id}`);
  };

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    />
  );
}