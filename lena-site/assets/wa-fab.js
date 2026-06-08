/* Botão flutuante "Fale com a Lena" — injetado em todas as páginas.
   Balão proativo na voz da Lena (1ª pessoa), aparece 1x e lembra a dispensa. */
(function(){
  if (document.getElementById('lena-fab')) return;
  var WA = 'https://wa.me/5511939615168?text=' + encodeURIComponent('Oi! Vim do site e queria saber sobre a Lena.');

  var css = ''
  + '#lena-fab{position:fixed;right:24px;bottom:24px;z-index:60;display:inline-flex;align-items:center;gap:12px;background:#fff;border:1px solid rgba(36,27,21,.12);border-radius:999px;padding:8px 20px 8px 8px;box-shadow:0 18px 44px -16px rgba(36,27,21,.4);text-decoration:none;font-family:"Hanken Grotesk",system-ui,sans-serif;transform:translateY(16px);opacity:0;transition:transform .4s cubic-bezier(.2,.7,.3,1.2),opacity .4s;}'
  + '#lena-fab.in{transform:none;opacity:1;}'
  + '#lena-fab .av{position:relative;width:48px;height:48px;flex:none;}'
  + '#lena-fab .av img{width:48px;height:48px;border-radius:50%;object-fit:cover;display:block;}'
  + '#lena-fab .av .wb{position:absolute;right:-2px;bottom:-2px;width:20px;height:20px;border-radius:50%;background:#25D366;border:2px solid #fff;display:flex;align-items:center;justify-content:center;}'
  + '#lena-fab .av .wb svg{width:12px;height:12px;fill:#fff;}'
  + '#lena-fab .tx b{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;font-size:15px;color:#241B15;display:block;line-height:1.1;}'
  + '#lena-fab .tx span{font-size:12px;color:#4E9E78;font-weight:700;display:inline-flex;align-items:center;gap:5px;margin-top:2px;}'
  + '#lena-fab .tx span i{width:7px;height:7px;border-radius:50%;background:#4E9E78;display:inline-block;animation:lenafabpulse 2.2s infinite;}'
  + '@keyframes lenafabpulse{0%{box-shadow:0 0 0 0 rgba(78,158,120,.5)}70%{box-shadow:0 0 0 6px rgba(78,158,120,0)}100%{box-shadow:0 0 0 0 rgba(78,158,120,0)}}'
  + '#lena-nudge{position:fixed;right:24px;bottom:94px;z-index:59;background:#fff;border:1px solid rgba(36,27,21,.12);border-radius:16px 16px 4px 16px;padding:12px 15px;box-shadow:0 18px 40px -18px rgba(36,27,21,.4);max-width:240px;font-size:13.5px;line-height:1.42;color:#241B15;font-family:"Hanken Grotesk",system-ui,sans-serif;transform:translateY(10px) scale(.96);opacity:0;transition:.3s;cursor:pointer;}'
  + '#lena-nudge.in{transform:none;opacity:1;}'
  + '#lena-nudge .x{position:absolute;top:-9px;left:-9px;width:23px;height:23px;border-radius:50%;background:#241B15;color:#fff;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;border:0;}'
  + '@media (max-width:640px){#lena-fab{padding:6px;right:16px;bottom:16px;}#lena-fab .tx{display:none;}#lena-nudge{display:none;}}'
  + '@media (prefers-reduced-motion:reduce){#lena-fab,#lena-nudge{transition:none;}#lena-fab .tx span i{animation:none;}}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var a=document.createElement('a');
  a.id='lena-fab'; a.href=WA; a.target='_blank'; a.rel='noopener';
  a.setAttribute('aria-label','Fale com a Lena no WhatsApp');
  a.innerHTML='<span class="av"><img src="assets/lena-avatar-1024.png" alt="Lena"><span class="wb"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Z"/></svg></span></span><span class="tx"><b>Fale com a Lena</b><span><i></i>online agora</span></span>';
  document.body.appendChild(a);
  setTimeout(function(){ a.classList.add('in'); }, 600);

  try{
    if(!localStorage.getItem('lena_nudge_off')){
      var n=document.createElement('div'); n.id='lena-nudge';
      n.innerHTML='<button class="x" aria-label="Fechar">&times;</button>Oi! 😊 Tem alguma dúvida? É só me chamar aqui, eu respondo na hora.';
      document.body.appendChild(n);
      setTimeout(function(){ n.classList.add('in'); }, 4200);
      n.querySelector('.x').addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); n.classList.remove('in'); try{ localStorage.setItem('lena_nudge_off','1'); }catch(_){ } setTimeout(function(){ n.remove(); }, 300); });
      n.addEventListener('click', function(){ window.open(WA,'_blank','noopener'); });
    }
  }catch(_){ }
})();
