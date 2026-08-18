/* ============================================================
   나른 — 접속 통계 (Google Analytics 4)

   ▼▼▼ 아래 따옴표 안의 값만 본인 측정 ID로 바꾸세요 ▼▼▼
   ============================================================ */

var GA_ID = 'G-NHQGVDX6WC';

/* ▲▲▲ 여기까지. 아래는 건드리지 마세요 ▲▲▲ */

(function () {
  window.track = function () {};                 // ID 없을 때 안전장치
  if (!/^G-[A-Z0-9]{6,}$/i.test(GA_ID)) return;  // 아직 안 바꿨으면 아무것도 안 함

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_ID);

  window.track = function (name, params) {
    try { gtag('event', name, params || {}); } catch (e) {}
  };
})();
