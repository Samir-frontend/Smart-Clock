const cvs = document.getElementById('clock');
const ctx = cvs.getContext('2d');

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const DATES  = Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0'));

let SIZE = 0, CX = 0, CY = 0;

// Ring radii as fractions of SIZE/2
const R = {
  outerDate:  0.97,
  innerDate:  0.73,
  outerMonth: 0.71,
  innerMonth: 0.52,
  outerDay:   0.50,
  innerDay:   0.43,
  face:       0.41,
  tickOuter:  0.40,
  tickInner5: 0.36,
  tickInner1: 0.38,
};

function setSize() {
  const s = Math.min(window.innerWidth, window.innerHeight) * 0.82;
  SIZE = s;
  cvs.width  = SIZE;
  cvs.height = SIZE;
  CX = SIZE / 2;
  CY = SIZE / 2;
}

function r(frac) { return frac * SIZE / 2; }
function toRad(deg) { return deg * Math.PI / 180; }

// Smooth rotation offsets
let dateOff  = 0, monthOff = 0, dayOff = 0;
let tDateOff = 0, tMonthOff = 0, tDayOff = 0;

function drawAnnulus(outerR, innerR, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(CX, CY, outerR, 0, Math.PI * 2);
  ctx.arc(CX, CY, innerR, 0, Math.PI * 2, true);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawCircleBorder(radius, color, alpha, width) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(CX, CY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function drawTextRing(items, radius, fontSize, normalColor, hlColor, hlIdx, baseAngle) {
  const total = items.length;
  const step  = 360 / total;

  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  items.forEach((item, i) => {
    const angle = toRad(baseAngle + i * step - 90);
    const x = CX + radius * Math.cos(angle);
    const y = CY + radius * Math.sin(angle);
    const isHL = i === hlIdx;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);

    ctx.font = `${isHL ? 'bold' : '300'} ${isHL ? fontSize * 1.15 : fontSize}px 'Courier New', monospace`;
    ctx.fillStyle = isHL ? hlColor : normalColor;

    if (isHL) {
      ctx.shadowColor = hlColor;
      ctx.shadowBlur  = 12;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillText(item, 0, 0);
    ctx.restore();
  });

  ctx.restore();
}

function drawTicks() {
  for (let i = 0; i < 60; i++) {
    const angle  = toRad(i * 6 - 90);
    const isHour = i % 5 === 0;
    const ro = r(R.tickOuter);
    const ri = isHour ? r(R.tickInner5) : r(R.tickInner1);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CX + ro * Math.cos(angle), CY + ro * Math.sin(angle));
    ctx.lineTo(CX + ri * Math.cos(angle), CY + ri * Math.sin(angle));
    ctx.strokeStyle = isHour ? '#555' : '#2e2e2e';
    ctx.lineWidth   = isHour ? Math.max(1.5, SIZE * 0.003) : Math.max(0.8, SIZE * 0.0015);
    ctx.stroke();
    ctx.restore();
  }
}

function drawHand(angleDeg, length, width, color, shadow) {
  const angle = toRad(angleDeg - 90);
  ctx.save();
  ctx.translate(CX, CY);
  if (shadow) {
    ctx.shadowColor = color;
    ctx.shadowBlur  = 10;
  }
  ctx.beginPath();
  ctx.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 10); // small back
  ctx.lineTo(Math.cos(angle) * -length * 0.18, Math.sin(angle) * -length * 0.18);
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
  ctx.strokeStyle = color;
  ctx.lineWidth   = width;
  ctx.lineCap     = 'round';
  ctx.stroke();
  ctx.restore();
}

