// Trainingsplan-Logik – 1:1 aus dem Dashboard übernommen (calc „wochen“ + „tagesplan“ + tfWocheNeu).
// Bei Änderungen am Plan im Dashboard muss diese Datei mit angepasst werden.
const plan = [
  [3,'Einstieg','Einstieg',60,40],[5,'Grundlage 1','Grundlage 1',90,50],[5,'Grundlage 1 · Tests','Grundlage 1',90,50],[6,'Grundlage 1','Grundlage 1',105,60],[4,'Erholung','Grundlage 1',75,45],[6.5,'Grundlage 1','Grundlage 1',120,65],[4.5,'Grundlage 1 · Urlaub ab 24.12.','Grundlage 1',120,60],[3.5,'Urlaub','Grundlage 1',null,70],[6,'Grundlage 1','Grundlage 1',135,65],[7,'Grundlage 2','Grundlage 2',135,70],[7.5,'Grundlage 2','Grundlage 2',150,75],[8,'Grundlage 2','Grundlage 2',165,80],[5.5,'Erholung · Tests','Grundlage 2',90,55],[8,'Grundlage 2','Grundlage 2',165,85],[8.5,'Grundlage 2','Grundlage 2',180,90],[9,'Grundlage 2','Grundlage 2',180,90],[6,'Erholung','Grundlage 2',120,60],[9,'Aufbau','Aufbau',180,90],[9.5,'Aufbau','Aufbau',195,95],[11,'Aufbau · Ostern','Aufbau',210,100],[10,'Aufbau · Ostern','Aufbau',210,100],[6.5,'Erholung · Tests','Aufbau',120,60],[10,'Spezifisch','Spezifisch',210,100],[11,'Spezifisch','Spezifisch',225,105],[11.5,'Spezifisch','Spezifisch',240,90],[7,'Erholung · Kurztest','Spezifisch',120,60],[12,'Spezifisch · Rennsimulation','Spezifisch',180,75],[7,'Taper','Taper',120,60],[3.5,'Rennwoche','Taper',45,null]
];
const START = Date.UTC(2026, 10, 9);
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const wochen = plan.map((p, i) => ({woche: 'W' + i, nr: i, phase: p[1], gruppe: p[2], rad_ziel_min: p[3], lauf_ziel_min: p[4]}));

