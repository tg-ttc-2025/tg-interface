// src/hooks/Defense/useTGDefenseDetection.ts

import { useQuery } from '@tanstack/react-query';
import { tgDefenseService } from '../../services/tgDefenseDetectionService';
import type { DroneObject } from '../../types/drone.type';

export const useTGDetections = (
  enabled: boolean = true,
  limit: number = 100
) => {
  return useQuery<DroneObject[], Error>({
    queryKey: ['tg-detections', limit],
    queryFn: () => tgDefenseService.getDetectionHistory(limit, 0),
    enabled: enabled,
    refetchInterval: 10000, // Refetch every 10 seconds for updates
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};

// Hook to get all history for a specific drone
export const useDroneHistory = (
  objId: string,
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: ['drone-history', objId],
    queryFn: () => tgDefenseService.getDetectionsByObjId(objId),
    enabled: enabled && !!objId,
    staleTime: 30000,
  });
};

// Hook to get latest position for a specific drone
export const useLatestDronePosition = (
  objId: string,
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: ['latest-drone', objId],
    queryFn: () => tgDefenseService.getLatestByObjId(objId),
    enabled: enabled && !!objId,
    refetchInterval: 5000,
  });
};