'use strict';
const $ = id => document.getElementById(id);
let items = [];
try { const saved = JSON.parse(localStorage.getItem('barkod-listesi') || '[]'); if(Array.isArray(saved)) items = saved.filter(x => typeof x.code === 'string' && Number.isSafeInteger(x.quantity) && x.quantity > 0); } catch {}
function status(message) { $('status').textContent = message; }
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
  code = code.trim(); if (!code || code.length > 200) return;
  const existing = items.find(x => x.code === code);
  if (existing) existing.quantity++; else items.push({code, quantity:1});
  render(); status(`${code} eklendi.`);
}
$('form').onsubmit = event => { event.preventDefault(); add($('barcode').value); $('barcode').value = ''; $('barcode').focus(); };
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
    scanner ||= new Html5Qrcode('reader');
    await scanner.start({facingMode:'environment'}, {fps:10}, code => {
      const now = Date.now();
      // Aynı barkod kamera önünde tutulurken yalnızca bir kez ekle.
      const duplicate = code === lastCode && now-lastSeen < 1800;
      lastCode = code; lastSeen = now;
      if(!duplicate) {add(code); if(navigator.vibrate) navigator.vibrate(80);}
    });
    running = true; $('camera').hidden = true; $('stop').hidden = false;
    status('Kamera açık. Barkodu gösterin; tekrar eklemek için 2 saniye kameradan uzaklaştırın.');
  } catch {status('Kamera açılamadı. Kamera iznini kontrol edin veya barkodu elle girin.');}
  finally {$('camera').disabled = false;}
};
$('stop').onclick = async () => {
  if(!running) return;
  $('stop').disabled = true;
  try {await scanner.stop(); running=false; scanner.clear(); $('camera').hidden=false; $('stop').hidden=true; lastCode=''; status('Kamera kapatıldı.');}
  catch {status('Kamera kapatılamadı. Sayfayı yenileyin.');}
  finally {$('stop').disabled=false;}
};
render();
