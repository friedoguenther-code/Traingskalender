// Erzeugt training.ics aus Plan + Häkchen (tracker.json) + Strava (strava.json).
// Aufruf: node gen.js [heute=YYYY-MM-DD]  → schreibt training.ics
const fs = require('fs');
const {tagesplan, wocheNeu} = require('./plan.js');
const lese = (f, d) => { try { return JSON.parse(fs.readFileSync(__dirname + '/' + f, 'utf8')); } catch (e) { return d; } };
const tracker = lese('tracker.json', {});
const strava = lese('strava.json', []);
const zwift = lese('zwift.json', {});
const jetzt = new Date();
const heute = process.argv[2] || new Date(Date.UTC(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate())).toISOString().slice(0, 10);
const DASH = 'https://claude.ai/artifact/W8U4QaZYQtMfQzoctmmmAf';
const daten = tagesplan(strava, heute);
const st = tracker.training || {};
// Feiertage und Urlaub: Einheiten wie am Wochenende ab 11:30
const frei = new Set(['2026-12-24', '2026-12-25', '2026-12-26', '2026-12-31', '2027-01-01', '2027-03-26', '2027-03-29', '2027-05-13', '2027-05-24']);
for (let d = '2026-12-24'; d <= '2027-01-02'; d = new Date(Date.parse(d + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10)) frei.add(d);
const art = (titel) => {
  const t = String(titel).replace(/^Nachholen: /, '');
  if (/RENNEN|Rennsimulation/.test(t)) return 'rennen';
  if (/^Urlaub: Kraft/.test(t)) return 'kraft';
  if (/Langes Rad|^Rad |Ostermontag|Zwift|FTP/.test(t)) return 'rad';
  if (/Schwimm|Freiwasser|CSS/.test(t)) return 'schwimmen';
  if (/Lauf/.test(t)) return 'lauf';
  return 'sonst';
};
const emoji = {rad: '🚴', schwimmen: '🏊', lauf: '🏃', kraft: '💪', rennen: '🏁', sonst: '🏋️'};
const dauerMin = (titel) => {
  const t = String(titel);
  if (/RENNEN/.test(t)) return 360;
  if (/Rennsimulation/.test(t)) return 270;
  if (/CSS-Test/.test(t)) return 60;
  if (/FTP-Test|Ramp Test|FTP-Kurztest/.test(t)) return 45;
  if (/30-Minuten-Lauftest/.test(t)) return 60;
  let m = 0;
  const h = t.match(/(\d+):(\d+) h/);
  const spanne = t.match(/(\d+)–(\d+) min/);
  const einfach = t.match(/(\d+) min/);
  if (h) m = Number(h[1]) * 60 + Number(h[2]);
  else if (spanne) m = Number(spanne[2]);
  else if (einfach) m = Number(einfach[1]);
  else m = 60;
  const koppel = t.match(/\+ (\d+) min Koppellauf/);
  if (koppel) m += Number(koppel[1]);
  if (/\+ 15 min Kraft/.test(t)) m += 15;
  if (/Freiwasser 15 min \+ Lauf 15 min/.test(t)) m = 30;
  return Math.max(20, m);
};
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const falte = (zeile) => {
  const b = Buffer.from(zeile, 'utf8');
  if (b.length <= 75) return zeile;
  const teile = [];
  let rest = zeile;
  let erste = true;
  while (Buffer.byteLength(rest, 'utf8') > (erste ? 75 : 74)) {
    let n = erste ? 75 : 74;
    let s = '';
    for (const ch of rest) { if (Buffer.byteLength(s + ch, 'utf8') > n) break; s += ch; }
    teile.push((erste ? '' : ' ') + s);
    rest = rest.slice(s.length);
    erste = false;
  }
  teile.push(' ' + rest);
  return teile.join('\r\n');
};
const zeit = (datum, hh, mm) => datum.replace(/-/g, '') + 'T' + String(hh).padStart(2, '0') + String(mm).padStart(2, '0') + '00';
const plusMin = (datum, hh, mm, min) => {
  const ms = Date.UTC(+datum.slice(0, 4), +datum.slice(5, 7) - 1, +datum.slice(8, 10), hh, mm) + min * 60000;
  const d = new Date(ms);
  return d.toISOString().slice(0, 10).replace(/-/g, '') + 'T' + String(d.getUTCHours()).padStart(2, '0') + String(d.getUTCMinutes()).padStart(2, '0') + '00';
};
const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Claude//Triathlon Sardinien//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  'X-WR-CALNAME:Training Ironman 70.3 Sardinien', 'X-WR-TIMEZONE:Europe/Berlin', 'X-WR-CALDESC:Trainingsplan bis 30.05.2027 – Änderungen kommen automatisch',
  'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H',
  'BEGIN:VTIMEZONE', 'TZID:Europe/Berlin',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE'];
let anzahl = 0;
for (let nr = 0; nr <= 28; nr++) {
  const tage = wocheNeu(daten, st, heute, nr);
  if (!tage) continue;
  for (const x of tage) {
    const anreise = /Anreise nach Alghero/.test(x.titel);
    if (x.ruhe && !anreise) continue;
    const a = art(x.titel);
    const wochenende = x.t >= 5 || frei.has(x.datum);
    let status = '';
    if (x.geschafft) status = '✓ ';
    else if (x.weg) status = '✗ entfällt · ';
    else if (x.verpasst) status = '✗ ';
    const titel = (anreise ? '✈️ ' : status + emoji[a] + ' ') + (x.neu ? '↻ ' : '') + x.titel;
    const teile = [];
    if (x.hinweis) teile.push(x.hinweis);
    if (x.details && !x.weg) teile.push(x.details);
    const zw = (a === 'rad' || a === 'rennen') && !x.neu ? zwift[x.datum] : null;
    if (zw && !x.weg) teile.push('Zwift: Training → Custom Workouts → „' + zw + '“');
    if (x.strava) teile.push('Strava: ' + x.r.absolviert);
    teile.push('Abhaken und Plan B im Dashboard: ' + DASH);
    L.push('BEGIN:VEVENT', 'UID:training-' + x.datum + '@triathlon-sardinien', 'DTSTAMP:' + stamp, 'SEQUENCE:' + Math.floor(Date.now() / 60000) % 100000);
    if (anreise) {
      L.push('DTSTART;VALUE=DATE:' + x.datum.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + new Date(Date.parse(x.datum + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10).replace(/-/g, ''), 'TRANSP:TRANSPARENT');
    } else {
      const [hh, mm] = /RENNEN/.test(x.titel) ? [8, 0] : wochenende ? [11, 30] : [17, 30];
      L.push('DTSTART;TZID=Europe/Berlin:' + zeit(x.datum, hh, mm), 'DTEND;TZID=Europe/Berlin:' + plusMin(x.datum, hh, mm, dauerMin(x.titel)));
      L.push(x.weg || x.geschafft ? 'TRANSP:TRANSPARENT' : 'TRANSP:OPAQUE');
    }
    L.push(falte('SUMMARY:' + esc(titel)), falte('DESCRIPTION:' + esc(teile.join('\n\n'))), falte('URL:' + DASH), 'CATEGORIES:Training');
    if (!x.weg && !x.geschafft && !anreise && x.datum >= heute) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(titel).slice(0, 60), 'TRIGGER:-PT30M', 'END:VALARM');
    L.push('END:VEVENT');
    anzahl++;
  }
}
L.push('END:VCALENDAR');
fs.writeFileSync(__dirname + '/../training.ics', L.join('\r\n') + '\r\n');
console.log(anzahl + ' Termine geschrieben, Stand ' + heute);
