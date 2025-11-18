import { useQuery } from '@tanstack/react-query';
import { getRecentDetections } from '../../services/defenseDetectionService';

export const useDetections = (
  camId: string, 
  token: string, 
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['detections', camId],
    queryFn: () => getRecentDetections(camId, token),
    enabled: enabled && !!camId && !!token,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });
};