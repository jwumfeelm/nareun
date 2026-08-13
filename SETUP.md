# 나른 (nareun.com) — 배포 순서

## 0. 올리기 전에 딱 하나
`YOUR_EMAIL` 을 문의용 이메일로 바꾸세요. **두 곳**에 있습니다.
- `contact/index.html`
- `privacy/index.html`

회사 메일은 피하시고, 새 주소를 쓰시면 gmail 하나 만들어 쓰는 게 편합니다.

---

## 1. GitHub 저장소
1. github.com/new → 이름 `nareun` → **Public** → Create
2. Add file → Upload files → **폴더째 드래그** (하위 폴더 구조 그대로 올라감)
3. Commit changes

## 2. Pages 켜기
Settings → Pages → Source **Deploy from a branch** → `main` / `/ (root)` → Save
1~2분 뒤 `아이디.github.io/nareun/` 으로 열리는지 먼저 확인.

## 3. 커스텀 도메인 — GitHub 먼저
Settings → Pages → Custom domain 에 `nareun.com` 입력 → Save
(`CNAME` 파일이 이미 들어 있어 자동 인식될 수도 있습니다)

**반드시 이 순서로.** DNS부터 만지면 도메인 탈취 위험이 있습니다.

## 4. 가비아 DNS 설정
My가비아 → 도메인 → 관리 → DNS 정보 → 레코드 수정

| 타입 | 호스트 | 값 |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | 아이디.github.io. |

기존에 가비아가 넣어둔 기본 레코드(파킹 페이지)가 있으면 **지우세요.**
CNAME 값 끝의 점(.)은 가비아가 자동으로 붙이는 경우가 있으니 저장 후 확인.

반영까지 보통 10~30분, 최대 24시간.

## 5. HTTPS
Pages 설정에 초록 체크가 뜨면 **Enforce HTTPS** 체크.
인증서 발급에 몇 시간 걸릴 수 있습니다.

## 6. Search Console
search.google.com/search-console → 도메인 등록 →
`sitemap.xml` 제출. 색인이 빨라집니다.

## 7. 애드센스 (1~2주 뒤)
바로 신청하지 말고 검색 유입이 조금 생긴 뒤에.
승인되면 `ads.txt` 를 구글이 준 한 줄로 교체하고 광고 코드를 `<head>` 에 삽입.

---

## 콘텐츠 추가할 때
1. `/새이름/` 폴더 + index.html
2. 홈 `index.html` 해당 섹션에 카드 추가
3. 관련 읽을거리 1편을 `/read/` 에
4. `sitemap.xml` 에 URL 추가

애드센스는 도메인 단위 승인이라 **재신청 불필요.**

## 폴더 구조
```
/                     홈
/gap/                 심리테스트 1호
/read/*/              읽을거리 4편
/about/ /privacy/ /contact/    필수 페이지
CNAME                 nareun.com
favicon.svg  ads.txt  robots.txt  sitemap.xml
```