function draw() {
  const now   = new Date();
  const sec   = now.getSeconds() + now.getMilliseconds() / 1000;
  const min   = now.getMinutes() + sec / 60;
  const hour  = (now.getHours() % 12) + min / 60;
  const dateN = now.getDate();
  const month = now.getMonth();
  const day   = now.getDay();

  // Target offsets: rotate ring so current item is at 12 o'clock (top)
  tDateOff  = -(dateN - 1) * (360 / 31);
  tMonthOff = -month       * (360 / 12);
  tDayOff   = -day         * (360 / 7);

  // Smooth lerp
  dateOff  += (tDateOff  - dateOff)  * 0.07;
  monthOff += (tMonthOff - monthOff) * 0.07;
  dayOff   += (tDayOff   - dayOff)   * 0.07;

  ctx.clearRect(0, 0, SIZE, SIZE);

  // ── RING BACKGROUNDS ─────────────────────────────────────────
  drawAnnulus(r(R.outerDate),  r(R.innerDate),  '#232323', 1);
  drawAnnulus(r(R.outerMonth), r(R.innerMonth), '#1e1e1e', 1);
  drawAnnulus(r(R.outerDay),   r(R.innerDay),   '#1b1b1b', 1);
  // Clock face
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, r(R.face), 0, Math.PI * 2);
  ctx.fillStyle = '#161616';
  ctx.fill();
  ctx.restore();

  // ── RING BORDERS ─────────────────────────────────────────────
  drawCircleBorder(r(R.outerDate),  '#fff', 0.12, 1);
  drawCircleBorder(r(R.innerDate),  '#fff', 0.10, 0.8);
  drawCircleBorder(r(R.innerMonth), '#fff', 0.08, 0.8);
  drawCircleBorder(r(R.innerDay),   '#fff', 0.07, 0.8);
  drawCircleBorder(r(R.face),       '#fff', 0.06, 0.8);

  // Highlight arc at top of each ring (active indicator)
  function drawHighlightArc(outerRad, innerRad, color) {
    const span = toRad(360 / (outerRad === r(R.outerDate) ? 31 : outerRad === r(R.outerMonth) ? 12 : 7) * 0.85);
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, outerRad - 1, -Math.PI/2 - span/2, -Math.PI/2 + span/2);
    ctx.arc(CX, CY, innerRad + 1, -Math.PI/2 + span/2, -Math.PI/2 - span/2, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.07;
    ctx.fill();
    ctx.restore();
  }
  drawHighlightArc(r(R.outerDate),  r(R.innerDate),  '#ff4444');
  drawHighlightArc(r(R.outerMonth), r(R.innerMonth), '#4fc3f7');
  drawHighlightArc(r(R.outerDay),   r(R.innerDay),   '#69f0ae');

  // ── TEXT RINGS ───────────────────────────────────────────────
  const dateFontSize  = Math.max(9,  SIZE * 0.028);
  const monthFontSize = Math.max(9,  SIZE * 0.027);
  const dayFontSize   = Math.max(8,  SIZE * 0.025);

  drawTextRing(DATES,  r(0.85), dateFontSize,  '#5a5a5a', '#ff4444', dateN - 1, dateOff);
  drawTextRing(MONTHS, r(0.62), monthFontSize, '#4a4a4a', '#4fc3f7', month,     monthOff);
  drawTextRing(DAYS,   r(0.47), dayFontSize,   '#3a3a3a', '#69f0ae', day,       dayOff);

  // ── TICK MARKS ───────────────────────────────────────────────
  drawTicks();

  // ── CLOCK HANDS ──────────────────────────────────────────────
  const hourAngle = hour * 30;
  const minAngle  = min  * 6;
  const secAngle  = sec  * 6;

  drawHand(hourAngle, r(0.24), Math.max(3, SIZE * 0.007), '#ffffff', true);
  drawHand(minAngle,  r(0.33), Math.max(2, SIZE * 0.005), '#cccccc', false);
  drawHand(secAngle,  r(0.36), Math.max(1, SIZE * 0.003), '#ff4444', true);

  // Center cap
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, Math.max(5, SIZE * 0.015), 0, Math.PI * 2);
  ctx.fillStyle = '#2a2a2a';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, Math.max(3, SIZE * 0.008), 0, Math.PI * 2);
  ctx.fillStyle = '#ff4444';
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.restore();

  // ── DIGITAL TIME ─────────────────────────────────────────────
  const realSec = now.getSeconds();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(realSec).padStart(2, '0');
  document.getElementById('dtime').textContent = `${hh}:${mm}:${ss}`;

  const dayNames   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  document.getElementById('ddate').textContent =
    `${dayNames[day]}, ${now.getDate()} ${monthNames[month]} ${now.getFullYear()}`;
}

function loop() {
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  setSize();
});

setSize();
loop();