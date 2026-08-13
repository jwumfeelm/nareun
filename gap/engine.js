/* ============================================================
   네 개의 판정 — 계산 엔진
   사주 / 별자리(태양·달·상승) / MBTI / 심리테스트 → 5축 좌표
   ============================================================ */

const STEM = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCH = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const STEM_KR = ['갑','을','병','정','무','기','경','신','임','계'];
const BRANCH_KR = ['자','축','인','묘','진','사','오','미','신','유','술','해'];

// 천간 오행 (0목 1화 2토 3금 4수)
const STEM_EL = [0,0,1,1,2,2,3,3,4,4];
const EL_KR = ['목','화','토','금','수'];
const EL_HANJA = ['木','火','土','金','水'];

// 지장간 분포 — [오행index, 비중]
const BRANCH_HIDDEN = [
  [[4,1.00]],                        // 子
  [[2,0.60],[4,0.20],[3,0.20]],      // 丑
  [[0,0.60],[1,0.25],[2,0.15]],      // 寅
  [[0,1.00]],                        // 卯
  [[2,0.60],[0,0.20],[4,0.20]],      // 辰
  [[1,0.60],[2,0.25],[3,0.15]],      // 巳
  [[1,0.75],[2,0.25]],               // 午
  [[2,0.60],[1,0.20],[0,0.20]],      // 未
  [[3,0.60],[4,0.25],[2,0.15]],      // 申
  [[3,1.00]],                        // 酉
  [[2,0.60],[3,0.20],[1,0.20]],      // 戌
  [[4,0.75],[0,0.25]]                // 亥
];

const RAD = Math.PI / 180;
const norm360 = d => ((d % 360) + 360) % 360;

/* ---------- 율리우스일 ---------- */
function toJD(y, m, d, h, mi) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  const jdn = d + Math.floor((153 * mm + 2) / 5) + 365 * yy
    + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  return jdn + (h - 12) / 24 + mi / 1440;
}

/* ---------- 태양 황경 (오차 ~0.01°) ---------- */
function sunLongitude(jd) {
  const n = jd - 2451545.0;
  const L = 280.460 + 0.9856474 * n;
  const g = (357.528 + 0.9856003 * n) * RAD;
  return norm360(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
}

/* ---------- 달 황경 (오차 ~0.3°) ---------- */
function moonLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const Lp = 218.316 + 481267.881 * T;
  const D  = (297.850 + 445267.115 * T) * RAD;
  const M  = (134.963 + 477198.867 * T) * RAD;
  const Ms = (357.529 + 35999.050 * T) * RAD;
  return norm360(Lp
    + 6.289 * Math.sin(M)
    + 1.274 * Math.sin(2 * D - M)
    + 0.658 * Math.sin(2 * D)
    - 0.186 * Math.sin(Ms)
    - 0.214 * Math.sin(2 * M)
    - 0.114 * Math.sin(2 * (93.272 + 483202.017 * T) * RAD));
}

/* ---------- 상승궁 ---------- */
function ascendant(jd, lat, lon) {
  const gmst = norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0));
  const lst = norm360(gmst + lon) * RAD;
  const e = 23.4393 * RAD;
  const phi = lat * RAD;
  let asc = Math.atan2(Math.cos(lst),
    -(Math.sin(lst) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) / RAD;
  return norm360(asc);
}

/* ============================================================
   사주 산출
   ============================================================ */
