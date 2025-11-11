import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
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

interface MapProps {
  drones: DroneData[];
  center: [number, number];
  zoom: number;
  onMapMove?: (lng: number, lat: number, zoom: number) => void;
}

export default function MapComponent({ drones, center, zoom, onMapMove }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<number, mapboxgl.Marker>>(new Map());

  // Function to create drone icon
  const createDroneElement = (type: 'ally' | 'enemy', heading: number): HTMLDivElement => {
    const el = document.createElement('div');
    const color = type === 'ally' ? '#2563eb' : '#dc2626';
    
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
        <svg style="width: 48px; height: 48px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.6));" viewBox="0 0 24 24" fill="${color}">
          <path d="M17,12L12,2L7,12L2,7V17L7,12L12,22L17,12L22,17V7L17,12Z" stroke="white" stroke-width="0.5"/>
        </svg>
      </div>
    `;
    
    el.style.cursor = 'pointer';
    return el;
  };

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: center,
      zoom: zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('move', () => {
      if (map.current && onMapMove) {
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();
        onMapMove(center.lng, center.lat, zoom);
      }
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when drones change
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    markersRef.current.forEach((marker, id) => {
      if (!drones.find(d => d.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    drones.forEach((drone) => {
      const existingMarker = markersRef.current.get(drone.id);

      if (existingMarker) {
        // Update existing marker
        existingMarker.setLngLat([drone.longitude, drone.latitude]);
        
        // Update rotation
        const el = existingMarker.getElement();
        const svgContainer = el.querySelector('div') as HTMLDivElement;
        if (svgContainer) {
          svgContainer.style.transform = `rotate(${drone.heading}deg)`;
        }

        // Update popup if exists
        const popup = existingMarker.getPopup();
        if (popup) {
          popup.setHTML(createPopupHTML(drone));
        }
      } else {
        // Create new marker
        const el = createDroneElement(drone.type, drone.heading);

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
        }).setHTML(createPopupHTML(drone));

        const marker = new mapboxgl.Marker(el)
          .setLngLat([drone.longitude, drone.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.set(drone.id, marker);
      }
    });
  }, [drones]);

  const createPopupHTML = (drone: DroneData) => {
    return `
      <div style="padding: 12px; min-width: 200px; background: #1a1a2e; color: white;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: ${
          drone.type === 'ally' ? '#60a5fa' : '#f87171'
        }; border-bottom: 2px solid ${drone.type === 'ally' ? '#2563eb' : '#dc2626'}; padding-bottom: 8px;">
          ${drone.name}
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: rgba(255, 255, 255, 0.6); font-size: 13px;">Type:</span>
            <span style="color: white; font-weight: 600; font-size: 13px;">
              ${drone.type === 'ally' ? '🔵 Allied' : '🔴 Enemy'}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: rgba(255, 255, 255, 0.6); font-size: 13px;">Speed:</span>
            <span style="color: white; font-weight: 600; font-size: 13px;">${drone.speed} km/h</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: rgba(255, 255, 255, 0.6); font-size: 13px;">Altitude:</span>
            <span style="color: white; font-weight: 600; font-size: 13px;">${drone.altitude} m</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: rgba(255, 255, 255, 0.6); font-size: 13px;">Heading:</span>
            <span style="color: white; font-weight: 600; font-size: 13px;">${drone.heading.toFixed(0)}°</span>
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <span style="color: rgba(255, 255, 255, 0.5); font-size: 11px;">
              ${drone.latitude.toFixed(5)}, ${drone.longitude.toFixed(5)}
            </span>
          </div>
        </div>
      </div>
    `;
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