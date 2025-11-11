import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'https://tesa-api.crma.dev/api',
  headers: {
    'accept': 'application/json',
  },
});