export interface CameraInfo {
  id: string;
  name: string;
  location: string;
  token: string;
  sort: number;
  Institute: string;
}

export interface CameraResponse {
  success: boolean;
  data: CameraInfo;
}

/**
 * Fetch camera info from API
 * @param cameraId - Camera ID
 * @param token - Camera token
 */
export async function getCameraInfo(
  cameraId: string, 
  token: string
): Promise<CameraInfo> {
  const response = await fetch(
    `https://tesa-api.crma.dev/api/object-detection/info/${cameraId}`,
    {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-camera-token': token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const result: CameraResponse = await response.json();
  
  if (!result.success) {
    throw new Error('API returned unsuccessful response');
  }

  return result.data;
}
