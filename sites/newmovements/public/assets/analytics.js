let session;
const queue=[];
let timer;
const enabled=()=>navigator.globalPrivacyControl!==true && navigator.doNotTrack!=='1';
try {
  const saved=JSON.parse(sessionStorage.getItem('nm-analytics-session')||'null');
  session=saved && Date.now()-saved.at<30*60*1000 ? saved.id : crypto.randomUUID();
  if(enabled()) sessionStorage.setItem('nm-analytics-session',JSON.stringify({id:session,at:Date.now()}));
} catch { session=crypto.randomUUID(); }
async function flush() {
  clearTimeout(timer);
  if(!queue.length || !enabled()) return;
  const events=queue.splice(0,25);
  try {
    const r=await fetch('/reai/analytics/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events}),keepalive:true});
    if(!r.ok && r.status>=500) queue.unshift(...events);
  } catch { queue.unshift(...events); }
  // Bound memory and retry once on the next interaction, retaining event UUIDs.
  queue.splice(25);
}
export function track(kind,details={}) {
  if(!enabled()) return;
  if(details.productId && !/^[0-9a-f-]{36}$/i.test(details.productId)) delete details.productId;
  if(details.variantId && !/^[0-9a-f-]{36}$/i.test(details.variantId)) delete details.variantId;
  if(details.quantity!=null) details.quantity=Math.min(100,Math.max(1,Math.trunc(details.quantity)));
  queue.push({id:crypto.randomUUID(),sessionId:session,kind,path:location.pathname,...details});
  if(queue.length>=10) void flush();
  else { clearTimeout(timer); timer=setTimeout(flush,800); }
}
track('page_view');
if(location.pathname.replace(/^\/no(?=\/)/,'')==='/checkout') track('checkout_view');
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden') void flush();});
window.addEventListener('pagehide',()=>{void flush();});
