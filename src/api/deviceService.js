import api from './index';

export const initDevice = (deviceId) => {
  return api.post('/device/init', null, {
    params: {
      deviceId: deviceId,
    },
  });
};

export const updateVoicePreferences = (deviceId, preferences) => {
  return api.patch(`/device/${deviceId}/preferences`, preferences);
};