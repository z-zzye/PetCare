import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api', // React devServer proxy 설정을 사용하면 이게 Spring Boot로 연결됨
  // headers: {
  //   'Content-Type': 'application/json',
  // },
  withCredentials: true, // 쿠키 인증 필요 시
});

// 요청 시 토큰 자동 추가 (옵션: 로그인 구현된 경우)
axiosInstance.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      // AxiosHeaders 객체일 때
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      // 일반 객체일 때
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  if (config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }
  console.log('📡 axios 요청:', config.method?.toUpperCase(), config.url, config);
  return config;
});

// 응답 시 에러 처리 공통화
axiosInstance.interceptors.response.use(
  (res) => {
    // 로그인 응답일 때 토큰 자동 저장
    if (
      res.config.url &&
      (res.config.url.endsWith('/members/login') ||
        res.config.url.endsWith('/api/members/login'))
    ) {
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
    }
    return res;
  },
  (err) => {
    console.error('[Axios Error]', err.response || err);

    // 서버에서 보낸 에러 메시지가 있으면 그걸 사용
    if (err.response?.data?.message) {
      console.error(err.response.data.message);
    } else {
      console.error('요청 처리 중 오류가 발생했습니다.');
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
