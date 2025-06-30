import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api', // React devServer proxy 설정을 사용하면 이게 Spring Boot로 연결됨
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 인증 필요 시
});

// 요청 시 토큰 자동 추가 (옵션: 로그인 구현된 경우)
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // FormData인 경우 Content-Type을 자동으로 설정하도록 제거
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// 응답 시 에러 처리 공통화
axiosInstance.interceptors.response.use(
  res => res,
  err => {
    console.error('[Axios Error]', err.response || err);
    
    // 서버에서 보낸 에러 메시지가 있으면 그걸 사용
    if (err.response?.data?.message) {
      alert(err.response.data.message);
    } else {
      alert('요청 처리 중 오류가 발생했습니다.');
    }
    
    return Promise.reject(err);
  }
);

export default axiosInstance;
