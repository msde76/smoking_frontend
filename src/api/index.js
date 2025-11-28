import axios from 'axios';

// 🛑 중요: 백엔드 서버가 실행 중인 *컴퓨터의 IP 주소*
const API_BASE_URL = 'http://192.168.219.100:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;