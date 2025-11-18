import { axiosInstance } from '../api/axiosInstance';

export interface DroneObject {
  obj_id: string;
  type: string;
  lat: number;
  lng: number;
  objective: string;
  size: string;
  details: {
    color: string;
    speed: number;
  };
  image?: {
    path: string;
    filename: string;
    originalname?: string;
    mimetype?: string;
    size?: number;
  };
  lastUpdated?: number; 
}

export interface DetectionResponse {
  timestamp: string;
  objects: DroneObject[];
  cam_id: string;
  camera?: {
    id: string;
    name: string;
    location: string;
    token: string;
    sort: number;
    Institute: string;
  };
  image?: {
    path: string;
    filename: string;
    originalname?: string;
    mimetype?: string;
    size?: number;
  };
}
export const getRecentDetections = async (
  camId: string, 
  token: string
): Promise<DetectionResponse> => {
  const response = await axiosInstance.get(`/object-detection/${camId}/recent`, {
    headers: {
      'x-camera-token': token,
    },
  });
  return response.data;
};