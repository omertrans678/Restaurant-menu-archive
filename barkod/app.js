'use strict';
const $ = id => document.getElementById(id);
let items = [];
try { const saved = JSON.parse(localStorage.getItem('barkod-listesi') || '[]'); if(Array.isArray(saved)) items = saved.filter(x => typeof x.code === 'string' && Number.isSafeInteger(x.quantity) && x.quantity > 0); } catch {}
function status(message) { $('status').textContent = message; }
let feedbackTimer;
function showSuccess() {
  clearTimeout(feedbackTimer);
  $('scan-area').classList.add('scan-success');
  $('status').classList.add('success');
  feedbackTimer = setTimeout(() => { $('scan-area').classList.remove('scan-success'); $('status').classList.remove('success'); }, 700);
}
function render() {
  $('rows').replaceChildren();
  for (const item of items) {
    const row = document.createElement('tr');
    const code = document.createElement('td'); code.textContent = item.code;
    const quantity = document.createElement('td'); quantity.textContent = item.quantity;
    const action = document.createElement('td');
    const remove = document.createElement('button'); remove.textContent = 'Sil'; remove.setAttribute('aria-label', item.code + ' barkodunu sil');
    remove.onclick = () => { items = items.filter(x => x !== item); render(); };
    action.append(remove); row.append(code, quantity, action); $('rows').append(row);
  }
  $('count').textContent = items.length ? `${items.length} farklı barkod · ${items.reduce((sum,x)=>sum+x.quantity,0)} toplam adet` : 'Liste boş.';
  $('download').disabled = $('clear').disabled = !items.length;
  try { localStorage.setItem('barkod-listesi', JSON.stringify(items)); } catch { status('Tarayıcı listeyi saklayamadı. Sayfayı kapatmadan Excel olarak indirin.'); }
}
function add(code) {
  code = code.trim().toUpperCase();
  if (!/^[A-Za-z0-9]{10}$/.test(code)) { status('Yalnızca 10 karakterli kısa barkod kabul edilir. QR ve uzun kargo barkodunu okutmayın.'); return false; }
  const existing = items.find(x => x.code === code);
  if (existing) { existing.quantity++; items = items.filter(x => x !== existing); items.unshift(existing); }
  else items.unshift({code, quantity:1});
  render(); $('list-area').scrollTop = 0; status(`✓ ${code} eklendi.`); showSuccess(); return true;
}
$('form').onsubmit = event => { event.preventDefault(); if (add($('barcode').value)) $('barcode').value = ''; $('barcode').focus(); };
$('clear').onclick = () => { if(confirm('Tüm liste silinsin mi?')) {items=[]; render(); status('Liste temizlendi.');} };
$('download').onclick = () => {
  if (!window.XLSX) {status('Excel bileşeni yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenileyin.'); return;}
  const sheet = XLSX.utils.aoa_to_sheet([['Barkod','Adet'], ...items.map(x => [x.code, x.quantity])]);
  sheet['!cols'] = [{wch:30},{wch:12}];
  const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Barkodlar');
  XLSX.writeFile(book, `barkod-listesi-${new Date().toISOString().slice(0,10)}.xlsx`);
};

let stream, running = false, frameRequest, detector, decoder, currentCode = '', missedFrames = 0;
const capture = document.createElement('canvas');
const rotated = document.createElement('canvas');
function acceptScan(code) {
  code = (code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(code)) return false;
  missedFrames = 0;
  if (code !== currentCode) {
    currentCode = code;
    add(code);
    if (navigator.vibrate) navigator.vibrate(60);
  }
  return true;
}
function decodeCanvas(canvas) {
  try {
    const bitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(new ZXing.HTMLCanvasElementLuminanceSource(canvas)));
    return decoder.decodeBitmap(bitmap).getText();
  } catch { return ''; }
}
async function scanLoop() {
  if (!running) return;
  const video = $('video');
  if (video.readyState >= 2 && video.videoWidth) {
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale), h = Math.round(video.videoHeight * scale);
    if (capture.width !== w || capture.height !== h) {capture.width = w; capture.height = h;}
    capture.getContext('2d', {willReadFrequently:true}).drawImage(video, 0, 0, w, h);
    let code = '';
    if (detector) {
      try {
        const results = await detector.detect(capture);
        code = results.find(x => /^[A-Za-z0-9]{10}$/.test(x.rawValue))?.rawValue || '';
      } catch { detector = null; }
    }
    if (!detector && decoder) {
      code = decodeCanvas(capture);
      if (!/^[A-Za-z0-9]{10}$/.test(code)) {
        if (rotated.width !== h || rotated.height !== w) {rotated.width=h; rotated.height=w;}
        const context = rotated.getContext('2d', {willReadFrequently:true});
        context.setTransform(0,1,-1,0,h,0);
        context.drawImage(capture,0,0);
        code = decodeCanvas(rotated);
      }
    }
    if (!running) return;
    if (!acceptScan(code) && ++missedFrames >= 3) currentCode = '';
  }
  if (running) frameRequest = requestAnimationFrame(scanLoop);
}
function stopCamera() {
  running = false;
  cancelAnimationFrame(frameRequest);
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null; $('video').srcObject = null;
  $('scan-area').classList.remove('scanning','scan-success');
  $('camera').hidden = false; $('stop').hidden = true;
  currentCode = ''; missedFrames = 0;
}
$('camera').onclick = async () => {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {status('Kamera için HTTPS adresinden açın.'); return;}
  $('camera').disabled = true;
  try {
    detector = null; decoder = null;
    if (window.BarcodeDetector) {
      const formats = await BarcodeDetector.getSupportedFormats();
      const supported = ['code_128','code_39','code_93','codabar','itf'].filter(x => formats.includes(x));
      if (supported.length) detector = new BarcodeDetector({formats:supported});
    }
    if (window.ZXing) {
      const hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.CODE_128,ZXing.BarcodeFormat.CODE_39,ZXing.BarcodeFormat.CODE_93,ZXing.BarcodeFormat.ITF,ZXing.BarcodeFormat.CODABAR]);
      hints.set(ZXing.DecodeHintType.TRY_HARDER,true);
      decoder = new ZXing.BrowserMultiFormatReader(hints);
    }
    if (!detector && !decoder) throw new Error('decoder');
    stream = await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:8192},height:{ideal:8192},frameRate:{ideal:30}}});
    const track = stream.getVideoTracks()[0];
    const caps = track.getCapabilities?.() || {};
    if (caps.width?.max && caps.height?.max) {
      try {await track.applyConstraints({width:{exact:caps.width.max},height:{exact:caps.height.max}});}
      catch {try {await track.applyConstraints({width:{ideal:caps.width.max},height:{ideal:caps.height.max}});} catch {}}
    }
    if (caps.focusMode?.includes('continuous')) {try {await track.applyConstraints({advanced:[{focusMode:'continuous'}]});} catch {}}
    $('video').srcObject = stream;
    await $('video').play();
    running = true; currentCode=''; missedFrames=0;
    $('scan-area').classList.add('scanning'); $('camera').hidden=true; $('stop').hidden=false;
    const settings = track.getSettings();
    $('resolution').textContent = `${settings.width || '?'} × ${settings.height || '?'}`;
    status('Kamera açık · Yatay veya dikey okutun.');
    frameRequest = requestAnimationFrame(scanLoop);
  } catch {stopCamera();status('Kamera açılamadı. Kamera iznini ve internet bağlantısını kontrol edin.');}
  finally {$('camera').disabled=false;}
};
$('stop').onclick = () => {stopCamera();status('Kamera kapatıldı.');};
window.addEventListener('pagehide', stopCamera);
render();
