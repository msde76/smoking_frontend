import api from './index';

/**
 * 사용자의 신고 내역을 조회합니다.
 * @param {string} deviceId - 기기 ID
 */
export const getMyReports = (deviceId) => {
  return api.get(`/reports/device/${deviceId}`);
};

/**
 * 신고를 생성합니다.
 * @param {object} reportData - { deviceId, reportedLatitude, reportedLongitude, description }
 */
export const createReport = (reportData) => {
  return api.post('/reports', reportData);
};

