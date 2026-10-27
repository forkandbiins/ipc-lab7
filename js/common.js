'use strict';
/* Shared helpers: storage (localStorage stands in for the database in this lab demo), validation, tables. */
const IPC={
 /* TEAM DESIGN DECISION / TO VALIDATE with iPc: page access per role, based on Chapter 1 role descriptions. */
 ACCESS:{'System Administrator':['dash','master','inv','rep'],'Operations Manager':['dash','master','inv','rep'],'Inventory Personnel':['dash','master','inv'],'Production Personnel':['dash','inv']},
 LANDING:{'System Administrator':'dashboard.html','Operations Manager':'dashboard.html','Inventory Personnel':'inventory-transaction.html','Production Personnel':'inventory-transaction.html'},
 READONLY:{'Operations Manager':['master','inv'],'Production Personnel':['inv']},
 get(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}},
 set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
 user(){try{return JSON.parse(sessionStorage.getItem('ipc_user'))}catch(e){return null}},
 esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))},
 notice(t,ok=true){
  const n=document.getElementById('notice');
  if(n&&n.hasAttribute('data-inline')){n.className=ok?'ok':'bad';n.textContent=t;return}
  let c=document.getElementById('toasts');
  if(!c){c=document.createElement('div');c.id='toasts';c.setAttribute('role','status');c.setAttribute('aria-live','polite');document.body.appendChild(c)}
  const d=document.createElement('div');d.className='toast'+(ok?'':' bad');d.textContent=t;c.appendChild(d);setTimeout(()=>d.remove(),5000)},
 /* DEMO SEED ONLY: placeholder records so forms can be demonstrated; not iPc data. */
 seed(){
  if(!this.get('ipc_materials').length)this.set('ipc_materials',[
   {sku:'RM-0001',name:'DEMO LDPE roll',form:'Roll',polymer:'LDPE',uom:'roll',reorder:10},
   {sku:'RM-0002',name:'DEMO HDPE pellet',form:'Pellet',polymer:'HDPE',uom:'sack',reorder:50}]);
  if(!this.get('ipc_locations').length)this.set('ipc_locations',[
   {code:'Zone A - Rack 01 - Shelf A - Bin 01',status:'Available',notes:'DEMO'},
   {code:'Zone A - Rack 01 - Shelf A - Bin 02',status:'Available',notes:'DEMO'}]);
 },
 /* Inventory Balance Computation: one sequential pass over transactions, O(n). */
 balances(tx){const b={};tx.forEach(t=>{if(!t.batch)return;const q=+t.qty,neg=t.type==='issue'||(t.type==='adjust'&&t.adjtype==='decrease');b[t.batch]=(b[t.batch]||0)+(neg?-q:q)});return b},
 table(head,rows,empty='No records yet.'){
  return `<thead><tr>${head.map(h=>`<th scope="col">${this.esc(h)}</th>`).join('')}</tr></thead><tbody>`+
  (rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${this.esc(c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${head.length}">${empty}</td></tr>`)+'</tbody>'}
};
function errBox(el){
 const id=(el.type==='radio'?el.name:el.id)+'-err';let b=document.getElementById(id);
 if(!b){b=document.createElement('span');b.id=id;b.className='err';b.setAttribute('role','alert');el.insertAdjacentElement('afterend',b)}
 return b}
function msgFor(el){
 if(!el.willValidate)return'';
 const v=el.validity,d=el.dataset;
 if(v.valid)return'';
 if(v.customError)return el.validationMessage;
 if(v.valueMissing)return d.msgRequired||'This field is required.';
 if(v.typeMismatch||v.patternMismatch)return d.msgFormat||'Invalid format.';
 if(v.tooShort)return`Enter at least ${el.minLength} characters.`;
 if(v.tooLong)return`Maximum ${el.maxLength} characters.`;
 if(v.rangeUnderflow)return d.msgRange||`Value must be at least ${el.min}.`;
 if(v.rangeOverflow)return d.msgRange||`Value must not exceed ${el.max}.`;
 if(v.badInput||v.stepMismatch)return'Enter a valid value.';
 return el.validationMessage}
function check(el){
 const m=msgFor(el);errBox(el).textContent=m;
 (el.type==='radio'?document.getElementsByName(el.name):[el]).forEach(e=>m?e.setAttribute('aria-invalid','true'):e.removeAttribute('aria-invalid'));
 return!m}
/* initForm: blur/change validation, submit prevention on invalid input, error summary, reset clean-up. */
function initForm(form,{pre,ok}={}){
 const ctls=()=>[...form.elements].filter(e=>/^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName)&&!['hidden','submit','reset','button'].includes(e.type));
 ctls().forEach(e=>{
  if(e.type!=='checkbox')errBox(e);
  if(e.id)e.setAttribute('aria-describedby',`${e.id}-help ${e.id}-err`);
  const run=()=>{pre&&pre();check(e)};
  e.addEventListener(['select-one','checkbox','radio'].includes(e.type)?'change':'blur',run);
  e.addEventListener('input',()=>{if(e.getAttribute('aria-invalid'))run()});
 });
 form.addEventListener('submit',ev=>{
  ev.preventDefault();pre&&pre();
  const seen=new Set(),bad=ctls().filter(c=>{const k=c.type==='radio'?c.name:c.id;if(seen.has(k))return false;seen.add(k);return!check(c)});
  const s=form.querySelector('.summary');
  if(bad.length){s.className='summary bad';s.textContent=`Form not submitted: ${bad.length} field(s) need attention.`;bad[0].focus();return}
  s.className='summary';s.textContent='';ok&&ok(new FormData(form));
 });
 form.addEventListener('reset',()=>setTimeout(()=>{
  ctls().forEach(c=>{c.setCustomValidity('');c.removeAttribute('aria-invalid');if(c.type!=='checkbox')errBox(c).textContent=''});
  form.querySelector('.summary').textContent='';form.dispatchEvent(new Event('ipc:reset'))}));
}

/* App shell: sidebar toggle, dark mode, signed-in user chip, sign out, icons. */
function initShell(){
 const $=id=>document.getElementById(id),u=IPC.user();
 if($('uname')){$('uname').textContent=u?u.name:'Not signed in';$('urole').textContent=u?u.role:'Guest';if($('uinit'))$('uinit').textContent=u?u.name.split(' ').map(w=>w[0]).slice(0,2).join(''):'?'}
 const side=$('sidebar'),ov=$('overlay'),menu=$('menu');
 const tog=()=>{const o=side.classList.toggle('open');ov.hidden=!o;menu.setAttribute('aria-expanded',o)};
 if(menu){menu.addEventListener('click',tog);ov.addEventListener('click',tog)}
 if($('theme'))$('theme').addEventListener('click',()=>{const d=document.documentElement.classList.toggle('dark');try{localStorage.setItem('ipc_theme',d?'dark':'light')}catch(e){}});
 if($('signout'))$('signout').addEventListener('click',()=>{try{['ipc_user','isLoggedIn','userEmail'].forEach(k=>sessionStorage.removeItem(k))}catch(e){}location.href='login.html'});
 if(window.lucide)lucide.createIcons();
}
document.addEventListener('DOMContentLoaded',initShell);

/* Route guard: not signed in -> login; page not allowed for the role -> that role's landing page. */
(function(){
 const pg=document.body&&document.body.dataset.page;if(!pg)return;
 const u=IPC.user();
 if(!u||!IPC.ACCESS[u.role]){location.replace('login.html');return}
 if(!IPC.ACCESS[u.role].includes(pg)){location.replace(IPC.LANDING[u.role]);return}
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-page]').forEach(a=>{if(a!==document.body&&!IPC.ACCESS[u.role].includes(a.dataset.page))a.hidden=true});
  if((IPC.READONLY[u.role]||[]).includes(pg)){
   document.querySelectorAll('main form').forEach(f=>{[...f.elements].forEach(e=>e.disabled=true);const a=f.querySelector('.actions');if(a)a.hidden=true});
   const h=document.querySelector('main .ph');
   if(h)h.insertAdjacentHTML('afterend','<div class="ok" role="status">Read-only access: your role can view these records but not create or change them.</div>');
  }
 });
})();
