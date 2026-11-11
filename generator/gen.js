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
// Plan B je Einheitstyp – 1:1 aus dem Dashboard (tfAltListe); plan:i = im Voraus gewählt, alt:i = so gemacht
const PLANB = {
  schwimmen: [['Zwift statt Schwimmen', '45 min Zone 2 auf Zwift, danach 15 min Rumpf: Unterarmstütz, Seitstütz, Superman.'], ['Schwimm-Kraft zu Hause + kurzer Lauf', 'Mit Theraband an der Türklinke: 3 × 3 min Kraulzüge im Stehen vorgebeugt (1 min Pause). Ohne Band: 3 × 12 Liegestütze, 3 × 15 Superman, 3 × 45 s Unterarmstütz. Danach 20 min lockerer Lauf.'], null],
  zwift: [['Kurzversion 40 min', 'Gleiches Workout, nur die Hälfte der Intervalle. 10 min einfahren, 5 min ausfahren.'], ['Draußen am Anstieg', 'Die Intervalle an einem gleichmäßigen Anstieg fahren, Pausen bergab locker rollen.'], ['Laufen statt Rad', 'Kein Rad möglich: 15 min einlaufen, 5 × 3 min zügig (Zone 4), 2 min Trab, 10 min auslaufen.']],
  lauf: [['Dunkel oder Regen: beleuchtete Runde', 'Gleiche Einheit auf einer beleuchteten Runde (Park, Wohngebiet) mit Stirnlampe und Reflektorweste. Bei Glätte lieber Zwift.'], ['Zwift statt Lauf', 'Bei Beschwerden in Wade, Knie oder Schienbein: 45 min Zone 2 auf Zwift mit 6 × 1 min hoher Kadenz.'], ['Kurzversion 30 min', '30 min locker in Zone 2 plus 4 Steigerungen. Die 15 min Kraft trotzdem machen.']],
  langrad: [['Zwift kurz und knackig', 'Etwa 60 % der geplanten Dauer, darin 3 × 10 min Sweet Spot (88–92 % FTP). Gut, wenn die Zeit knapp ist.'], ['Unterwegs ohne eigenes Rad', 'Leihrad in gleicher Dauer locker. Geht das nicht: 60 min lockerer Lauf plus 15 min Kraft ohne Geräte.'], null],
  langlauf: [['Aufteilen', 'Morgens zwei Drittel der Dauer, abends ein Drittel – beides in Zone 2.'], ['Runden vor der Haustür', 'Gleiche Dauer auf einer kurzen Runde (1–2 km) ums Haus – so kommst du jederzeit an Wasser und kannst bei Glätte abbrechen.'], ['Zwift bei Beschwerden', 'Gleiche Dauer in Zone 2 auf Zwift. Schont die Beine und hält die Ausdauer.']],
  kraft: [['Mini-Version 10 min', '1 Runde: Kniebeugen, Ausfallschritte, Unterarmstütz.']],
  sonst: [['Kurzversion', 'Die Hälfte der Dauer, ganz locker.']]
};
const dashArt = (titel) => {
  const t = String(titel).replace(/^Nachholen: /, '');
  if (/Ruhetag|frei|Anreise|Rückreise/.test(t)) return 'ruhe';
  if (/RENNEN|Rennsimulation/.test(t)) return 'rennen';
  if (/^Urlaub: Kraft/.test(t)) return 'kraft';
  if (/Langes Rad|^Rad |Ostermontag/.test(t)) return 'langrad';
  if (/Zwift|FTP/.test(t)) return 'zwift';
  if (/Langer Lauf|Lauf locker 7/.test(t)) return 'langlauf';
  if (/Schwimm|Freiwasser|CSS/.test(t)) return 'schwimmen';
  if (/Lauf/.test(t)) return 'lauf';
  return 'sonst';
};
const planB = (x) => {
  const m = typeof x.m === 'string' ? x.m.match(/^(plan|alt):(\d+)$/) : null;
  if (!m) return null;
  const a = (PLANB[dashArt(x.titel)] || [])[Number(m[2])];
  return a ? {art: m[1], titel: a[0], text: a[1]} : null;
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
    const pb = planB(x);
    const a = art(pb ? pb.titel : x.titel);
    const wochenende = x.t >= 5 || frei.has(x.datum);
    let status = '';
    if (x.geschafft) status = '✓ ';
    else if (x.weg) status = '✗ entfällt · ';
    else if (x.verpasst) status = '✗ ';
    const titel = (anreise ? '✈️ ' : status + emoji[a] + ' ') + (x.neu ? '↻ ' : '') + (pb ? 'Plan B: ' + pb.titel : x.titel);
    const teile = [];
    if (pb) teile.push((pb.art === 'alt' ? 'Plan B gemacht' : 'Plan B geplant') + ' – statt: ' + x.titel);
    if (x.hinweis) teile.push(x.hinweis);
    if (pb) teile.push(pb.text);
    else if (x.details && !x.weg) teile.push(x.details);
    const zw = (a === 'rad' || a === 'rennen') && !x.neu && !pb ? zwift[x.datum] : null;
    if (zw && !x.weg) teile.push('Zwift: Training → Custom Workouts → „' + zw + '“');
    if (x.strava) teile.push('Strava: ' + x.r.absolviert);
    teile.push('Abhaken und Plan B im Dashboard: ' + DASH);
    L.push('BEGIN:VEVENT', 'UID:training-' + x.datum + '@triathlon-sardinien', 'DTSTAMP:' + stamp, 'SEQUENCE:' + Math.floor(Date.now() / 60000) % 100000);
    if (anreise) {
      L.push('DTSTART;VALUE=DATE:' + x.datum.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + new Date(Date.parse(x.datum + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10).replace(/-/g, ''), 'TRANSP:TRANSPARENT');
    } else {
      const [hh, mm] = /RENNEN/.test(x.titel) ? [8, 0] : wochenende ? [11, 30] : [17, 30];
      const dauer = pb ? (/kurzer Lauf|Rumpf|Kurzversion 40/.test(pb.titel + pb.text) ? 45 : /Mini-Version/.test(pb.titel) ? 15 : dauerMin(x.titel)) : dauerMin(x.titel);
      L.push('DTSTART;TZID=Europe/Berlin:' + zeit(x.datum, hh, mm), 'DTEND;TZID=Europe/Berlin:' + plusMin(x.datum, hh, mm, dauer));
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
