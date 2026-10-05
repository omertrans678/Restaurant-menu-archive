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
  render(); status(`✓ ${code} eklendi.`); showSuccess(); return true;
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
let scanner, running = false, lastCode = '', lastSeen = 0;
$('camera').onclick = async () => {
  if (!window.Html5Qrcode) {status('Kamera bileşeni yüklenemedi. İnternet bağlantısını kontrol edin.'); return;}
  if (!window.isSecureContext) {status('Kamera için HTTPS adresinden açın (GitHub Pages).'); return;}
  $('camera').disabled = true;
  try {
    scanner ||= new Html5Qrcode('reader', {formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39, Html5QrcodeSupportedFormats.CODE_93, Html5QrcodeSupportedFormats.ITF, Html5QrcodeSupportedFormats.CODABAR], verbose: false});
    await scanner.start({facingMode:'environment'}, {fps:10, qrbox: (width, height) => ({width: Math.floor(width * 0.9), height: Math.floor(Math.min(height * 0.6, 160))})}, code => {
      if (!/^[A-Za-z0-9]{10}$/.test(code)) return;
      const now = Date.now();
      // Aynı barkod kamera önünde tutulurken yalnızca bir kez ekle.
      const duplicate = code === lastCode && now-lastSeen < 1000;
      lastCode = code; lastSeen = now;
      if(!duplicate) {add(code); if(navigator.vibrate) navigator.vibrate(80);}
    });
    running = true; $('scan-area').classList.add('scanning'); $('camera').hidden = true; $('stop').hidden = false;
    status('Kamera açık. 10 karakterli kısa barkodu çerçeveye yatay yerleştirin; tekrar eklemek için 1 saniye kameradan uzaklaştırın.');
  } catch {status('Kamera açılamadı. Kamera iznini kontrol edin veya barkodu elle girin.');}
  finally {$('camera').disabled = false;}
};
$('stop').onclick = async () => {
  if(!running) return;
  $('stop').disabled = true;
  try {await scanner.stop(); running=false; scanner.clear(); $('scan-area').classList.remove('scanning', 'scan-success'); $('camera').hidden=false; $('stop').hidden=true; lastCode=''; status('Kamera kapatıldı.');}
  catch {status('Kamera kapatılamadı. Sayfayı yenileyin.');}
  finally {$('stop').disabled=false;}
};
render();
