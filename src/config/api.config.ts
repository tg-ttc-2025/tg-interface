export const API_CONFIG = {
  BASE_URL: 'https://tesa-api.crma.dev/api',
  ENDPOINTS: {
    OBJECT_DETECTION: '/object-detection/info',
  },
  HEADERS: {
    ACCEPT: 'application/json',
    CONTENT_TYPE: 'application/json',
  },
} as const;

export const CAMERA_CREDENTIALS = {
  OFFENCE: {
    CAMERA_ID: 'd5fd9af8-098a-4cfb-bf02-8e89026af5f6',
    TOKEN: '6e69670b-687d-439f-8c4e-b50dd087ce18',
  },
  DEFENCE: {
    CAMERA_ID: '02999a4a-361c-498c-a250-d5d70dd39fb8',
    TOKEN: 'df2a423f93a9c512e1bc95ec29e1c44a843c71a3676aba595c891a8ce5e785a0',
  },
} as const;