export interface CameraInfo {
  id: string;
  name: string;
  location: string;
  token: string;
  sort: number;
  Institute: string;
}

export interface CameraApiResponse {
  success: boolean;
  data: CameraInfo;
}

export interface ObjectDetection {
  id: string;
  type: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: string;
}

export interface CameraError {
  message: string;
  code?: string;
  success?: boolean;
}