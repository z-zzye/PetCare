# PetCare React 마이그레이션 가이드

## 개요
현재 Thymeleaf 기반의 헤더를 React로 마이그레이션하기 위한 가이드입니다.

## 현재 구조

### 1. 순수 HTML/JavaScript 헤더
- **파일**: `src/main/resources/templates/fragments/header.html`
- **특징**: Thymeleaf 제거, 순수 HTML/CSS/JavaScript
- **기능**: 
  - 검색 기능
  - 장바구니 카운트
  - 사용자 인증 상태 확인
  - 반응형 디자인

### 2. React 헤더 컴포넌트
- **파일**: `frontend/src/components/Header.jsx`
- **CSS**: `frontend/src/components/Header.css`
- **특징**: React Router 사용, 상태 관리
- **기능**: 
  - 동일한 UI/UX
  - React Hooks 사용
  - 컴포넌트 기반 구조

## 마이그레이션 단계

### 1단계: React 프로젝트 설정
```bash
# React 프로젝트 생성
npx create-react-app petcare-frontend
cd petcare-frontend

# 필요한 패키지 설치
npm install react-router-dom bootstrap @fortawesome/fontawesome-free
```

### 2단계: 헤더 컴포넌트 적용
```jsx
// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/community/*" element={<Community />} />
          <Route path="/shop/*" element={<Shop />} />
          <Route path="/service/*" element={<Service />} />
          <Route path="/mypage/*" element={<MyPage />} />
        </Routes>
      </div>
    </Router>
  );
}
```

### 3단계: API 연동
```jsx
// Header.jsx에서 API 호출 예시
const loadUserInfo = async () => {
  try {
    const response = await fetch('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const userData = await response.json();
    setUserInfo(userData);
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);
  }
};
```

### 4단계: 상태 관리 (선택사항)
```jsx
// Context API 사용 예시
// contexts/AuthContext.js
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

## 주요 변경사항

### 1. 라우팅
- **기존**: `<a href="/path">` 
- **React**: `<Link to="/path">`

### 2. 이벤트 처리
- **기존**: `addEventListener`
- **React**: `onClick`, `onSubmit` 등

### 3. 상태 관리
- **기존**: DOM 조작
- **React**: `useState`, `useEffect`

### 4. 조건부 렌더링
- **기존**: JavaScript로 DOM 조작
- **React**: JSX 조건부 렌더링

## API 엔드포인트

### 백엔드에서 구현해야 할 API
```javascript
// 사용자 관련
GET /api/user/profile          // 사용자 프로필 조회
POST /api/auth/login          // 로그인
POST /api/auth/logout         // 로그아웃

// 장바구니 관련
GET /api/cart/count           // 장바구니 개수 조회
POST /api/cart/add            // 장바구니 추가
DELETE /api/cart/remove       // 장바구니 삭제

// 검색 관련
GET /api/search?q={query}     // 검색 결과
```

## 스타일링

### Bootstrap 사용
```jsx
// index.js 또는 App.js에서
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
```

### Font Awesome 사용
```jsx
// index.js에서
import '@fortawesome/fontawesome-free/css/all.min.css';
```

## 성능 최적화

### 1. 컴포넌트 메모이제이션
```jsx
import { memo } from 'react';

const Header = memo(() => {
  // 컴포넌트 로직
});
```

### 2. 코드 스플리팅
```jsx
import { lazy, Suspense } from 'react';

const Community = lazy(() => import('./pages/Community'));
const Shop = lazy(() => import('./pages/Shop'));

// App.js에서
<Suspense fallback={<div>Loading...</div>}>
  <Routes>
    <Route path="/community/*" element={<Community />} />
    <Route path="/shop/*" element={<Shop />} />
  </Routes>
</Suspense>
```

## 테스트

### Jest + React Testing Library
```jsx
// Header.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

test('헤더가 올바르게 렌더링됩니다', () => {
  render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );
  
  expect(screen.getByText('PetCare')).toBeInTheDocument();
  expect(screen.getByText('커뮤니티')).toBeInTheDocument();
  expect(screen.getByText('쇼핑')).toBeInTheDocument();
});
```

## 배포

### 1. 빌드
```bash
npm run build
```

### 2. Spring Boot 정적 파일 서빙
```java
// Spring Boot 설정
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/");
    }
}
```

## 주의사항

1. **CORS 설정**: 백엔드에서 React 앱의 요청을 허용하도록 CORS 설정 필요
2. **라우팅**: React Router의 BrowserRouter 사용 시 서버에서 모든 경로를 index.html로 리다이렉트 설정 필요
3. **상태 동기화**: localStorage와 React 상태 간의 동기화 주의
4. **API 호출**: 모든 API 호출에 적절한 에러 처리 필요

## 완료 체크리스트

- [x] React 프로젝트 설정
- [x] 헤더 컴포넌트 구현
- [x] 라우팅 설정
- [x] 기본 페이지 구조 생성
- [x] 스타일링 적용 (Bootstrap + Font Awesome)
- [x] 반응형 디자인 구현
- [x] 개발 서버 실행 확인
- [ ] API 연동
- [ ] 상태 관리 구현
- [ ] 테스트 작성
- [ ] 배포 설정
- [ ] 성능 최적화

## 현재 구현된 기능

### ✅ 완료된 기능
1. **반응형 헤더 컴포넌트**
   - 로고 및 네비게이션
   - 검색 기능
   - 장바구니 아이콘
   - 사용자 인증 UI
   - 모바일 햄버거 메뉴

2. **라우팅 시스템**
   - React Router 설정
   - 모든 페이지 경로 정의
   - 네비게이션 구현

3. **홈페이지**
   - 히어로 섹션
   - 서비스 소개 카드
   - 반응형 레이아웃

4. **스타일링**
   - Bootstrap 프레임워크
   - Font Awesome 아이콘
   - 커스텀 CSS
   - 모바일 최적화

### 🔄 다음 단계
1. **백엔드 API 연동**
2. **실제 페이지 구현** (커뮤니티, 쇼핑, 서비스, 마이페이지)
3. **상태 관리 시스템** (Context API 또는 Redux)
4. **테스트 코드 작성**
5. **PWA 기능 추가**
6. **배포 설정**

## 실행 방법

```bash
# frontend 디렉토리로 이동
cd frontend

# 개발 서버 실행
npm start
```

브라우저에서 **http://localhost:3000** 접속 