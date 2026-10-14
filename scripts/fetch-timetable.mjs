#!/usr/bin/env node
// 가천대학교 "시간표 및 강의계획서 조회"(info.gachon.ac.kr)에서 학기 시간표를 받아 data/ 에 저장한다.
// GitHub Actions에서 매일 실행된다. 데이터가 바뀌었을 때만 파일을 다시 쓴다.
// 사용법: node scripts/fetch-timetable.mjs [연도-학기코드 ...]   예) node scripts/fetch-timetable.mjs 2027-10
//   학기코드: 10 = 1학기, 11 = 여름계절, 20 = 2학기, 21 = 겨울계절. 인자가 없으면 지금 학기만 받고,
//   지금 학기 데이터가 저장돼 있으면 지난 학기 데이터는 지운다.

import { readFile, writeFile, unlink } from 'node:fs/promises';

const API = 'https://info.gachon.ac.kr/Ssu1000q/mainSearch.do';
const GROUPS = ['20', '21']; // 20 글로벌캠퍼스, 21 메디컬캠퍼스
const ISU = ['002', '001', '004', '003', '005', '006']; // 전공, 교양, 교직, 군사학, 특별, 일선
const MIN_SCHEDULED = 50; // 강의시간·강의실이 채워진 수업이 이보다 적으면 아직 시간표가 안 나온 학기로 본다
const DATA = new URL('../data/', import.meta.url);

const kst = () => { const d = new Date(Date.now() + 9 * 3600e3); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, day: d.getUTCDate(), iso: d.toISOString().slice(0, 10) }; };
const termByDate = () => { const { y, m } = kst(); return m >= 3 && m <= 8 ? { year: y, term: '10' } : m >= 9 ? { year: y, term: '20' } : { year: y - 1, term: '20' }; };
const idOf = (t) => `${t.year}-${t.term}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function query(group, year, term, isu) {
  const body = new URLSearchParams();
  const f = { groupType: group, searchYear: String(year), searchTerm: term, searchUnivCD: '', searchDeptCD: '', searchIsuCD: isu, searchGrade: '', searchSubjectNm: '' };
  for (const [k, v] of Object.entries(f)) body.append('@d1#' + k, v);
  body.append('@d#', '@d1#'); body.append('@d1#', 'SendData'); body.append('@d1#tp', 'dm');
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' }, body, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (!Array.isArray(j.MainData)) throw new Error('예상과 다른 응답: ' + JSON.stringify(j).slice(0, 200));
      return j.MainData;
    } catch (e) {
      if (attempt >= 3) throw e;
      await sleep(3000 * attempt);
    }
  }
}

async function fetchTerm({ year, term }) {
  const campuses = {};
  for (const g of GROUPS) {
    const seen = new Set();
    const rows = [];
    for (const isu of ISU) {
      for (const r of await query(g, year, term, isu)) {
        if (seen.has(r.HAKSU_NO)) continue;
        seen.add(r.HAKSU_NO);
        rows.push([r.HAKSU_NO, (r.SUBJECT_NM_KOR || '').replace(/\s+/g, ' ').trim(), r.PROFNM || '', r.ISU_NM || '', r.TIME || '', r.LOC_NM || '', r.CYBER_YN ? 1 : 0]);
      }
      await sleep(600);
    }
    campuses[g] = rows;
  }
  return campuses;
}

const scheduled = (campuses) => Object.values(campuses).flat().filter((r) => r[4] && r[5]).length;
const readJSON = async (name, fallback) => { try { return JSON.parse(await readFile(new URL(name, DATA), 'utf8')); } catch { return fallback; } };

const manual = process.argv.slice(2).length > 0;
const terms = manual
  ? process.argv.slice(2).map((s) => { const [year, term] = s.split('-'); return { year: +year, term }; })
  : [termByDate()];

const index = await readJSON('index.json', { default: '', semesters: [] });
let changed = false;
for (const t of terms) {
  const id = idOf(t);
  const campuses = await fetchTerm(t);
  const n = scheduled(campuses);
  console.log(`${id}: 수업 ${Object.values(campuses).flat().length}개, 시간·강의실 있는 수업 ${n}개`);
  if (n < MIN_SCHEDULED) { console.log(`${id}: 아직 시간표가 나오지 않아 건너뜀`); continue; }
  const old = await readJSON(`${id}.json`, null);
  if (old && JSON.stringify(old.campuses) === JSON.stringify(campuses)) { console.log(`${id}: 변경 없음`); continue; }
  const fetchedAt = new Date().toISOString();
  await writeFile(new URL(`${id}.json`, DATA), JSON.stringify({ year: t.year, term: t.term, fetchedAt, campuses }));
  index.semesters = index.semesters.filter((s) => s.id !== id).concat({ id, year: t.year, term: t.term, fetchedAt, file: `data/${id}.json` });
  changed = true;
  console.log(`${id}: 저장함`);
}

index.semesters.sort((a, b) => b.id.localeCompare(a.id));
const cur = idOf(termByDate());
if (!manual && index.semesters.some((s) => s.id === cur)) {
  for (const s of index.semesters.filter((s) => s.id !== cur)) {
    await unlink(new URL(`${s.id}.json`, DATA)).catch(() => {});
    console.log(`${s.id}: 지난 학기 데이터 삭제`);
  }
  index.semesters = index.semesters.filter((s) => s.id === cur);
}
index.default = index.semesters.some((s) => s.id === cur) ? cur : (index.semesters[0] || {}).id || '';
await writeFile(new URL('index.json', DATA), JSON.stringify(index, null, 1) + '\n');

// 공개 저장소의 예약 실행은 60일 동안 저장소 활동이 없으면 꺼지므로, 매달 1일에는 확인 기록을 남겨 커밋이 생기게 한다.
const now = kst();
const status = await readJSON('status.json', {});
if (changed || now.day === 1 || !status.checkedAt) {
  await writeFile(new URL('status.json', DATA), JSON.stringify({ checkedAt: now.iso }, null, 1) + '\n');
}
