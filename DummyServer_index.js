const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// ================================================================
// 🏥 1. 인메모리 데이터베이스 (DB)
// ================================================================

// 임의 동물병원
const dummyHospitals = [
  // --- 5km 이내 (3곳) ---
  {
    id: 'H001',
    name: '가나동물병원',
    address: '인천 부평구 부평동',
    phone: '032-111-1111',
    lat: 37.4933,
    lng: 126.7226,
    priceList: {
      DOG_COMPREHENSIVE: 45000,
      DOG_RABIES: 30000,
      DOG_ANTIBODY_TEST: 60000,
      CAT_COMPREHENSIVE: 40000,
      CAT_LEUKEMIA: 35000,
      CAT_RABIES: 30000,
      CAT_ANTIBODY_TEST: 65000,
    },
  },
  {
    id: 'H002',
    name: '다라동물병원',
    address: '인천 남동구 간석동',
    phone: '032-222-2222',
    lat: 37.4654,
    lng: 126.7093,
    priceList: {
      DOG_COMPREHENSIVE: 50000,
      DOG_RABIES: 30000,
      DOG_ANTIBODY_TEST: 65000,
      CAT_COMPREHENSIVE: 45000,
      CAT_LEUKEMIA: 40000,
      CAT_RABIES: 30000,
      CAT_ANTIBODY_TEST: 70000,
    },
  },
  {
    id: 'H003',
    name: '마바동물병원',
    address: '인천 남동구 구월동',
    phone: '032-333-3333',
    lat: 37.4511,
    lng: 126.7058,
    priceList: {
      DOG_COMPREHENSIVE: 42000,
      DOG_RABIES: 25000,
      DOG_ANTIBODY_TEST: 55000,
      CAT_COMPREHENSIVE: 38000,
      CAT_LEUKEMIA: 32000,
      CAT_RABIES: 25000,
      CAT_ANTIBODY_TEST: 60000,
    },
  },

  // --- 5km ~ 10km (2곳) ---
  {
    id: 'H004',
    name: '사아동물병원',
    address: '인천 연수구 송도동',
    phone: '032-444-4444',
    lat: 37.43,
    lng: 126.68,
    priceList: {
      DOG_COMPREHENSIVE: 55000,
      DOG_RABIES: 35000,
      DOG_ANTIBODY_TEST: 75000,
      CAT_COMPREHENSIVE: 50000,
      CAT_LEUKEMIA: 48000,
      CAT_RABIES: 35000,
      CAT_ANTIBODY_TEST: 80000,
    },
  },
  {
    id: 'H005',
    name: '자차동물병원',
    address: '인천 서구 청라동',
    phone: '032-555-5555',
    lat: 37.5383,
    lng: 126.6451,
    priceList: {
      DOG_COMPREHENSIVE: 52000,
      DOG_RABIES: 33000,
      DOG_ANTIBODY_TEST: 70000,
      CAT_COMPREHENSIVE: 48000,
      CAT_LEUKEMIA: 45000,
      CAT_RABIES: 33000,
      CAT_ANTIBODY_TEST: 75000,
    },
  },
];

// 데이터 파일 경로 설정
const DB_FILE_PATH = path.join(__dirname, 'db.json');

// 병원별 예약 스케줄을 저장할 배열
let hospitalSchedules = [];

// 변경된 스케줄을 파일에 저장하는 함수
function saveSchedulesToFile() {
  fs.writeFileSync(
    DB_FILE_PATH,
    JSON.stringify(hospitalSchedules, null, 2),
    'utf8'
  );
  console.log(
    `[파일 저장] ${new Date().toISOString()} - 스케줄 데이터를 db.json에 저장했습니다.`
  );
}

