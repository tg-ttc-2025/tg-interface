// src/types/drone.type.ts

export interface DetectionImage {
  id: string;
  offenseDetectionId: string;
  path: string;
  bucketName: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  uploadTimestamp: string;
  isPrimary: boolean;
  publicUrl: string;
}

// This matches the exact API response structure
export interface RawDroneDetection {
  id: string;
  objId: string;
  type: string;
  lat: string;
  lng: string;
  alt: string;
  groundHeight: string;
  objective: string;
  size: string;
  details: {
    color: string;
    speed: string;
  };
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  images: DetectionImage[];
}

// Raw data structure for the detailed popup
export interface DroneRawData {
  id: string;
  alt?: string;
  groundHeight?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  images: Array<{
    id: string;
    fileName: string;
    fileSize: string;
    mimeType: string;
    isPrimary: boolean;
    publicUrl: string;
  }>;
}

// Updated DroneObject to include alt and groundHeight at the top level
export interface DroneObject {
  obj_id: string;
  type: string;
  lat: number;
  lng: number;
  alt?: string;  // Added at top level
  groundHeight?: string;  // Added at top level
  objective: string;
  size: string;
  details: {
    color: string;
    speed: number;
  };
  image?: {
    publicUrl: string;
    filename: string;
  };
  // Keep rawData for detailed popup
  rawData?: DroneRawData;
}

export interface DroneUpdate extends DroneObject {
  updateId: string;
  lastUpdated: number;
}