function tagesplan(aktivitaeten, heute) {
  const tage = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const dauer = (min) => min == null ? '' : min >= 60 ? Math.floor(min / 60) + ':' + String(min % 60).padStart(2, '0') + ' h' : min + ' min';
  const koppel = {15: 15, 17: 20, 18: 20, 20: 30, 22: 30, 23: 30, 24: 40};
  const tests = [2, 12, 21];
  const sportName = {Swim: 'Schwimmen', Ride: 'Rad', VirtualRide: 'Rad (Zwift)', GravelRide: 'Rad', MountainBikeRide: 'Rad', Run: 'Laufen', VirtualRun: 'Laufen', TrailRun: 'Laufen', Hike: 'Wandern', Walk: 'Gehen', WeightTraining: 'Kraft', Workout: 'Workout', Yoga: 'Yoga'};
  const proTag = {};
  for (const a of aktivitaeten) (proTag[a.datum] = proTag[a.datum] || []).push(a);
  const standard = (w) => {
    const i = w.nr; const erholung = /Erholung/.test(w.phase); const test = tests.includes(i);
    return [
      ['Ruhetag (optional 15 min Mobility)', true],
      [test ? 'CSS-Test Schwimmen (400 m + 200 m)' : 'Schwimmen 60–75 min: Technik + Hauptsatz', false],
      [test ? 'FTP-Test auf Zwift (Ramp Test)' : erholung ? 'Zwift locker 45–60 min' : 'Zwift-Intervalle 60–75 min', false],
      [test ? '30-Minuten-Lauftest' : erholung ? 'Lauf locker 40 min' : 'Lauf 45–60 min: Tempo oder Intervalle + 15 min Kraft', false],
      [i >= 17 ? 'Ruhetag (optional 30 min lockeres Schwimmen)' : 'Ruhetag (optional 15 min Mobility)', true],
      ['Langes Rad ' + dauer(w.rad_ziel_min) + (koppel[i] ? ' + ' + koppel[i] + ' min Koppellauf' : ''), false],
      ['Langer Lauf ' + dauer(w.lauf_ziel_min) + ' locker', false]
    ];
  };
  const sonder = {
    6: {2: ['Langes Rad 2:00 h auf Zwift vor der Abreise', false, 'Zone 2 (60–70 % FTP), Kadenz 85–95 · darin 2 × 10 min Sweet Spot auf 88–92 % FTP · alle 20 min trinken, alle 45 min essen'], 3: ['Urlaub: Lauf locker 40–50 min', false], 4: ['Urlaub: Kraft 20 min', false], 5: ['Urlaub: frei oder Schwimmen, falls Pool', true], 6: ['Langer Lauf 60 min locker', false]},
    7: {0: ['Urlaub: Lauf locker 40 min', false], 1: ['Urlaub: Kraft 20 min, Schwimmen falls Pool', false], 2: ['Urlaub: Lauf 45 min mit 6 Steigerungen', false], 3: ['Ruhetag', true], 4: ['Urlaub: Kraft 20 min', false], 5: ['Rückreise – frei', true], 6: ['Lauf locker 70 min', false]},
    19: {4: ['Karfreitag: Langer Lauf 1:40 h', false], 5: ['Langes Rad 3:30 h', false], 6: ['Ostersonntag: Lauf locker 60 min', false]},
    20: {0: ['Ostermontag: Langes Rad 3:30 h + 30 min Koppellauf', false, 'Draußen, wenn möglich wellig · Zone 2 mit Anstiegen bis 85 % FTP · Verpflegung wie im Rennen testen · Koppellauf: erste 5 min ruhig, dann Renntempo'], 5: ['Rad 1:30 h locker', false]},
    25: {1: ['Schwimmen, wenn möglich erstes Freiwasser im Neo', false], 2: ['FTP-Kurztest auf Zwift', false]},
    26: {5: ['Rennsimulation: 2.000 m Schwimmen, 3:00 h Rad im Renntempo, 45 min Lauf', false, 'Morgens Frühstück wie am Renntag. Schwimmen 2.000 m am Stück (im Neo, wenn möglich) · Rad 3:00 h auf 72–78 % FTP mit 60–80 g Kohlenhydraten pro Stunde · direkt danach 45 min Lauf im Renntempo. Alles mit Rennkleidung und Rennverpflegung.'], 6: ['Lauf locker 75 min', false, 'Zone 2, ganz locker zur Erholung.']},
    27: {5: ['Rad 2:00 h mit 3 × 10 min Renntempo', false]},
    28: {1: ['Schwimmen 30 min locker', false], 2: ['Rad 45 min mit 3 × 3 min Renntempo', false], 3: ['Anreise nach Alghero', true], 4: ['Freiwasser 15 min + Lauf 15 min locker', false], 5: ['Rad 20 min Check, Rad einchecken', false, '20 min locker mit 3 × 1 min Renntempo, Schaltung und Bremsen prüfen. Mehr Kohlenhydrate, wenig Ballaststoffe, kein großer Rohkostsalat.'], 6: ['RENNEN – Start 8:00 Uhr', false, 'Ca. 5 Uhr: 2–3 Toasts mit Honig + ein Becher Apfelmus. Rad 72–78 % FTP, an Anstiegen nie über 90 %, 60–80 g Kohlenhydrate pro Stunde. Lauf: erste 5 km bewusst ruhig, alle 20–30 min Gel oder Cola, Wasser auch über Kopf und Nacken.']}
  };
  const details = (w, t) => {
    const i = w.nr; const g = w.gruppe; const erholung = /Erholung/.test(w.phase); const test = tests.includes(i);
    const ss = {5: '3 × 8', 6: '3 × 8', 8: '3 × 10', 9: '3 × 10', 10: '3 × 12', 11: '3 × 12', 13: '3 × 15', 14: '2 × 20', 15: '3 × 20'};
    const aufbau = {17: 'Schwelle 4 × 8 min auf 95–100 % FTP, 4 min locker dazwischen', 18: 'Berg 4 × 8 min auf 85–90 % FTP mit Kadenz 60–70, 4 min locker', 19: 'Schwelle 5 × 8 min auf 95–100 % FTP, 4 min locker', 20: 'Berg 5 × 8 min auf 85–90 % FTP mit Kadenz 60–70, 4 min locker'};
    const renn = {22: '2 × 20', 23: '2 × 25', 24: '2 × 30', 26: '3 × 20', 27: '2 × 15'};
    const lauf = {9: '5 × 3 min in Zone 4, 2 min Trab', 10: '5 × 3 min in Zone 4, 2 min Trab', 11: '5 × 3 min in Zone 4, 2 min Trab', 13: '6 × 3 min in Zone 4, 2 min Trab', 14: '5 × 4 min in Zone 4, 2 min Trab', 15: '6 × 4 min in Zone 4, 2 min Trab', 17: '2 × 10 min Tempo (Zone 3), 3 min Trab', 18: '2 × 12 min Tempo (Zone 3), 3 min Trab', 19: '2 × 15 min Tempo (Zone 3), 3 min Trab', 20: '6 × 4 min in Zone 4, 2 min Trab', 22: '2 × 15 min Renntempo, 3 min Trab', 23: '3 × 12 min Renntempo, 2 min Trab', 24: '2 × 20 min Renntempo, 3 min Trab', 26: '2 × 15 min Renntempo, 3 min Trab', 27: '3 × 5 min Renntempo, 2 min Trab'};
    if (t === 0) return 'Locker dehnen oder Mobility, früh schlafen.';
    if (t === 1) {
      if (test) return '400 m ein · 400 m Vollgas · 5 min Pause · 200 m Vollgas · 200 m aus. CSS pro 100 m = (Zeit 400 m − Zeit 200 m) ÷ 2.';
      if (g === 'Einstieg' || g === 'Grundlage 1') return '300 m ein · 8 × 50 m Technik (Abschlag, Faust, Dreierzug) · 6 × 100 m Zone 2, 20 s Pause · 200 m aus — ca. 1.500–2.000 m';
      if (g === 'Grundlage 2') return '300 m ein · 4 × 300 m Zone 2, 30 s Pause · 8 × 50 m zügig · 200 m aus — ca. 2.200–2.600 m';
      if (g === 'Aufbau') return '400 m ein · 10 × 100 m auf CSS, 15 s Pause · 400 m mit Pull Buoy (meist im Bad ausleihbar, sonst locker kraulen) · 200 m aus — ca. 2.500–2.800 m' + (i >= 17 && i % 2 === 0 ? ' · heute im Neo' : '');
      return '400 m ein · 3 × 600 m Renntempo, 30 s Pause · 4 × 50 m Orientierung (alle 6–8 Züge nach vorn schauen) · 200 m aus — ca. 2.800–3.000 m' + (i % 2 === 0 ? ' · heute im Neo' : '');
    }
    if (t === 2) {
      if (test) return 'Zwift-Workout „Ramp Test“. Zwift setzt deine FTP danach automatisch.';
      if (erholung) return '45–60 min Zone 1–2, Kadenz um 90 · 4 × 30 s hohe Kadenz.';
      if (aufbau[i]) return '15 min ein · ' + aufbau[i] + ' · 10 min aus';
      if (renn[i]) return '15 min ein · ' + renn[i] + ' min auf 75–78 % FTP in Aero-Position bzw. Unterlenker, 5 min locker · 10 min aus';
      if (ss[i]) return '15 min ein · Sweet Spot ' + ss[i] + ' min auf 88–92 % FTP, 5 min locker · 10 min aus';
      return '60 min Zone 2 (56–75 % FTP), Kadenz 85–95 · am Ende 4 × 1 min hohe Kadenz.';
    }
    if (t === 3) {
      if (test) return '15 min einlaufen · 30 min so schnell wie gleichmäßig möglich · Durchschnittspuls der letzten 20 min = Schwellenpuls · 10 min aus';
      if (erholung) return '40 min Zone 2, Unterhaltungstempo.';
      const kraft = ' · danach 15 min Kraft ohne Geräte: ' + (i >= 22 ? '1 Runde' : '2 Runden') + ' à ' + (i >= 9 ? '8 Bulgarische Split Squats pro Bein (hinterer Fuß auf Stuhl oder Sofa)' : '12 Kniebeugen') + ', 10 Ausfallschritte pro Bein, 15 × Wadenheben einbeinig auf einer Treppenstufe, 45 s Unterarmstütz, ' + (i >= 9 ? '12 einbeinige Glute Bridges pro Bein' : '15 Glute Bridges');
      if (lauf[i]) return '15 min einlaufen · ' + lauf[i] + ' · 10 min auslaufen' + kraft;
      return '40–45 min Zone 2 · am Ende 6 × 20 s Steigerungen, 60 s gehen' + kraft;
    }
    if (t === 4) return i >= 17 ? 'Erholung vor dem langen Wochenende. Optional, nur wenn du dich frisch fühlst: 30 min ganz locker schwimmen.' : 'Erholung vor dem langen Wochenende. Optional 15 min Mobility oder Dehnen.';
    if (t === 5) {
      const zusatz = g === 'Spezifisch' ? ' · darin 2 × 30 min auf 75–78 % FTP' : g === 'Aufbau' ? ' · wellige Strecke oder Zwift-Bergroute, Anstiege bis 85 % FTP' : '';
      return 'Zone 2 (60–70 % FTP), Kadenz 85–95 · alle 20 min trinken, alle 45 min essen' + zusatz + (koppel[i] ? ' · Koppellauf direkt danach: erste 5 min ruhig, dann Renntempo' : '') + (i >= 9 ? ' · ab 2 h 1 Flasche Sportgetränk pro Stunde' : '');
    }
    if (t === 6) return 'Zone 2, Unterhaltungstempo, lieber zu langsam' + (g === 'Spezifisch' ? ' · letzte 15 min im Renntempo' : '') + ((w.lauf_ziel_min || 0) >= 75 ? ' · ab 75 min Wasser oder Gel mitnehmen' : '');
    return '';
  };
  const rows = [];
  for (const w of wochen) {
    const pl = standard(w); const extra = sonder[w.nr] || {};
    for (let t = 0; t < 7; t++) {
      const datum = iso(START + (w.nr * 7 + t) * 864e5);
      const eintrag = extra[t] || pl[t];
      const detail = extra[t] ? (extra[t][2] || '') : details(w, t);
      const ruhe = eintrag[1];
      const akt = proTag[datum] || [];
      const absolviert = akt.map((a) => { const km = (Number(a.distanz_m) || 0) / 1000; return (sportName[a.sport_type] || a.sport_type) + ' ' + Math.round((Number(a.bewegungszeit_s) || 0) / 60) + ' min' + (km >= 0.1 ? ' · ' + km.toLocaleString('de-DE', {maximumFractionDigits: 1}) + ' km' : ''); }).join(' | ');
      const status = akt.length ? (ruhe ? 'Bonus' : 'erledigt') : ruhe ? 'Ruhetag' : datum > heute ? 'offen' : datum === heute ? 'heute' : 'verpasst';
      rows.push({datum, woche: w.woche, nr: w.nr, tag: tage[t] + ' ' + datum.slice(8, 10) + '.' + datum.slice(5, 7) + '.', geplant: eintrag[0], details: detail, absolviert: absolviert || '–', status});
    }
  }
  return rows;
}

