# 어디가지? (GONGGANG)

**공강 시간에 갈 곳 없는 사람들을 위한 웹사이트**

가천대학교 공식 시간표로 요일·시간을 고르고, 캠퍼스 지도에서 건물을 눌러 빈 강의실과 강의실별 주간 시간표를 보는 페이지예요.

- 페이지: https://song2du.github.io/GONGGANG/
- 한국어, English, 日本語, 中文, Tiếng Việt, Монгол을 지원해요. 처음 열 때 브라우저 언어로 자동 선택돼요.
- 학교와 관계없는 학생용 비공식 페이지예요.

## 시간표 데이터가 들어오는 방식

1. **페이지를 열 때 실시간으로 받아요.** 학생 브라우저가 [가천대학교 시간표 및 강의계획서 조회](https://info.gachon.ac.kr/ssu/showTimetable.do)의 조회 API에 직접 요청해서 지금 학기 시간표를 받아요. 받은 데이터는 그 브라우저에 6시간 동안 보관해요.
2. **매일 저장본을 갱신해요.** `.github/workflows/update-timetable.yml`이 매일 06:17(한국 시간)에 `scripts/fetch-timetable.mjs`를 실행해 지금 학기 시간표를 `data/`에 저장해요. 새 학기 데이터가 저장되면 지난 학기 데이터는 지워요. 데이터가 바뀌었을 때만 커밋해요. 학교 서버에 연결되지 않을 때 페이지가 이 저장본을 보여줘요.
3. **학기는 날짜로 정해요.** 3~8월은 1학기, 9~2월은 2학기이고, 페이지는 항상 지금 학기만 보여줘요.

특정 학기를 직접 받으려면 Actions 탭에서 "시간표 갱신"을 수동 실행하고 학기를 적어요(예: `2027-10`). 학기 코드는 10 = 1학기, 11 = 여름계절, 20 = 2학기, 21 = 겨울계절이에요.

## 파일

| 경로 | 내용 |
|---|---|
| `index.html` | 페이지 전체 (외부 라이브러리 없음) |
| `data/index.json` | 저장된 학기 목록 |
| `data/YYYY-TT.json` | 학기별 시간표 원본 (학수번호, 과목명, 교수, 이수구분, 강의시간, 강의실, 사이버 여부) |
| `data/map-global.json`, `data/map-medical.json` | 캠퍼스 지도 (OpenStreetMap 건물·길 데이터, 미터 단위로 변환) |
| `scripts/fetch-timetable.mjs` | 학교 시간표를 받아 `data/`에 저장하는 스크립트 (Node 20+) |

## 계산 기준

- 교시는 1교시 09:00부터 교시당 1시간으로 계산해요.
- 12주·4주처럼 학기 일부만 하는 수업, 강의실이 여러 곳으로 적힌 수업이 걸린 강의실은 "확인 필요"로 따로 보여줘요.
- 시간표에 있는 정규 수업만 반영해요. 보강, 시험, 행사, 예약은 알 수 없어요.

## 직접 실행

```sh
node scripts/fetch-timetable.mjs          # 지금 학기
node scripts/fetch-timetable.mjs 2027-10  # 특정 학기
python3 -m http.server                    # http://localhost:8000 에서 확인
```

## 만든 사람

- [Yidu Song (@song2du)](https://github.com/song2du) — 기획, 디자인 방향
- Claude (Anthropic) — 구현 도움

지도 데이터 © [OpenStreetMap](https://www.openstreetmap.org/copyright) 기여자 (ODbL)
