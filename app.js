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
const positions = [
  [52, 299, 235, 256, 235], [335, 317, 199, 235, 199],
  [584, 318, 199, 235, 199], [834, 322, 199, 233, 199],
  [1081, 332, 198, 222, 198], [76, 643, 203, 230, 203],
  [332, 656, 197, 220, 197], [584, 637, 197, 234, 197],
  [836, 646, 197, 236, 197], [1087, 637, 197, 235, 197]
];
const routeButtons = positions.map(([x,y,w,h,d], i) => {
  const button = document.createElement('button');
  button.className = 'stop' + (i === 0 ? ' first' : '');
  button.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;--diameter:${d}px`;
  button.setAttribute('aria-label', `${i + 1}. durak: ${stops[i][0]}`);
  button.innerHTML = `<span class="stop-portrait"><img src="assets/durak-${i + 1}.jpg" alt=""></span><span class="ring" style="left:0;top:0;width:${d}px;height:${d}px"></span><span class="stop-number">${i + 1}</span><span class="stop-label">${stops[i][0]}</span>`;
  button.addEventListener('click', () => {
    selectStop(i);
    if (window.matchMedia('(max-width: 900px)').matches) document.querySelector('.activity').scrollIntoView({behavior:'smooth',block:'start'});
  });
  $('route').append(button);
  return button;
});
function resize() {
  $('stage').style.setProperty('--scale', Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
}
window.addEventListener('resize', resize);
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
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else if (video.webkitEnterFullscreen && video.readyState) video.webkitEnterFullscreen();
    else $('fullscreen').querySelector('span').textContent = 'Desteklenmiyor';
  } catch { $('fullscreen').querySelector('span').textContent = window.matchMedia('(max-width: 900px)').matches ? 'Desteklenmiyor' : 'F11 ile aç'; }
});
document.addEventListener('fullscreenchange', () => {
  const full = !!document.fullscreenElement;
  $('fullscreen').querySelector('span').textContent = full ? 'Küçült' : 'Tam ekran';
  $('fullscreen').setAttribute('aria-label', full ? 'Tam ekrandan çık' : 'Tam ekranı aç');
  resize();
});
document.addEventListener('keydown', event => {
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