// 서버 시작 시 스케줄 데이터를 생성 또는 로드하는 함수
function initializeSchedules() {
  // ✅ db.json 파일이 있으면, 데이터를 읽어온다.
  if (fs.existsSync(DB_FILE_PATH)) {
    console.log('기존 db.json 파일에서 스케줄을 로드합니다.');
    const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
    hospitalSchedules = JSON.parse(data);
    console.log(
      `총 ${hospitalSchedules.length}개의 스케줄을 파일에서 로드했습니다.`
    );
    return;
  }

  // ✅ 파일이 없으면, 새로 생성하고 저장한다.
  console.log(
    '가상 병원 스케줄을 새로 초기화하고 db.json 파일을 생성합니다...'
  );
  const timeSlots = ['MORNING', 'AFTERNOON', 'EVENING'];
  const today = new Date();

  dummyHospitals.forEach((hospital) => {
    for (let i = 0; i < 150; i++) {
      // 앞으로 150일 치 데이터 생성
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateString = targetDate.toISOString().split('T')[0];

      timeSlots.forEach((slot) => {
        hospitalSchedules.push({
          hospitalId: hospital.id,
          targetDate: dateString,
          timeSlot: slot,
          isAvailable: true, // 초기 상태는 모두 '예약 가능'
        });
      });
    }
  });

  saveSchedulesToFile(); // ✅ 생성된 초기 데이터를 파일에 저장
  console.log(
    `총 ${hospitalSchedules.length}개의 스케줄 슬롯이 생성 및 저장되었습니다.`
  );
}

// ================================================================
// ⚙️ 2. 핵심 로직 함수
// ================================================================

// Haversine 공식을 사용한 거리 계산 함수 (km 단위)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 슬롯 상태 조회 함수 (디버깅용)
function getSlotStatus(hospitalId, targetDate, timeSlot) {
  const slot = hospitalSchedules.find(
    (s) =>
      s.hospitalId === hospitalId &&
      s.targetDate === targetDate &&
      s.timeSlot === timeSlot
  );
  return slot ? slot.isAvailable : null;
}

// ================================================================
// 📡 3. API 엔드포인트
// ================================================================

/**
 * @description 특정 위치와 반경 내에서, 지정된 날짜에 예약 가능한 모든 병원/시간 슬롯 목록을 반환
 * @query lat, lng, radius (km), targetDate (YYYY-MM-DD)
 */
app.get('/api/hospitals/check-availability', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius);
  const { targetDate } = req.query;
  console.log(
    `[예약 가능 조회] ${new Date().toISOString()} - 위치: ${lat},${lng}, 반경: ${radius}km, 날짜: ${targetDate}`
  );

  // 1. 반경 내 병원 필터링
  const nearbyHospitals = dummyHospitals.filter(
    (h) => getDistance(lat, lng, h.lat, h.lng) <= radius
  );
  const nearbyHospitalIds = nearbyHospitals.map((h) => h.id);

  // 2. 해당 병원들의, 지정된 날짜에, 예약 가능한 슬롯만 필터링
  const availableSlots = hospitalSchedules.filter(
    (s) =>
      nearbyHospitalIds.includes(s.hospitalId) &&
      s.targetDate === targetDate &&
      s.isAvailable === true
  );

  // 3. 프론트엔드에 전달하기 좋은 형태로 데이터 가공
  const result = availableSlots.map((s) => {
    const hospitalInfo = dummyHospitals.find((h) => h.id === s.hospitalId);
    const distance = getDistance(lat, lng, hospitalInfo.lat, hospitalInfo.lng);

    return {
      hospitalId: s.hospitalId,
      hospitalName: hospitalInfo.name,
      targetDate: s.targetDate,
      timeSlot: s.timeSlot,
      distance: distance,
      address: hospitalInfo.address,
      phone: hospitalInfo.phone,
      priceList: hospitalInfo.priceList,
    };
  });

  console.log(
    `[예약 가능 조회 결과] ${result.length}개의 예약 가능한 슬롯을 찾았습니다.`
  );
  res.status(200).json(result);
});

/**
 * @description 특정 병원의 특정 시간 슬롯을 예약 처리 (상태 변경)
 * @body hospitalId, targetDate, timeSlot
 */
