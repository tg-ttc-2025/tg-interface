// src/services/tgDefenseDetectionService.ts

import type { DroneObject, RawDroneDetection } from "../types/drone.type";

export interface TGHistoryResponse {
  data: RawDroneDetection[];  // Changed to use RawDroneDetection which matches API
  total: number;
  limit: number;
  offset: number;
}

// Updated transformer that includes alt and groundHeight at top level AND in rawData
export const transformTGDetectionToDrone = (detection: RawDroneDetection): DroneObject => {
  const primaryImage = detection.images.find(img => img.isPrimary) || detection.images[0];
  
  let speed = 0;
  if (typeof detection.details.speed === 'number') {
    speed = detection.details.speed;
  } else if (typeof detection.details.speed === 'string') {
    const speedMatch = detection.details.speed.match(/[\d.]+/);
    speed = speedMatch ? parseFloat(speedMatch[0]) : 0;
  }

  return {
    // Standard fields with alt and groundHeight at top level
    obj_id: detection.objId,
    type: detection.type,
    lat: Number(detection.lat),
    lng: Number(detection.lng),
    alt: detection.alt,  // Include alt at top level
    groundHeight: detection.groundHeight,  // Include groundHeight at top level
    objective: detection.objective || 'Unknown',
    size: detection.size || 'medium',
    details: {
      color: detection.details.color || 'gray',
      speed: speed,
    },
    image: primaryImage && primaryImage.publicUrl ? {
      publicUrl: primaryImage.publicUrl,
      filename: primaryImage.fileName,
    } : undefined,
    
    // Also include complete raw data for detailed popup
    rawData: {
      id: detection.id,
      alt: detection.alt,
      groundHeight: detection.groundHeight,
      timestamp: detection.timestamp,
      createdAt: detection.createdAt,
      updatedAt: detection.updatedAt,
      images: detection.images.map(img => ({
        id: img.id,
        fileName: img.fileName,
        fileSize: img.fileSize.toString(),
        mimeType: img.mimeType,
        isPrimary: img.isPrimary,
        publicUrl: img.publicUrl || '',
      })),
    },
  };
};

const API_BASE_URL = import.meta.env.VITE_TG_API_URL || 'http://localhost:3000';

export const tgDefenseService = {
  async getDetectionHistory(limit: number = 100, offset: number = 0): Promise<DroneObject[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ttc/api/offense/history?limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: TGHistoryResponse = await response.json();
      
      console.log('🔍 API Response Sample:', data.data[0]); // Debug log
      
      // Transform and include raw detection data
      const transformed = data.data.map(transformTGDetectionToDrone);
      
      console.log('✅ Transformed Sample:', transformed[0]); // Debug log
      
      return transformed;
    } catch (error) {
      console.error('Error fetching detection history:', error);
      throw error;
    }
  },

  async getDetectionsByObjId(objId: string): Promise<RawDroneDetection[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ttc/api/offense/by-obj-id?objId=${objId}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching detections for ${objId}:`, error);
      throw error;
    }
  },

  async getLatestByObjId(objId: string): Promise<RawDroneDetection | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ttc/api/offense/latest-by-obj-id?objId=${objId}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching latest detection for ${objId}:`, error);
      throw error;
    }
  },

  // Delete detection by ID (Thanos Snap 🫰)
  async deleteDetection(id: string): Promise<any> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ttc/api/offense/${id}`,
        {
          method: 'DELETE',
        }
      );
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting detection ${id}:`, error);
      throw error;
    }
  },

  // Delete all detections by objId (Thanos Snap by ObjId 🫰)
  async deleteDetectionsByObjId(objId: string): Promise<any> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ttc/api/offense/by-obj-id/${objId}`,
        {
          method: 'DELETE',
        }
      );
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting detections for ${objId}:`, error);
      throw error;
    }
  },

  // Helper function (now less necessary since publicUrl comes from backend)
  getImageUrl(imagePath: string): string {
    const minioUrl = import.meta.env.VITE_MINIO_URL || 'http://localhost:9000';
    return `${minioUrl}/tg-detections/${imagePath}`;
  },
};

export default tgDefenseService;