import { useState, useEffect } from 'react';
import { getCameraInfo } from '../../api/camera/cameraApi';
import type { CameraInfo } from '../../types/camera.type';

export function useCamera(cameraId: string, token: string) {
  const [data, setData] = useState<CameraInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getCameraInfo(cameraId, token);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [cameraId, token]);

  return { data, loading, error };
}








