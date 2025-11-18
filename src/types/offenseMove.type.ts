// types/offenseMove.type.ts

export interface OffenseMoveUpdate {
    id: string;
    codeName: string;
    groupId: number;
    type: string;
    objective: 'attacker' | 'defender' | 'reconnaissance' | 'patrol' | 'escort';
    color?: string;
    size?: number;
    speed?: number;
    accNoising: boolean;
    angNoising: boolean;
    magNoising: boolean;
    gpsSpoofing: boolean;
    target?: string;
    mission?: string;
    lat: number;
    lng: number;
    alt?: number;
    rowAngle?: number;
    pitchAngle?: number;
    yawAngle?: number;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
    // Compatibility fields
    obj_id?: string;
    updateId?: string;
    lastUpdated?: number;
}

export interface CreateOffenseMoveDto {
    codeName: string;
    groupId: number;
    type?: string;
    objective: string;
    color?: string;
    size?: number;
    speed?: number;
    accNoising?: boolean;
    angNoising?: boolean;
    magNoising?: boolean;
    gpsSpoofing?: boolean;
    target?: string;
    mission?: string;
    lat: number;
    lng: number;
    alt?: number;
    rowAngle?: number;
    pitchAngle?: number;
    yawAngle?: number;
}

export interface OffenseMoveHistoryResponse {
    data: OffenseMoveUpdate[];
    total: number;
    limit: number;
    offset: number;
}

export interface OffenseMoveStatistics {
    total: number;
    uniqueDrones: number;
    byObjective: Array<{ objective: string; count: string }>;
    byType: Array<{ type: string; count: string }>;
}

export type ObjectiveType = 'attacker' | 'defender' | 'reconnaissance' | 'patrol' | 'escort';
export type MissionStatus = 'complete' | 'in-progress' | 'pending' | 'failed';