function computeSaju(y, mo, d, h, mi, trueSolar) {
  // 진태양시 보정 (서울 경도 126.978 → 표준자오선 135°, -32.1분)
  let adjMin = mi - (trueSolar ? 32 : 0);
  let dt = new Date(Date.UTC(y, mo - 1, d, h, adjMin));
  const Y = dt.getUTCFullYear(), M = dt.getUTCMonth() + 1, D = dt.getUTCDate();
  const H = dt.getUTCHours(), MI = dt.getUTCMinutes();

  const jd = toJD(Y, M, D, H - 9, MI); // KST → UT
  const lam = sunLongitude(jd);

  // 년주 — 입춘(황경 315°) 기준
  let sajuYear = Y;
  if (M <= 2 && lam >= 240 && lam < 315) sajuYear = Y - 1;
  const yIdx = ((sajuYear - 1984) % 60 + 60) % 60;
  const yStem = yIdx % 10, yBranch = yIdx % 12;

  // 월주 — 12절 기준
  const mSeq = Math.floor(norm360(lam - 315) / 30);   // 0 = 寅월
  const mBranch = (mSeq + 2) % 12;
  const mStem = ((yStem % 5) * 2 + 2 + mSeq) % 10;

  // 일주 — 율리우스일 기준 (23시 이후는 익일)
  let jdn = Math.floor(toJD(Y, M, D, 12, 0));
  if (H >= 23) jdn += 1;
  const dIdx = (jdn + 49) % 60;
  const dStem = dIdx % 10, dBranch = dIdx % 12;

  // 시주
  const hBranch = Math.floor((((H + 1) % 24)) / 2);
  const hStem = ((dStem % 5) * 2 + hBranch) % 10;

  const pillars = [
    { s: yStem, b: yBranch, label: '년주' },
    { s: mStem, b: mBranch, label: '월주' },
    { s: dStem, b: dBranch, label: '일주' },
    { s: hStem, b: hBranch, label: '시주' }
  ];

  // 오행 분포
  const el = [0, 0, 0, 0, 0];
  pillars.forEach((p, i) => {
    const sw = (i === 2) ? 2.0 : 1.0;            // 일간 가중
    el[STEM_EL[p.s]] += sw;
    const bw = (i === 1) ? 1.8 : 1.2;            // 월령 가중
    BRANCH_HIDDEN[p.b].forEach(([e, w]) => el[e] += w * bw);
  });
  const elSum = el.reduce((a, b) => a + b, 0);
  const elPct = el.map(v => v / elSum);

  /* --- 5축 --- */
  // 1. 발산–수렴 : 음양 비율
  let yang = 0, yin = 0;
  pillars.forEach((p, i) => {
    const w = (i === 2) ? 1.6 : 1.0;
    (p.s % 2 === 0 ? (yang += w) : (yin += w));
    (p.b % 2 === 0 ? (yang += w) : (yin += w));
  });
  const ex = (yang - yin) / (yang + yin) * 100;

  // 2. 추진–지속 : 생지/왕지/고지
  const TRIAD = [-100, 0, 100, -100, 0, 100, -100, 0, 100, -100, 0, 100];
  // 子-100(왕) 丑0(고) 寅+100(생) 卯-100 辰0 巳+100 午-100 未0 申+100 酉-100 戌0 亥+100
  let drN = 0, drD = 0;
  pillars.forEach((p, i) => {
    const w = (i === 1) ? 1.8 : (i === 2 ? 1.4 : 1.0);
    drN += TRIAD[p.b] * w; drD += w;
  });
  const dr = drN / drD;

  // 3. 논리–정서 : 금·수·토(논리) vs 화·목(정서)
  const logic = elPct[3] * 1.0 + elPct[4] * 0.6 + elPct[2] * 0.2;
  const feel  = elPct[1] * 1.0 + elPct[0] * 0.6;
  const lo = (logic - feel) / (logic + feel) * 100;

  // 4. 구체–관념 : 토·금(구체) vs 수·목·화(관념)
  const conc = elPct[2] * 1.0 + elPct[3] * 0.6;
  const abst = elPct[4] * 0.8 + elPct[0] * 0.6 + elPct[1] * 0.5;
  const co = (conc - abst) / (conc + abst) * 100;

  // 5. 자기–관계 : 십신
  const me = STEM_EL[dStem];
  const gen = (a, b) => (a + 1) % 5 === b;   // a가 b를 생
  const ctl = (a, b) => (a + 2) % 5 === b;   // a가 b를 극
  let self = 0, rel = 0;
  for (let e = 0; e < 5; e++) {
    const v = elPct[e];
    if (e === me) self += v * 1.0;            // 비겁
    else if (gen(me, e)) self += v * 0.8;     // 식상
    else if (ctl(me, e)) rel += v * 0.7;      // 재성
    else if (ctl(e, me)) rel += v * 1.0;      // 관성
    else rel += v * 0.6;                      // 인성
  }
  const se = (self - rel) / (self + rel) * 100;

  return {
    pillars, el: elPct, dayStem: dStem,
    axes: [ex, dr, lo, co, se].map(v => Math.max(-100, Math.min(100, v)))
  };
}

/* ============================================================
   별자리 산출
   ============================================================ */
const SIGN_KR = ['양자리','황소자리','쌍둥이자리','게자리','사자자리','처녀자리',
                 '천칭자리','전갈자리','사수자리','염소자리','물병자리','물고기자리'];
// 원소 0화 1토 2풍 3수
const SIGN_ELEM = [0,1,2,3,0,1,2,3,0,1,2,3];
// 성질 0활동 1고정 2변통
const SIGN_QUAL = [0,1,2,0,1,2,0,1,2,0,1,2];

