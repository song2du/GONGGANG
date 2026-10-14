# Where to go? (어디가지?)

**A website for people with nowhere to go between classes.**

Pick a day and a time, then tap a building on the campus map to see which Gachon University classrooms are free at that moment and how long they stay free. Everything comes from the university's official timetable.

- **Live site:** https://song2du.github.io/where-to-go/
- **Languages:** 한국어, English, 日本語, 中文, Tiếng Việt, Монгол (chosen automatically from your browser language)
- Unofficial student project. Not affiliated with Gachon University.

## How it works

### Timetable data

1. **Live on every visit.** The browser requests the current semester's timetable directly from Gachon University's [timetable and syllabus lookup](https://info.gachon.ac.kr/ssu/showTimetable.do) and keeps it in the browser for 6 hours.
2. **Daily saved copy.** [`update-timetable.yml`](.github/workflows/update-timetable.yml) runs [`scripts/fetch-timetable.mjs`](scripts/fetch-timetable.mjs) every day at 06:17 KST and saves the current semester to `data/`. It commits only when the timetable changed. When a new semester is saved, the previous semester's file is deleted. The site falls back to this copy when the school server can't be reached.
3. **Semester by date.** March–August is the spring semester (1학기) and September–February the fall semester (2학기). The site always shows the current one.

To fetch a specific semester by hand, run the **시간표 갱신** workflow from the Actions tab and enter a term such as `2027-10`. Term codes: `10` spring, `11` summer session, `20` fall, `21` winter session.

### Free rooms

- Period 1 starts at 09:00 and each period counts as one hour.
- A room is **free** when no regular class is scheduled at the chosen time. The site also shows when its next class starts.
- A room is marked **check** when the only class there is a part-term class (12 weeks, 4 weeks, …) or a class listed with several rooms, so it may or may not be in use.
- Only regular classes are known. Make-up classes, exams, events and room bookings are not.
- Rooms with no classes at all this semester don't appear.

### Maps

Campus maps are drawn from [OpenStreetMap](https://www.openstreetmap.org/copyright) building and path data, converted to meters. Medical Campus building names were checked against KakaoMap and Naver Map. 바이오나노대학 has no confirmed location, so it appears only in the building list. When the site is not in Korean, building names are shown in Korean (as on campus signs) with a translation underneath.

## Files

| Path | Contents |
|---|---|
| `index.html` | The whole site, no external libraries |
| `data/index.json` | List of saved semesters |
| `data/YYYY-TT.json` | Timetable for one semester: course code, title, instructor, category, time, room, online flag |
| `data/map-global.json`, `data/map-medical.json` | Campus maps |
| `data/status.json` | Last check date (keeps the scheduled workflow active) |
| `scripts/fetch-timetable.mjs` | Fetches the timetable into `data/` (Node 20+) |
| `.github/workflows/update-timetable.yml` | Daily update job |

## Run locally

```sh
node scripts/fetch-timetable.mjs          # current semester
node scripts/fetch-timetable.mjs 2027-10  # a specific semester
python3 -m http.server                    # then open http://localhost:8000
```

## Credits

- [Yidu Song (@song2du)](https://github.com/song2du): idea, product direction, design decisions
- Claude (Anthropic): implementation help

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL). Timetable data from Gachon University.