app.post('/api/hospitals/reserve-slot', (req, res) => {
  const { hospitalId, targetDate, timeSlot } = req.body;
  console.log(
    `[예약 요청] ${new Date().toISOString()} - 병원ID: ${hospitalId}, 날짜: ${targetDate}, 시간: ${timeSlot}`
  );

  // 요청 전 슬롯 상태 로그
  const beforeStatus = getSlotStatus(hospitalId, targetDate, timeSlot);
  console.log(
    `[예약 요청 전 상태] 병원ID: ${hospitalId}, 날짜: ${targetDate}, 시간: ${timeSlot} - 예약가능: ${beforeStatus}`
  );

  const slot = hospitalSchedules.find(
    (s) =>
      s.hospitalId === hospitalId &&
      s.targetDate === targetDate &&
      s.timeSlot === timeSlot
  );

  if (!slot || !slot.isAvailable) {
    console.log(
      `[예약 실패] ${new Date().toISOString()} - 이미 예약되었거나 존재하지 않는 슬롯. 병원ID: ${hospitalId}, 날짜: ${targetDate}, 시간: ${timeSlot}`
    );
    return res
      .status(409)
      .json({ success: false, message: '이미 예약된 시간대입니다.' });
  }

  slot.isAvailable = false; // '예약 불가능'으로 상태 변경
  saveSchedulesToFile(); // 상태 변경 후 파일에 저장

  // 요청 후 슬롯 상태 로그
  const afterStatus = getSlotStatus(hospitalId, targetDate, timeSlot);
  console.log(
    `[예약 성공] ${new Date().toISOString()} - 병원ID: ${hospitalId}, 날짜: ${targetDate}, 시간: ${timeSlot} - 예약가능: ${afterStatus} (변경됨)`
  );

  const hospitalInfo = dummyHospitals.find((h) => h.id === hospitalId);
  res.status(200).json({
    success: true,
    message: '예약 가능한 시간을 확보했습니다.',
    hospitalId: hospitalInfo.id,
    hospitalName: hospitalInfo.name,
    address: hospitalInfo.address,
    confirmedDateTime: `${targetDate}T${
      timeSlot === 'MORNING'
        ? '10:30'
        : timeSlot === 'AFTERNOON'
        ? '15:00'
        : '19:00'
    }:00`,
  });
});

/**
 * @description 예약 보류/실패 시, 예약했던 슬롯을 다시 '예약 가능' 상태로 원복
 * @body hospitalId, targetDate, timeSlot
 */
app.post('/api/hospitals/cancel-slot', (req, res) => {
  const { hospitalId, targetDate, timeSlot } = req.body;
  console.log(
    `[예약 슬롯 취소] ${new Date().toISOString()} - 병원ID: ${hospitalId}, 날짜: ${targetDate}, 시간: ${timeSlot}`
  );

  // 요청 전 슬롯 상태 로그
  const beforeStatus = getSlotStatus(hospitalId, targetDate, timeSlot);
  console.log(
    `[취소 요청 전 상태] 병원ID: ${hospitalId}, 날짜: ${targetDate}, 시간: ${timeSlot} - 예약가능: ${beforeStatus}`
  );

  const slot = hospitalSchedules.find(
    (s) =>
      s.hospitalId === hospitalId &&
      s.targetDate === targetDate &&
      s.timeSlot === timeSlot
  );

  if (slot) {
    slot.isAvailable = true; // '예약 가능'으로 상태 원복
    saveSchedulesToFile(); // 상태 변경 후 파일에 저장

    // 요청 후 슬롯 상태 로그
    const afterStatus = getSlotStatus(hospitalId, targetDate, timeSlot);
    console.log(
      `[취소 성공] ${new Date().toISOString()} - 병원ID: ${hospitalId}, 날짜: ${targetDate}, 시간: ${timeSlot} - 예약가능: ${afterStatus} (변경됨)`
    );
  } else {
    console.log(
      `[취소 실패] ${new Date().toISOString()} - 해당 슬롯을 찾을 수 없습니다. 병원ID: ${hospitalId}, 날짜: ${targetDate}, 시간: ${timeSlot}`
    );
  }
  res.status(200).json({ success: true });
});

// ================================================================
// 🚀 4. 서버 실행
// ================================================================
app.listen(port, () => {
  initializeSchedules(); // 서버 시작 시 스케줄 데이터 생성
  console.log(
    `🏥 병원 더미 서버가 http://localhost:${port} 에서 실행 중입니다.`
  );
  console.log(`📝 상세 로그가 활성화되어 슬롯 상태 변경을 추적할 수 있습니다.`);
});
