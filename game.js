const SAVE_KEY = 'boundary-career-v1';
const freshSave = { wins: 0, losses: 0, matches: 0, runs: 0, dismissals: 0, xp: 0, training: 0, form: [], totalBalls: 0, sound: true };
let save;
try { save = { ...freshSave, ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch { save = { ...freshSave }; }
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let match = null;
let toastTimer;
let rafId;
const tiers = [
  { name: 'Local Club', short: 'CLUB', required: 0, icon: '✳', note: 'Riverside Community Cricket' },
  { name: 'District XI', short: 'DISTRICT', required: 2, icon: '◆', note: 'Earn a call-up to the district side' },
  { name: 'State League', short: 'STATE', required: 4, icon: '▲', note: 'Compete with the best in your state' },
  { name: 'National Team', short: 'COUNTRY', required: 6, icon: '★', note: 'Wear your country’s colours' },
  { name: 'International', short: 'WORLD STAGE', required: 8, icon: '✦', note: 'Take your place among the greats' }
];
function tierIndex() { let current = 0; tiers.forEach((tier, i) => { if (save.wins >= tier.required) current = i; }); return current; }
function saveGame() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
function showPage(name) {
  $$('.page').forEach(page => page.classList.remove('active'));
  const target = $(`#${name}-page`); if (target) target.classList.add('active');
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function renderCareer() {
  const tier = tierIndex();
  $('#player-name').textContent = save.matches ? 'Aarav Khan' : 'Aarav Khan';
  $('#stat-runs').textContent = save.runs;
  $('#stat-average').textContent = save.dismissals ? (save.runs / save.dismissals).toFixed(1) : (save.matches ? '∞' : '—');
  $('#stat-matches').textContent = save.matches;
  $('#form-message').textContent = save.form.length ? (save.form[0] >= 4 ? 'In great touch' : save.form[0] === 0 ? 'Back at the nets' : 'Finding your feet') : 'Ready to play';
  const dots = $('#form-dots'); dots.innerHTML = '';
  const form = [...save.form].slice(0, 5);
  while (form.length < 5) form.push(null);
  form.forEach(value => { const dot = document.createElement('i'); if (value === null) { dot.className = 'empty'; dot.textContent = '·'; } else { dot.className = value === 0 ? 'loss' : ''; dot.textContent = value === 0 ? '×' : '•'; } dots.append(dot); });
  const next = tiers[Math.min(tier + 1, tiers.length - 1)];
  const remaining = Math.max(0, next.required - save.wins);
  $('#next-goal-title').textContent = tier === tiers.length - 1 ? 'Become a world-class legend' : `Earn your ${next.name} call-up`;
  $('#next-goal-copy').textContent = tier === tiers.length - 1 ? 'Keep adding to your legacy' : `${remaining} more ${remaining === 1 ? 'win' : 'wins'} to the next level`;
  $('#goal-progress').textContent = tier === tiers.length - 1 ? 'MAX' : `${save.wins}/${next.required}`;
  $$('.path-step').forEach((el, i) => { el.classList.toggle('current', i === Math.min(tier, 3)); el.classList.toggle('locked', i > tier); });
  const careerList = $('#career-list'); careerList.innerHTML = '';
  tiers.forEach((item, i) => {
    const unlocked = i <= tier;
    const card = document.createElement('article'); card.className = `career-stage${i === tier ? ' current' : ''}${unlocked ? '' : ' locked'}`;
    card.innerHTML = `<span class="stage-number">CHAPTER 0${i + 1}</span><span class="stage-icon">${unlocked ? item.icon : '⌑'}</span><h3>${item.name}</h3><p>${item.note}</p><span class="stage-status">${i === tier ? '●  YOU ARE HERE' : unlocked ? '✓  UNLOCKED' : `🔒  ${item.required - save.wins} WINS TO UNLOCK`}</span>`;
    careerList.append(card);
  });
  const tierName = tiers[tier].name;
  $$('.profile-copy small').forEach(el => { el.textContent = `${tierName} · Batter`; });
  $('#timing-level').textContent = `LEVEL ${Math.min(1 + save.training, 10)}`;
  $('#sessions-count').textContent = save.training;
  const skill = Math.min(22 + save.training * 11, 92);
  $('#skill-bar-fill').style.width = `${skill}%`; $('#skill-level').textContent = skill;
}
function opponents() {
  const options = [['Hilltop XI', 'Riverside CC'], ['Eastfield Rovers', 'Westbridge CC'], ['Old Town Strikers', 'Riverside CC'], ['District Select', 'County XI'], ['Harbour Athletic', 'Riverside CC']];
  return options[Math.min(tierIndex(), options.length - 1)];
}
function startMatch() {
  if (match?.status === 'done') { showToast('Wrapping up your innings…'); return; }
  const [opponent] = opponents();
  const tier = tierIndex();
  const target = tier === 0 ? 14 : 16 + tier * 3;
  match = { score: 0, wickets: 0, balls: 0, target, opponent, status: 'ready', startedAt: 0, ideal: 1360, timer: null, bowler: 0 };
  $('#target-value').textContent = target;
  $('#match-score').innerHTML = `0<span>/0</span>`;
  $('#match-overs').innerHTML = `0.0 <i>OVERS</i>`;
  $('#runs-needed').innerHTML = `${target} <i>off 6</i>`;
  $('#delivery-label').textContent = 'READY WHEN YOU ARE';
  $('#delivery-count').textContent = 'BALL 1 OF 6';
  $('#delivery-instruction').textContent = 'Ready to make your mark?';
  $('#delivery-feedback').textContent = 'Tap to start the delivery, then swing at the sweet spot.';
  $('#swing-label').textContent = 'BOWL NEXT'; $('#swing-hint').textContent = 'TAP TO BEGIN';
  $('#swing-button').disabled = false;
  $('#cricket-ball').classList.remove('in-flight');
  $('.timing-meter').classList.remove('active');
  $$('.log-ball').forEach(ball => { ball.className = 'log-ball waiting'; ball.textContent = '·'; });
  $('#result-modal').classList.remove('show'); $('#result-modal').setAttribute('aria-hidden', 'true');
  showPage('match');
}
function launchDelivery() {
  if (!match || match.status !== 'ready' || match.balls >= 6) return;
  match.status = 'flight'; match.startedAt = performance.now();
  match.ideal = 1360 + (Math.random() * 110 - 55);
  $('#delivery-count').textContent = `BALL ${match.balls + 1} OF 6`;
  $('#delivery-instruction').textContent = 'Watch it come in…';
  $('#delivery-feedback').textContent = 'Swing when the ball reaches the glowing zone.';
  $('#delivery-label').textContent = 'BOWLER IN';
  $('#swing-label').textContent = 'SWING'; $('#swing-hint').textContent = 'FIND THE MIDDLE';
  $('#swing-button').disabled = false;
  $('#cricket-ball').classList.add('in-flight'); $('.timing-meter').classList.add('active');
  const ball = $('#cricket-ball');
  const animate = (now) => {
    if (!match || match.status !== 'flight') return;
    const elapsed = now - match.startedAt;
    const progress = Math.min(elapsed / 1750, 1);
    ball.style.top = `${10 + progress * 77}%`;
    ball.style.left = `${50 + Math.sin(progress * Math.PI) * 2}%`;
    $('.timing-meter i').style.left = `${Math.max(0, Math.min(97, progress * 100))}%`;
    if (elapsed >= 1900) { resolveShot(null); return; }
    rafId = requestAnimationFrame(animate);
  };
  rafId = requestAnimationFrame(animate);
}
function swing() {
  if (!match) return;
  if (match.status === 'ready') { launchDelivery(); return; }
  if (match.status !== 'flight') return;
  resolveShot(performance.now() - match.startedAt);
}
function resolveShot(elapsed) {
  if (!match || match.status !== 'flight') return;
  match.status = 'settling'; cancelAnimationFrame(rafId);
  $('#swing-button').disabled = true; $('.timing-meter').classList.remove('active');
  const skill = Math.min(save.training * 22, 160);
  const delta = elapsed === null ? Infinity : elapsed - match.ideal;
  const abs = Math.abs(delta);
  let runs = 0, wicket = false, label = 'DOT', message = 'No run. Reset and go again.';
  if (abs < 105 + skill * .26) {
    runs = Math.random() < .38 ? 6 : 4; label = runs === 6 ? 'SIX!' : 'FOUR'; message = runs === 6 ? 'Right out of the middle! Six!' : 'Beautifully timed. That races away!';
    $('#delivery-label').textContent = 'MIDDLE OF THE BAT';
  } else if (abs < 255 + skill * .55) {
    const outcomes = [2, 3, 4]; runs = outcomes[Math.floor(Math.random() * outcomes.length)]; label = `${runs} RUNS`; message = 'Good connection. Pick up a few!';
    $('#delivery-label').textContent = 'GOOD CONTACT';
  } else if (abs < 445 + skill) {
    if (Math.random() < .18) { wicket = true; label = 'W'; message = delta < 0 ? 'Too early — straight through the gate.' : 'Beaten for pace. The stumps are rattled!'; }
    else { runs = Math.random() < .55 ? 1 : 2; label = `${runs} RUN${runs > 1 ? 'S' : ''}`; message = delta < 0 ? 'A touch early, but you keep it moving.' : 'A little late, safely tucked away.'; }
    $('#delivery-label').textContent = 'EDGED AWAY';
  } else {
    if (Math.random() < (elapsed === null ? .38 : .27)) { wicket = true; label = 'W'; message = elapsed === null ? 'You left it too late. Bowled!' : delta < 0 ? 'Way too early. The bowler wins this one.' : 'Too late — the bowler has your number.'; }
    else { label = '·'; message = elapsed === null ? 'No swing. That one gets through.' : 'Missed it. Keep your eye on the ball.'; }
    $('#delivery-label').textContent = 'BEATEN';
  }
  if (wicket) match.wickets++; else match.score += runs;
  match.balls++;
  save.totalBalls++;
  $('#match-score').innerHTML = `${match.score}<span>/${match.wickets}</span>`;
  const overs = `${Math.floor(match.balls / 6)}.${match.balls % 6}`;
  $('#match-overs').innerHTML = `${overs} <i>OVERS</i>`;
  const remaining = Math.max(0, 6 - match.balls);
  $('#runs-needed').innerHTML = `${Math.max(0, match.target - match.score)} <i>off ${remaining}</i>`;
  const log = $$('.log-ball')[match.balls - 1];
  log.className = `log-ball ${wicket ? 'wicket' : runs >= 4 ? 'boundary' : runs ? 'run' : 'dot'}`;
  log.textContent = label;
  $('#delivery-instruction').textContent = wicket ? 'WICKET!' : label === '·' ? 'Dot ball.' : `${label} — lovely shot!`;
  $('#delivery-feedback').textContent = message;
  $('#swing-label').textContent = 'NEXT BALL'; $('#swing-hint').textContent = remaining ? 'KEEP IT GOING' : 'OVER COMPLETE';
  $('#swing-button').disabled = false;
  if (match.balls >= 6) {
    match.status = 'done'; $('#swing-button').disabled = true;
    window.setTimeout(finishMatch, 850);
  } else {
    match.status = 'ready';
    window.setTimeout(() => { if (match && match.status === 'ready') { $('#swing-label').textContent = 'BOWL NEXT'; $('#swing-hint').textContent = 'TAP TO BEGIN'; } }, 900);
  }
}
function finishMatch() {
  if (!match || match.status !== 'done') return;
  match.status = 'complete';
  const won = match.score >= match.target;
  save.matches++;
  if (won) { save.wins++; save.xp += 120; } else { save.losses++; save.xp += 45; }
  save.runs += match.score; save.dismissals += match.wickets;
  save.form.unshift(match.score); save.form = save.form.slice(0, 5);
  saveGame(); renderCareer();
  const justUnlocked = won && tiers[tierIndex()].required === save.wins;
  $('#result-title').textContent = justUnlocked ? `${tiers[tierIndex()].name} unlocked!` : won ? 'What an innings.' : 'The journey goes on.';
  $('#result-copy').textContent = won ? `You chased ${match.target} and made ${match.score}. A brilliant win for ${match.opponent}.` : `You made ${match.score}, just short of ${match.target}. Every ball is a lesson.`;
  $('#result-runs').textContent = match.score;
  $('#result-reward').innerHTML = won ? '+120 XP <span>✦</span>' : '+45 XP <span>✦</span>';
  $('#result-modal').classList.add('show'); $('#result-modal').setAttribute('aria-hidden', 'false');
}
function train() {
  save.training++; save.xp += 25; saveGame(); renderCareer();
  const button = $('#train-button'); button.innerHTML = '<span>SESSION COMPLETE ✓</span><span class="button-arrow">✦</span>'; button.style.background = '#d4f89d';
  showToast(`Great work! Timing improved to level ${Math.min(1 + save.training, 10)}.`);
  setTimeout(() => { button.innerHTML = '<span>START NET SESSION</span><span class="button-arrow">↗</span>'; button.style.background = ''; }, 1800);
}
$$('.nav-item').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));
$$('[data-goto="career"]').forEach(button => button.addEventListener('click', () => showPage('career')));
$('#play-match').addEventListener('click', startMatch);
$('#swing-button').addEventListener('click', swing);
$('#train-button').addEventListener('click', train);
$('#leave-match').addEventListener('click', () => { if (match && match.status !== 'done' && match.balls > 0) { showToast('Match paused — your innings is waiting.'); } showPage('home'); });
$('#continue-button').addEventListener('click', () => { $('#result-modal').classList.remove('show'); showPage('home'); });
$('#sound-toggle').addEventListener('click', () => { save.sound = !save.sound; saveGame(); $('#sound-toggle').textContent = save.sound ? '♫' : '♪'; showToast(save.sound ? 'Sound cues enabled' : 'Sound cues muted'); });
renderCareer();