const tfPlusTage = (s, n) => new Date(Date.parse(s + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const tfTagName = (s) => ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(s + 'T00:00:00Z').getUTCDay()] + ' ' + s.slice(8, 10) + '.' + s.slice(5, 7) + '.';
const tfPrio = [0, 4, 3, 5, 6, 1, 2];
function wocheNeu(data, st, heute, nr) {
  const roh = (n) => data.filter((r) => r.nr === n);
  const basis = (r, t) => { const ruhe = r.status === 'Ruhetag' || r.status === 'Bonus'; return {r, t, datum: r.datum, m: st[r.datum], strava: !!r.absolviert && r.absolviert !== '–', ruhe, prio: ruhe ? 0 : tfPrio[t], titel: r.geplant, details: r.details, hinweis: '', neu: false, weg: false}; };
  const bewerte = (x) => { x.geschafft = x.m === 'ja' || (typeof x.m === 'string' && x.m.indexOf('alt:') === 0) || (x.m !== 'nein' && x.strava); x.verpasst = !x.ruhe && !x.geschafft && (x.datum < heute || x.m === 'nein'); return x; };
  const uebertrag = (n) => { if (n < 0 || n >= 28) return null; const mo = roh(n + 1)[0]; if (!mo || !(mo.status === 'Ruhetag' || mo.status === 'Bonus')) return null; const we = roh(n).map(basis).map(bewerte).filter((x) => x.t >= 5 && x.verpasst); we.sort((a, b) => a.prio - b.prio); return we[0] || null; };
  const tage = roh(nr).map(basis);
  if (tage.length !== 7) return null;
  const vorher = uebertrag(nr - 1);
  if (vorher && tage[0].ruhe) { const mo = tage[0]; mo.ruhe = false; mo.prio = vorher.prio; mo.neu = true; mo.titel = 'Nachholen: ' + vorher.titel; mo.details = (vorher.details ? vorher.details + ' · ' : '') + 'Etwa 75 % der geplanten Dauer reichen.'; mo.hinweis = 'verpasst am ' + vorher.r.tag + ' – statt Ruhetag'; }
  tage.forEach(bewerte);
  const belegt = new Set(); const ohne = (s) => s.replace(/^Nachholen: /, '');
  for (const x of tage) {
    if (!x.verpasst) continue;
    if (x.t >= 5) { const u = uebertrag(nr); const mo = tfTagName(tfPlusTage(x.datum, 7 - x.t)); if (u && u.t === x.t) x.hinweis = '→ wird am ' + mo + ' nachgeholt'; else { x.hinweis = 'entfällt – nicht nachholen'; x.weg = true; } continue; }
    if (x.neu && x.t === 0) { x.hinweis += ' · entfällt'; x.weg = true; continue; }
    const kand = tage.filter((f) => f.t > x.t && f.t < 5 && !belegt.has(f.t) && !f.geschafft && f.m !== 'nein' && f.datum >= heute && !f.ruhe && f.prio > x.prio);
    kand.sort((a, b) => b.prio - a.prio || a.t - b.t);
    const f = kand[0];
    if (f) { belegt.add(f.t); const alt = f.titel; f.titel = 'Nachholen: ' + ohne(x.titel); f.details = x.details; f.prio = x.prio; f.neu = true; f.hinweis = 'statt „' + alt + '“ (entfällt) · verpasst am ' + x.r.tag; x.hinweis = '→ verschoben auf ' + f.r.tag; }
    else { x.hinweis = 'entfällt – nicht nachholen'; x.weg = true; }
  }
  return tage;
}
module.exports = {tagesplan, wocheNeu};
