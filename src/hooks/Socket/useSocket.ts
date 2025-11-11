// In src/hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { DetectionResponse } from '../../services/defenseDetectionService';


export const useSocket = (camId: string, enabled: boolean = true) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [realtimeData, setRealtimeData] = useState<DetectionResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !camId) return;

    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'https://tesa-api.crma.dev', {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected!');
      setIsConnected(true);
      socketInstance.emit('subscribe_camera', { cam_id: camId });
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('object_detection', (data: any) => {
      console.log('Received socket data:', data);
      
      // Handle both nested and flat data structures
      const rawData = data.data || data;
      const image = rawData.image;
      const objects = rawData.objects || [];
      
      console.log('Parsed objects:', objects);
      console.log('Parsed image:', image);
      
      // Transform data to match DetectionResponse format
      const transformedData: DetectionResponse = {
        cam_id: rawData.cam_id,
        timestamp: rawData.timestamp,
        camera: rawData.camera,
        image: image,
        objects: objects.map((obj: any) => ({
          ...obj,
          image: image, // Attach image to each object
        })),
      };
      
      console.log('🔄 Transformed data:', transformedData);
      setRealtimeData(transformedData);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit('unsubscribe_camera', { cam_id: camId });
      socketInstance.disconnect();
    };
  }, [camId, enabled]);

  return { 
    realtimeData, 
    isConnected,
    socket 
  };
};