function computeAstro(y, mo, d, h, mi) {
  const jd = toJD(y, mo, d, h - 9, mi);
  const sun = Math.floor(sunLongitude(jd) / 30);
  const moon = Math.floor(moonLongitude(jd) / 30);
  const asc = Math.floor(ascendant(jd, 37.5665, 126.978) / 30);

  const E_EX = [100, -100, 100, -100];     // 화 토 풍 수
  const E_LO = [-50, 50, 100, -100];
  const E_CO = [-60, 100, -100, 10];
  const Q_DR = [100, -100, 0];
  const SELF = [100, 85, 70, 55, 40, 25, -25, -40, -55, -70, -85, -100];

  const mix = (fn, ws) => fn(sun) * ws[0] + fn(moon) * ws[1] + fn(asc) * ws[2];

  const ex = mix(s => E_EX[SIGN_ELEM[s]], [0.40, 0.28, 0.32]);
  const dr = mix(s => Q_DR[SIGN_QUAL[s]], [0.40, 0.30, 0.30]);
  const lo = mix(s => E_LO[SIGN_ELEM[s]], [0.35, 0.45, 0.20]);
  const co = mix(s => E_CO[SIGN_ELEM[s]], [0.40, 0.35, 0.25]);
  const se = mix(s => SELF[s], [0.45, 0.30, 0.25]);

  return { sun, moon, asc, axes: [ex, dr, lo, co, se] };
}

/* ============================================================
   MBTI / 심리테스트
   ============================================================ */
function computeMbti(t) {          // t = {ei,sn,tf,jp} 각 true = 앞글자
  if (!t) return null;
  return {
    axes: [
      t.ei ? 85 : -85,
      t.jp ? -75 : 75,                       // J = 지속(-), P = 추진(+)
      t.tf ? 90 : -90,
      t.sn ? 90 : -90,
      (t.tf ? 35 : -35) + (t.ei ? -25 : 25)  // 저신뢰 근사
    ],
    weak: [4]
  };
}

function computeQuiz(answers, QUESTIONS) {
  const sum = [0, 0, 0, 0, 0], cnt = [0, 0, 0, 0, 0];
  QUESTIONS.forEach((q, i) => {
    if (answers[i] == null) return;
    sum[q.axis] += q.opts[answers[i]].v;
    cnt[q.axis]++;
  });
  return { axes: sum.map((v, i) => cnt[i] ? v / cnt[i] : 0) };
}

/* ============================================================
   대운(大運) — 인생의 방향이 바뀌는 10년 단위 전환점
   ============================================================ */
function findTerm(jd, dir){
  // λ ≡ 15 (mod 30) 인 순간 = 12절(節) 경계
  const seg = t => Math.floor(norm360(sunLongitude(t) - 315) / 30);
  const s0 = seg(jd);
  let lo = jd, hi = jd + dir * 40;
  // 경계를 포함하는 구간으로 좁힌 뒤 이분 탐색
  let step = dir * 0.5, t = jd;
  for (let i = 0; i < 100; i++) {
    const t2 = t + step;
    if (seg(t2) !== s0) { lo = dir > 0 ? t : t2; hi = dir > 0 ? t2 : t; break; }
    t = t2;
  }
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (seg(mid) === s0) { if (dir > 0) lo = mid; else hi = mid; }
    else { if (dir > 0) hi = mid; else lo = mid; }
  }
  return dir > 0 ? hi : lo;
}

function computeDaewoon(y, mo, d, h, mi, isMale, saju){
  const jd = toJD(y, mo, d, h - 9, mi);
  const yangYear = saju.pillars[0].s % 2 === 0;
  const forward = (yangYear === isMale);          // 양남·음녀 순행
  const dir = forward ? 1 : -1;
  const boundary = findTerm(jd, dir);
  const days = Math.abs(boundary - jd);
  const start = Math.max(1, Math.round(days / 3));  // 대운수

  const now = new Date();
  const age = Math.floor((now - new Date(y, mo - 1, d)) / 31557600000);

  // 현재 대운 구간
  let n = age < start ? -1 : Math.floor((age - start) / 10);
  const lastAge  = n < 0 ? null : start + n * 10;
  const nextAge  = n < 0 ? start : start + (n + 1) * 10;

  // 대운 간지 — 월주에서 순/역으로 n+1 칸
  const m = saju.pillars[1];
  const k = (n + 1) * dir;
  const dwStem   = ((m.s + k) % 10 + 10) % 10;
  const dwBranch = ((m.b + k) % 12 + 12) % 12;
  const dwEl = STEM_EL[dwStem];

  return { start, age, lastAge, nextAge, forward,
           stem: dwStem, branch: dwBranch, el: dwEl,
           span: n < 0 ? null : [lastAge, lastAge + 9] };
}
