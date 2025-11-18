import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { OffenseMoveUpdate } from '../../types/offenseMove.type';


// Define the server URL and namespace
const SOCKET_URL = 'http://localhost:3000'; // Your NestJS backend URL
const NAMESPACE = '/offense'; // This MUST match the namespace in your gateway

export const useOffenseSocket = () => {
  const [allDrones, setAllDrones] = useState<OffenseMoveUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the specified namespace
    const socket: Socket = io(`${SOCKET_URL}${NAMESPACE}`, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Offense socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Offense socket disconnected');
      setIsConnected(false);
    });

    // Listen for single updates
    socket.on('offenseMoveUpdate', (move: any) => {
      const newUpdate: OffenseMoveUpdate = {
        ...move,
        updateId: crypto.randomUUID(), // Add a unique ID for the React key
        lastUpdated: Date.now(),     // Add a timestamp for the "NEW" tag
      };
      // Prepend the new update to the list
      setAllDrones((prevDrones) => [newUpdate, ...prevDrones]);
    });

    // Listen for batch updates
    socket.on('offenseMovesBatchUpdate', (moves: any[]) => {
      const newUpdates: OffenseMoveUpdate[] = moves.map((move) => ({
        ...move,
        updateId: crypto.randomUUID(),
        lastUpdated: Date.now(),
      }));
      // Prepend the batch
      setAllDrones((prevDrones) => [...newUpdates, ...prevDrones]);
    });

    // Listen for the full list of active drones
    socket.on('activeOffenseMoves', (moves: any[]) => {
      const activeDrones: OffenseMoveUpdate[] = moves.map((move) => ({
        ...move,
        updateId: crypto.randomUUID(),
        lastUpdated: Date.now(),
      }));
      // Replace the entire list with the latest active drones
      setAllDrones(activeDrones);
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return { allDrones, isConnected };
};