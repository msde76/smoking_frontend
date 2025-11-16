import api from './index';

/**
 * (신규) 텍스트 주소 기반으로 회피 경로를 요청합니다.
 * 백엔드에서 Geocoding이 먼저 실행됩니다.
 * (이 함수는 RouteServiceImpl.findRouteByAddress()를 호출합니다.)
 * @param {object} routeRequest - { deviceId, startLatitude, startLongitude, endAddress }
 */
export const findRouteByAddress = (routeRequest) => {
  return api.post('/routes/address', routeRequest);
};

/**
 * (기존) 좌표 기반으로 회피 경로를 요청합니다.
 */
export const fetchAvoidanceRoute = (routeRequest) => {
  return api.post('/routes/avoidance', routeRequest);
};