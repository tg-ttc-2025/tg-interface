import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

  // Create drone marker HTML - FIXED positioning
  const createDroneMarkerElement = (drone: DroneData): HTMLDivElement => {
    const el = document.createElement('div');
    el.className = 'drone-marker';
    el.dataset.droneId = drone.obj_id;
    
    const droneColor = getColorHex(drone.details.color);

    // Inject global styles only once
    // In createDroneMarkerElement function, update the styles:

if (!document.getElementById('drone-marker-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'drone-marker-styles';
  styleSheet.textContent = `
    /* Remove all transforms - let Mapbox handle positioning */
    .drone-marker {
      width: 50px;
      height: 50px;
      display: block;
      cursor: pointer;
      position: relative;
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
    
    @keyframes rotate {
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
      width: 28px;
      height: 28px;
      background-color: currentColor;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .drone-propeller {
      animation: rotate 1s linear infinite;
      width: 18px;
      height: 18px;
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

    el.innerHTML = `
      <div class="drone-marker-container" style="color: ${droneColor};">
        <div class="pulse-ring"></div>
        <div class="pulse-ring"></div>
        <div class="pulse-ring"></div>
        <div class="drone-icon">
          <svg class="drone-propeller" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L14 8L20 6L16 12L22 14L16 16L20 22L14 20L12 22L10 20L4 22L8 16L2 14L8 12L4 6L10 8L12 2Z"/>
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

    // Fly to the selected drone
    map.current.flyTo({
      center: [drone.lng, drone.lat],
      zoom: 16,
      duration: 1500,
      essential: true
    });

    // Add bounce animation to marker
    const markerData = markersRef.current.get(selectedDroneId);
    if (markerData) {
      const markerElement = markerData.marker.getElement();
      markerElement.classList.add('selected');
      
      // Show popup
      if (!markerData.popup.isOpen()) {
        markerData.marker.togglePopup();
      }

      // Remove animation class after it completes
      setTimeout(() => {
        markerElement.classList.remove('selected');
      }, 600);
    }
  }, [selectedDroneId, drones]);

  // Update drone markers - WITH DETAILED LOGGING
  useEffect(() => {
    if (!map.current) {
      console.log('⚠️ Map not initialized yet');
      return;
    }

    console.log('\n=== 🔄 Updating markers ===');
    console.log('Current drones count:', drones.length);
    console.log('Current drones:', drones.map(d => ({ id: d.obj_id, lat: d.lat, lng: d.lng })));
    console.log('Existing markers:', Array.from(markersRef.current.keys()));

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
      console.log('Drone data:', { 
        lat: drone.lat, 
        lng: drone.lng, 
        color: drone.details.color,
        speed: drone.details.speed 
      });

      const existingMarkerData = markersRef.current.get(drone.obj_id);
      const currentColor = getColorHex(drone.details.color);
      
      if (existingMarkerData) {
        console.log('✓ Marker exists, checking for updates...');
        console.log('Stored position:', { 
          lat: existingMarkerData.lastLat, 
          lng: existingMarkerData.lastLng 
        });
        console.log('New position:', { 
          lat: drone.lat, 
          lng: drone.lng 
        });

        // Check if position changed - convert to numbers to be safe
        const positionChanged = 
          Number(existingMarkerData.lastLat) !== Number(drone.lat) || 
          Number(existingMarkerData.lastLng) !== Number(drone.lng);

        console.log('Position changed?', positionChanged);

        // Check if color changed
        const colorChanged = existingMarkerData.color !== currentColor;
        console.log('Color changed?', colorChanged, `(${existingMarkerData.color} -> ${currentColor})`);

        // Check if image changed
        const imageUrl = getImageUrl(drone.image?.path);
        const storedImagePath = existingMarkerData.popup.getElement()?.dataset.imagePath;
        const imageChanged = imageUrl !== storedImagePath;
        console.log('Image changed?', imageChanged);

        if (colorChanged || imageChanged) {
          console.log('🔄 Recreating marker due to color/image change');
          existingMarkerData.marker.remove();
          markersRef.current.delete(drone.obj_id);
          createNewMarker(drone, currentColor);
        } else if (positionChanged) {
          // SMOOTHLY UPDATE POSITION
          console.log(`🚁 MOVING DRONE ${drone.obj_id}:`);
          console.log(`   FROM: [${existingMarkerData.lastLat}, ${existingMarkerData.lastLng}]`);
          console.log(`   TO:   [${drone.lat}, ${drone.lng}]`);
          
          // Add moving animation
          const markerElement = existingMarkerData.marker.getElement();
          markerElement.classList.add('moving');
          
          // Update marker position with smooth transition
          existingMarkerData.marker.setLngLat([Number(drone.lng), Number(drone.lat)]);
          
          // Update stored position
          existingMarkerData.lastLat = Number(drone.lat);
          existingMarkerData.lastLng = Number(drone.lng);
          
          // Update popup content with new coordinates
          existingMarkerData.popup.setHTML(createPopupHTML(drone));
          
          console.log('✅ Marker position updated successfully');
          
          // Remove animation class after it completes
          setTimeout(() => {
            markerElement.classList.remove('moving');
          }, 500);
        } else {
          console.log('ℹ️ No position change, updating popup only');
          // Just update popup content (in case other data changed)
          existingMarkerData.popup.setHTML(createPopupHTML(drone));
        }
      } else {
        console.log('➕ Marker does not exist, creating new marker');
        // Create new marker
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
    
    // CRITICAL: Use 'center' anchor to fix positioning
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center', // This ensures the marker stays at the exact lat/lng
    })
      .setLngLat([Number(drone.lng), Number(drone.lat)])
      .addTo(map.current);

    // Add popup with drone info
    const popup = new mapboxgl.Popup({ 
      offset: 25,
      closeButton: false,
      closeOnClick: false,
      maxWidth: '300px',
      className: 'drone-popup'
    }).setHTML(createPopupHTML(drone));

    // Store image path in dataset for comparison
    const popupElement = popup.getElement();
    if (popupElement) {
      popupElement.dataset.imagePath = getImageUrl(drone.image?.path);
    }

    marker.setPopup(popup);

    // Show popup on hover
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

    // Store marker with its color, popup, and last position
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