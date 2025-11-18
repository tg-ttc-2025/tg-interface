// services/offenseMoveService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const OFFENSE_MOVE_API = `${API_BASE_URL}/ttc/api/offense-move`;

export interface OffenseMove {
  id: string;
  codeName: string;
  groupId: number;
  type: string;
  objective: string;
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
  data: OffenseMove[];
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

class OffenseMoveService {
  // Create single offense move
  async create(data: CreateOffenseMoveDto): Promise<OffenseMove> {
    const response = await axios.post<OffenseMove>(OFFENSE_MOVE_API, data);
    return response.data;
  }

  // Create batch offense moves
  async createBatch(data: CreateOffenseMoveDto[]): Promise<OffenseMove[]> {
    const response = await axios.post<OffenseMove[]>(`${OFFENSE_MOVE_API}/batch`, { data });
    return response.data;
  }

  // Get history with pagination
  async getHistory(limit: number = 100, offset: number = 0): Promise<OffenseMoveHistoryResponse> {
    const response = await axios.get<OffenseMoveHistoryResponse>(`${OFFENSE_MOVE_API}/history`, {
      params: { limit, offset },
    });
    return response.data;
  }

  // Get all moves by code name
  async getByCodeName(codeName: string): Promise<OffenseMove[]> {
    const response = await axios.get<OffenseMove[]>(`${OFFENSE_MOVE_API}/by-code-name`, {
      params: { codeName },
    });
    return response.data;
  }

  // Get latest move by code name
  async getLatestByCodeName(codeName: string): Promise<OffenseMove> {
    const response = await axios.get<OffenseMove>(`${OFFENSE_MOVE_API}/latest-by-code-name`, {
      params: { codeName },
    });
    return response.data;
  }

  // Get moves by group ID
  async getByGroupId(groupId: number): Promise<OffenseMove[]> {
    const response = await axios.get<OffenseMove[]>(`${OFFENSE_MOVE_API}/by-group`, {
      params: { groupId },
    });
    return response.data;
  }

  // Get latest moves for all drones
  async getLatestMoves(): Promise<OffenseMove[]> {
    const response = await axios.get<OffenseMove[]>(`${OFFENSE_MOVE_API}/latest`);
    return response.data;
  }

  // Get active drones (last 5 minutes)
  async getActiveDrones(): Promise<OffenseMove[]> {
    const response = await axios.get<OffenseMove[]>(`${OFFENSE_MOVE_API}/active`);
    return response.data;
  }

  // Get moves by objective
  async getByObjective(objective: string): Promise<OffenseMove[]> {
    const response = await axios.get<OffenseMove[]>(`${OFFENSE_MOVE_API}/by-objective`, {
      params: { objective },
    });
    return response.data;
  }

  // Get moves by mission
  async getByMission(mission: string): Promise<OffenseMove[]> {
    const response = await axios.get<OffenseMove[]>(`${OFFENSE_MOVE_API}/by-mission`, {
      params: { mission },
    });
    return response.data;
  }

  // Get moves by time range
  async getByTimeRange(startTime: string, endTime: string): Promise<OffenseMove[]> {
    const response = await axios.get<OffenseMove[]>(`${OFFENSE_MOVE_API}/by-time-range`, {
      params: { startTime, endTime },
    });
    return response.data;
  }

  // Get statistics
  async getStatistics(): Promise<OffenseMoveStatistics> {
    const response = await axios.get<OffenseMoveStatistics>(`${OFFENSE_MOVE_API}/statistics`);
    return response.data;
  }
}

export default new OffenseMoveService();