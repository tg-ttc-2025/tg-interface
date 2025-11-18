import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { OffenseMoveUpdate } from '../../types/offenseMove.type';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface OffenseMoveHistoryResponse {
    data: any[];
    total: number;
    limit: number;
    offset: number;
}

const fetchOffenseMoveHistory = async (limit: number): Promise<OffenseMoveUpdate[]> => {
    try {
        const response = await axios.get<OffenseMoveHistoryResponse>(
            `${API_BASE_URL}/ttc/api/offense-move/history`,
            {
                params: { limit, offset: 0 },
            }
        );

        console.log('📥 Fetched offense move history:', response.data.data.length, 'records');

        // Helper function to safely parse numbers
        const parseNumber = (value: any): number => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                const parsed = parseFloat(value);
                return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
        };

        // Map data to OffenseMoveUpdate type
        return response.data.data.map(move => ({
            id: move.id,
            codeName: move.codeName,
            groupId: typeof move.groupId === 'number' ? move.groupId : parseInt(move.groupId) || 0,
            type: move.type || 'unknown',
            objective: move.objective as OffenseMoveUpdate['objective'], // Type assertion
            color: move.color || 'blue',
            size: parseNumber(move.size),
            speed: parseNumber(move.speed),
            accNoising: move.accNoising === true || move.accNoising === 'true',
            angNoising: move.angNoising === true || move.angNoising === 'true',
            magNoising: move.magNoising === true || move.magNoising === 'true',
            gpsSpoofing: move.gpsSpoofing === true || move.gpsSpoofing === 'true',
            target: move.target,
            mission: move.mission,
            lat: parseNumber(move.lat),
            lng: parseNumber(move.lng),
            alt: move.alt != null ? parseNumber(move.alt) : undefined,
            rowAngle: move.rowAngle != null ? parseNumber(move.rowAngle) : undefined,
            pitchAngle: move.pitchAngle != null ? parseNumber(move.pitchAngle) : undefined,
            yawAngle: move.yawAngle != null ? parseNumber(move.yawAngle) : undefined,
            timestamp: move.timestamp,
            createdAt: move.createdAt,
            updatedAt: move.updatedAt,
            // Compatibility fields for map component
            obj_id: move.codeName,
            updateId: `${move.codeName}-${Date.now()}-${Math.random()}`,
            lastUpdated: new Date(move.timestamp).getTime(),
        }));
    } catch (error) {
        console.error('❌ Error fetching offense move history:', error);
        throw error;
    }
};

export const useOffenseMoveDetection = (enabled: boolean = true, limit: number = 500) => {
    return useQuery({
        queryKey: ['offenseMoveDetections', limit],
        queryFn: () => fetchOffenseMoveHistory(limit),
        enabled,
        staleTime: 30000, // 30 seconds
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
};