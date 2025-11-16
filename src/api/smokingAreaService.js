import api from './index';

export const getSmokingAreas = (minLat, maxLat, minLng, maxLng) => {
  return api.get('/smoking/areas', {
    params: {
      min_lat: minLat,
      max_lat: maxLat,
      min_lng: minLng,
      max_lng: maxLng,
    },
  });
};