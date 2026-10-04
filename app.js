'use strict';
const stops = [
  ['Çantanı tak', 'Sabah erkenden sırt çantama yiyeceklerimi doldurup ormanın girişine geldim.'],
  ['Nefes al, yürü', 'Derin bir nefes alıp yürümeye başladım.'],
  ['Zıpla', 'Yolun ortasında devrilmiş, büyük bir ağaç gövdesi çıkınca durdum ve karşıya geçmek için onun üzerinden zıpladım.'],
  ['Dengeni koru', 'Hemen ardından başımın üstünden vınlayarak geçen çılgın bir arı sürüsü yüzünden dengemi kaybettim, yere düşmemek için kollarımı iki yana açıp sallandım.'],
  ['Çömel', 'Sağdaki çalılıkların arkasına gizlendim. Görünmemek için iyice küçüldüm, arıların gitmesini bekledim.'],
  ['Tırman', 'Ayağa kalkıp yoluma devam ederken bu kez de karşıma sarp bir kayalık çıktı. İpe tutunup yukarı tırmandım.'],
  ['Üşüdün mü?', 'Zirveye çıktığımda rüzgâr o kadar şiddetli esiyordu ki saçlarım savruldu, ben de kollarımı bağlayıp soğuktan korunmaya çalıştım.'],
  ['Köprüden geç', 'Vadideki iki tepeyi birbirine bağlayan tahta köprüden karşıya geçtim.'],
  ['El salla', 'Karşıya vardığımda karşıma tatlı, sevimli bir sincap çıktı. Ona elimi sallayıp tebessümle selam verdim.'],
  ['Yaşasın!', 'Günün sonunda macera dolu bu ormandan başarıyla çıkmanın coşkusuyla gezimi tamamladım.']
];
const $ = id => document.getElementById(id);
const video = $('video');
const watched = new Set();
let current = 0;
let playRequest = 0;
let autoRepeat = false;
const videoWrap = video.parentElement;
const videoPlaceholder = document.createElement('div');
videoPlaceholder.className = 'video-placeholder';
// Coordinates are on the original 1920 × 1080 design canvas.
const positions = Array.from({length: 10}, (_, i) => [
  64 + (i % 5) * 244, i < 5 ? 310 : 644, 210, 245, 210
]);
const routeButtons = positions.map(([x,y,w,h,d], i) => {
  const button = document.createElement('button');
  button.className = 'stop' + (i === 0 ? ' first' : '');
  button.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;--diameter:${d}px`;
  button.setAttribute('aria-label', `${i + 1}. durak: ${stops[i][0]}`);
  button.innerHTML = `<span class="stop-portrait"><img src="assets/durak-${i + 1}.jpg" alt=""></span><span class="ring" style="left:0;top:0;width:${d}px;height:${d}px"></span><span class="stop-number">${i + 1}</span><span class="stop-label">${stops[i][0]}</span>`;
  button.addEventListener('click', () => {
    selectStop(i);
  });
  $('route').append(button);
  return button;
});
function viewportSize() {
  const viewport = window.visualViewport;
  return {width: viewport?.width || window.innerWidth, height: viewport?.height || window.innerHeight,
    left: viewport?.offsetLeft || 0, top: viewport?.offsetTop || 0};
}
function resize() {
  const {width, height, left, top} = viewportSize();
  const stage = $('stage');
  stage.style.setProperty('--scale', Math.min(width / 1920, height / 1080));
  stage.style.left = `${left + width / 2}px`;
  stage.style.top = `${top + height / 2}px`;
  updateOrientation();
}
let resizeFrame;
let resizeTimer;
function scheduleResize() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(resize);
  clearTimeout(resizeTimer);
  // Mobile browser bars and orientation locks settle after the first resize.
  resizeTimer = setTimeout(resize, 250);
}
function isMobileScreen() {
  return window.matchMedia('(max-width: 900px)').matches || window.matchMedia('(pointer: coarse) and (max-width: 1366px)').matches;
}
function updateOrientation() {
  const {width, height} = viewportSize();
  const blocked = isMobileScreen() && height > width;
  const wasBlocked = !$('orientation-gate').hidden;
  $('orientation-gate').hidden = !blocked;
  $('stage').inert = blocked;
  $('stage').setAttribute('aria-hidden', String(blocked));
  if (blocked) { playRequest++; video.pause(); }
  if (blocked && !wasBlocked) $('orientation-fullscreen').focus({preventScroll:true});
  if (!blocked && wasBlocked) ($('cover').hidden ? $('watch') : $('start')).focus({preventScroll:true});
}
window.addEventListener('resize', scheduleResize);
window.addEventListener('orientationchange', scheduleResize);
window.visualViewport?.addEventListener('resize', scheduleResize);
window.visualViewport?.addEventListener('scroll', scheduleResize);
if (window.screen.orientation?.addEventListener) window.screen.orientation.addEventListener('change', scheduleResize);
resize();
function playbackUI() {
  const playing = !video.paused && !video.ended;
  video.parentElement.classList.toggle('playing', playing);
  $('watch').querySelector('span').textContent = playing ? 'Duraklat' : 'İzle';
  $('watch-icon').setAttribute('d', playing ? 'M7 4h7v24H7zM20 4h7v24h-7z' : 'M9 4v24l20-12z');
  $('video-play').setAttribute('aria-label', playing ? 'Videoyu duraklat' : 'Videoyu oynat');
}
function selectStop(index) {
  playRequest++;
  video.pause();
  current = index;
  videoWrap.classList.remove('has-started');
  $('video-message').hidden = true;
  $('activity-title').textContent = stops[index][0];
  $('instructions').textContent = stops[index][1];
  $('badge').textContent = `${index + 1}. DURAK`;
  $('counter').textContent = `${index + 1} / 10 durak`;
  $('next').querySelector('span').textContent = index === 9 ? 'Tamamla' : 'Sıradaki';
  video.poster = `assets/durak-${index + 1}.jpg`;
  video.src = `videolar/${index + 1}.mp4`;
  video.setAttribute('aria-label', `${stops[index][0]} hareket videosu`);
  video.load();
  $('video-progress-fill').style.width = '0%';
  routeButtons.forEach((button, i) => {
    if (i === index) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
    button.classList.toggle('done', watched.has(i));
  });
  playbackUI();
  if (autoRepeat) play();
}
async function play(restart = false) {
  const request = ++playRequest;
  if (restart || video.ended) video.currentTime = 0;
  $('video-message').hidden = true;
  try { await video.play(); }
  catch (error) {
    if (request !== playRequest || error.name === 'AbortError') return;
    $('video-message').textContent = 'Video açılamadı. Videolar klasörünü kontrol edip İzle düğmesine dokun.';
    $('video-message').hidden = false;
  }
  playbackUI();
}
function togglePlay() { if (video.paused || video.ended) play(); else video.pause(); }
function showCover() {
  closeVideo(false);
  playRequest++;
  video.pause();
  $('completion').hidden = true;
  $('adventure').inert = false;
  $('adventure').hidden = true;
  $('cover').hidden = false;
  $('start').focus();
}
function startAdventure() {
  if (!$('orientation-gate').hidden) return;
  enterFullscreen();
  $('cover').hidden = true;
  $('adventure').hidden = false;
  selectStop(0);
  $('watch').focus({preventScroll:true});
}
$('start').addEventListener('click', startAdventure);
$('home').addEventListener('click', showCover);
$('home-button').addEventListener('click', showCover);
$('watch').addEventListener('click', togglePlay);
$('video-play').addEventListener('click', togglePlay);
function openVideo() {
  const wasPlaying = !video.paused;
  videoWrap.before(videoPlaceholder);
  $('video-dialog-host').append(videoWrap);
  videoWrap.classList.add('enlarged');
  $('video-dialog').hidden = false;
  [...$('adventure').children].filter(el => el.id !== 'video-dialog').forEach(el => el.inert = true);
  $('video-expand').querySelector('span').textContent = 'Küçült';
  $('video-expand').setAttribute('aria-label', 'Videoyu küçült');
  $('video-close').focus({preventScroll:true});
  if (wasPlaying && video.paused) play();
}
function closeVideo(resume = true) {
  if ($('video-dialog').hidden) return;
  const wasPlaying = !video.paused;
  videoPlaceholder.replaceWith(videoWrap);
  videoWrap.classList.remove('enlarged');
  $('video-dialog').hidden = true;
  [...$('adventure').children].forEach(el => el.inert = false);
  $('video-expand').querySelector('span').textContent = 'Genişlet';
  $('video-expand').setAttribute('aria-label', 'Videoyu genişlet');
  if (resume) {
    $('watch').focus({preventScroll:true});
    if (wasPlaying && video.paused) play();
  }
}
$('video-expand').addEventListener('click', () => { if ($('video-dialog').hidden) openVideo(); else closeVideo(); });
$('video-close').addEventListener('click', () => closeVideo());
$('video-dialog').addEventListener('click', event => { if (event.target === $('video-dialog')) closeVideo(); });
function setAutoRepeat(enabled) {
  autoRepeat = enabled;
  $('replay').setAttribute('aria-pressed', String(enabled));
  $('replay').querySelector('span').textContent = enabled ? 'Tekrarlamayı durdur' : 'Otomatik tekrarla';
}
$('replay').addEventListener('click', () => {
  setAutoRepeat(!autoRepeat);
  if (autoRepeat) play();
});
$('next').addEventListener('click', () => {
  if (current < 9) selectStop(current + 1);
  else {
    playRequest++;
    video.pause();
    $('completion').hidden = false;
    [...$('adventure').children].filter(el => el.id !== 'completion').forEach(el => el.inert = true);
    $('restart').focus();
  }
});
function closeCompletion() {
  $('completion').hidden = true;
  [...$('adventure').children].forEach(el => el.inert = false);
}
$('restart').addEventListener('click', () => {
  closeCompletion(); watched.clear(); setAutoRepeat(false); selectStop(0); $('watch').focus();
});
$('back-cover').addEventListener('click', () => { closeCompletion(); showCover(); });
['play','pause','ended','emptied'].forEach(event => video.addEventListener(event, playbackUI));
video.addEventListener('play', () => videoWrap.classList.add('has-started'));
video.addEventListener('ended', () => {
  watched.add(current); routeButtons[current].classList.add('done');
  if (autoRepeat && !$('adventure').hidden && $('completion').hidden) play(true);
});
video.addEventListener('timeupdate', () => {
  $('video-progress-fill').style.width = `${video.duration ? video.currentTime / video.duration * 100 : 0}%`;
});
video.addEventListener('error', () => {
  $('video-message').textContent = 'Video bulunamadı. HTML dosyası ile videolar klasörünün yan yana olduğundan emin ol.';
  $('video-message').hidden = false;
});
let fullscreenBusy = false;
let autoFullscreenRequested = false;
function fullscreenElement() { return document.fullscreenElement || document.webkitFullscreenElement; }
async function enterFullscreen() {
  if (fullscreenBusy) return;
  if (isMobileScreen()) autoFullscreenRequested = true;
  fullscreenBusy = true;
  try {
    if (!fullscreenElement()) {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else if (document.documentElement.webkitRequestFullscreen) await document.documentElement.webkitRequestFullscreen();
    }
    if (fullscreenElement() && isMobileScreen() && window.screen.orientation?.lock) {
      try { await window.screen.orientation.lock('landscape'); } catch { /* The rotate screen remains available when locking is unsupported. */ }
    }
  } catch { /* Continue with the fitted layout if this browser denies full screen. */ }
  finally { fullscreenBusy = false; resize(); scheduleResize(); }
}
$('orientation-fullscreen').addEventListener('click', () => {
  enterFullscreen();
});
document.addEventListener('pointerdown', event => {
  if (!isMobileScreen() || autoFullscreenRequested || event.target.closest('#fullscreen,#orientation-fullscreen')) return;
  autoFullscreenRequested = true;
  enterFullscreen();
}, {capture:true});
$('fullscreen').addEventListener('click', async () => {
  if (fullscreenElement()) {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    } catch {}
  } else await enterFullscreen();
});
function fullscreenChanged() {
  const full = !!fullscreenElement();
  $('fullscreen').querySelector('span').textContent = full ? 'Küçült' : 'Tam ekran';
  $('fullscreen').setAttribute('aria-label', full ? 'Tam ekrandan çık' : 'Tam ekranı aç');
  if (!full && window.screen.orientation?.unlock) { try { window.screen.orientation.unlock(); } catch {} }
  resize(); scheduleResize();
}
document.addEventListener('fullscreenchange', fullscreenChanged);
document.addEventListener('webkitfullscreenchange', fullscreenChanged);
document.addEventListener('keydown', event => {
  if (!$('orientation-gate').hidden) return;
  if (!$('video-dialog').hidden) {
    if (event.key === 'Escape') { event.preventDefault(); closeVideo(); }
    if (event.key === 'Tab') {
      const buttons = [...$('video-dialog').querySelectorAll('button')].filter(button => button.getClientRects().length);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (event.code === 'Space' && event.target.tagName !== 'BUTTON') { event.preventDefault(); togglePlay(); }
    return;
  }
  if (!$('completion').hidden) {
    if (event.key === 'Escape') { closeCompletion(); $('next').focus(); }
    if (event.key === 'Tab') {
      event.preventDefault();
      (document.activeElement === $('restart') ? $('back-cover') : $('restart')).focus();
    }
    return;
  }
  if ($('adventure').hidden) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); if (current < 9) selectStop(current + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); if (current > 0) selectStop(current - 1); }
  if (event.code === 'Space' && event.target.tagName !== 'BUTTON') { event.preventDefault(); togglePlay(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
