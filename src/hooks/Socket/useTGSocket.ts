import { useEffect, useRef, useState} from 'react';
import { io, Socket } from 'socket.io-client';
import type { TGDetectionObject, DroneObject, transformTGDetectionToDrone } from '../../services/tgDefenseDetectionService';
import { transformTGDetectionToDrone as transform } from '../../services/tgDefenseDetectionService';

interface RealtimeDetection {
  objects: DroneObject[];
  rawDetection: TGDetectionObject;
}

export const useTGSocket = (enabled: boolean = true) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeDetection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      console.log('WebSocket disabled');
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_TG_SOCKET_URL || 'http://localhost:3000';
    
    console.log('🔌 Connecting to TG-SYSTEM WebSocket:', SOCKET_URL);

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('✅ TG-SYSTEM WebSocket connected!');
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ TG-SYSTEM WebSocket disconnected:', reason);
      setIsConnected(false);
      
      // Auto-reconnect if not intentional disconnect
      if (reason === 'io server disconnect') {
        // Server disconnected, manually reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          socketInstance.connect();
        }, 1000);
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ TG-SYSTEM WebSocket connection error:', error.message);
      setError(`Connection error: ${error.message}`);
      setIsConnected(false);
    });

    // Listen for detection updates
    socketInstance.on('detectionUpdate', (detection: TGDetectionObject) => {
      console.log('📡 Received detection update:', detection);
      
      try {
        // Transform to DroneObject format
        const droneObject = transform(detection);
        
        const realtimeDetection: RealtimeDetection = {
          objects: [droneObject],
          rawDetection: detection,
        };
        
        console.log('🔄 Transformed detection:', realtimeDetection);
        setRealtimeData(realtimeDetection);
      } catch (error) {
        console.error('❌ Error transforming detection:', error);
      }
    });

    socketInstance.on('error', (error) => {
      console.error('❌ Socket error:', error);
      setError('Socket error occurred');
    });

    setSocket(socketInstance);

    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketInstance.disconnect();
    };
  }, [enabled]);

  return { 
    realtimeData, 
    isConnected,
    socket,
    error,
  };
};