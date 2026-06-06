/* ============================================================================
   Lena — Widget de simulação (JavaScript puro, sem build)
   Como usar no site:
     1) coloque este arquivo em /assets/lena-widget.js
     2) na página onde quer a simulação, adicione:
            <div id="lena-demo"></div>
            <script src="/assets/lena-widget.js" defer></script>
     3) o widget chama POST /api/lena (a Pages Function) na mesma origem
   ============================================================================ */
(function () {
  "use strict";
  var TERRA = "#D9613A", CREME = "#FBF3E7", CREMEL = "#FFFDFA",
    SALVIA = "#4E9E78", CAFE = "#241B15", MUTED = "#8A7866", LINE = "#EFE2CE";

  var SEGMENTS = [
    { id: "clinica", label: "Clínica / estética / odonto",
      services: [{ n: "Limpeza de pele", p: "R$150" }, { n: "Peeling", p: "R$200" }, { n: "Avaliação", p: "sem custo" }],
      promo: "1ª avaliação gratuita" },
    { id: "salao", label: "Salão / barbearia",
      services: [{ n: "Corte feminino", p: "R$80" }, { n: "Coloração", p: "a partir de R$150" }, { n: "Escova", p: "R$50" }],
      promo: "10% no primeiro atendimento" },
    { id: "petshop", label: "Petshop",
      services: [{ n: "Banho", p: "a partir de R$50" }, { n: "Tosa", p: "R$70" }, { n: "Consulta veterinária", p: "R$120" }],
      promo: "Leve 5 banhos, pague 4" },
    { id: "escola", label: "Escola / curso",
      services: [{ n: "Educação infantil", p: "matrícula aberta" }, { n: "Ensino fundamental", p: "matrícula aberta" }, { n: "Período integral", p: "opcional" }],
      promo: "Visita guiada gratuita" },
    { id: "outro", label: "Outro",
      services: [{ n: "", p: "" }, { n: "", p: "" }, { n: "", p: "" }], promo: "" },
  ];
  var HOURS = ["Seg a sex, 9h às 18h", "Seg a sáb, 9h às 19h", "Todos os dias, 8h às 20h"];
  var TONES = ["Acolhedor", "Profissional", "Descontraído"];

  var state = {
    segment: "clinica", hoursMode: "preset", hours: HOURS[1],
    tone: "Acolhedor", messages: [], userTurns: 0, loading: false, cfg: null,
  };

  var AVATAR = '<svg width="SZ" height="SZ" viewBox="0 0 100 100" style="flex:0 0 auto"><circle cx="50" cy="50" r="50" fill="' + TERRA + '"/><path d="M37 28 v32 h26" fill="none" stroke="' + CREME + '" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><circle cx="64" cy="35" r="8" fill="' + SALVIA + '"/></svg>';
  function av(sz) { return AVATAR.replace(/SZ/g, sz); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function seg() { return SEGMENTS.filter(function (s) { return s.id === state.segment; })[0]; }

  function injectCSS() {
    if (document.getElementById("lena-css")) return;
    var st = document.createElement("style");
    st.id = "lena-css";
    st.textContent =
    "@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@300;400;500;600&display=swap');" +
    ":where(#lena-demo,.lena-ov) *{box-sizing:border-box;margin:0;padding:0;font-family:'Hanken Grotesk',sans-serif}" +
    "#lena-demo{max-width:540px;margin:0 auto;color:" + CAFE + "}" +
    /* formulario limpo (fora do frame da marca) */
    ".lena-form{background:#fff;border:1px solid " + LINE + ";border-radius:22px;padding:30px 30px 34px;box-shadow:0 24px 60px -42px rgba(36,27,21,.4)}" +
    ".lena-h{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:21px;color:" + CAFE + ";line-height:1.2}" +
    ".lena-sub{font-size:14px;color:" + MUTED + ";margin-top:5px;line-height:1.5}" +
    ".lena-note{display:flex;gap:10px;align-items:flex-start;background:" + CREME + ";border:1px solid " + LINE + ";border-radius:13px;padding:12px 14px;font-size:12.5px;color:#5b4a3a;line-height:1.45;margin-top:18px}" +
    ".lena-note svg{flex:0 0 auto;margin-top:1px}" +
    ".lena-lbl{display:block;font-size:11.5px;font-weight:700;color:" + CAFE + ";text-transform:uppercase;letter-spacing:.07em;margin:24px 0 10px}" +
    ".lena-lbl span{color:" + MUTED + ";font-weight:500;text-transform:none;letter-spacing:0}" +
    ".lena-field{width:100%;border:1.5px solid " + LINE + ";border-radius:12px;padding:12px 14px;font-size:15px;color:" + CAFE + ";background:#fff;outline:none;transition:border-color .15s}" +
    ".lena-field::placeholder{color:#b8a890}" +
    ".lena-field:focus{border-color:" + TERRA + "}" +
    "textarea.lena-field{resize:none;min-height:58px;line-height:1.45}" +
    ".lena-chips{display:flex;flex-wrap:wrap;gap:8px}" +
    ".lena-chip{border:1.5px solid " + LINE + ";background:#fff;color:#5b4a3a;border-radius:999px;padding:8px 15px;font-size:13.5px;cursor:pointer;transition:all .15s}" +
    ".lena-chip:hover{border-color:" + TERRA + ";color:" + TERRA + "}" +
    ".lena-chip.on{background:" + TERRA + ";border-color:" + TERRA + ";color:#fff;font-weight:600}" +
    ".lena-srow{display:flex;gap:9px;margin-bottom:9px}.lena-srow .n{flex:1.7}.lena-srow .p{flex:1}" +
    ".lena-go{width:100%;margin-top:30px;background:" + TERRA + ";color:#fff;border:none;border-radius:13px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;font-family:'Bricolage Grotesque',sans-serif;transition:transform .12s,background .15s}" +
    ".lena-go:hover{background:#C24E2C;transform:translateY(-1px)}.lena-go:disabled{opacity:.45;cursor:not-allowed;transform:none}" +
    /* popup da conversa = frame da marca */
    ".lena-ov{position:fixed;inset:0;background:rgba(36,27,21,.55);display:flex;align-items:center;justify-content:center;padding:14px;z-index:99999;animation:lenaFade .2s ease}" +
    "@keyframes lenaFade{from{opacity:0}}" +
    ".lena-modal{width:100%;max-width:430px;animation:lenaRise .26s cubic-bezier(.2,.8,.2,1) both}" +
    "@keyframes lenaRise{from{opacity:0;transform:translateY(16px) scale(.98)}}" +
    ".lena-chatcard{background:" + CREMEL + ";border-radius:22px;overflow:hidden;box-shadow:0 30px 70px -30px rgba(36,27,21,.6)}" +
    ".lena-ch{display:flex;align-items:center;gap:11px;padding:14px 16px;background:" + TERRA + "}" +
    ".lena-ch .nm{color:#fff;font-weight:700;font-size:15.5px;font-family:'Bricolage Grotesque',sans-serif}" +
    ".lena-ch .stt{color:#FBD9C8;font-size:11.5px;display:flex;align-items:center;gap:5px;margin-top:1px}" +
    ".lena-on{width:7px;height:7px;border-radius:50%;background:#9FE6BE;display:inline-block}" +
    ".lena-x{margin-left:auto;background:rgba(255,255,255,.18);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:17px;line-height:1}" +
    ".lena-scroll{height:360px;overflow-y:auto;padding:16px;background:" + CREME + ";background-image:radial-gradient(rgba(217,97,58,.06) 1.2px,transparent 1.2px);background-size:18px 18px}" +
    ".lena-row{display:flex;margin-bottom:9px;animation:lenaPop .25s ease both}.lena-row.u{justify-content:flex-end}" +
    "@keyframes lenaPop{from{opacity:0;transform:translateY(6px)}}" +
    ".lena-bub{max-width:80%;padding:10px 13px;font-size:14px;line-height:1.42;border-radius:16px}" +
    ".lena-bub.a{background:#fff;color:" + CAFE + ";border-bottom-left-radius:5px;box-shadow:0 2px 6px -3px rgba(36,27,21,.3)}" +
    ".lena-bub.u{background:" + SALVIA + ";color:#fff;border-bottom-right-radius:5px}" +
    ".lena-typ{display:flex;gap:4px;padding:12px 14px;background:#fff;border-radius:16px;border-bottom-left-radius:5px;width:fit-content;box-shadow:0 2px 6px -3px rgba(36,27,21,.3)}" +
    ".lena-typ span{width:7px;height:7px;border-radius:50%;background:" + MUTED + ";animation:lenaB 1s infinite}" +
    ".lena-typ span:nth-child(2){animation-delay:.15s}.lena-typ span:nth-child(3){animation-delay:.3s}" +
    "@keyframes lenaB{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}" +
    ".lena-qr{display:flex;gap:7px;flex-wrap:wrap;padding:10px 14px 0;background:" + CREMEL + "}" +
    ".lena-qr button{border:1.5px solid " + LINE + ";background:#fff;color:" + TERRA + ";border-radius:999px;padding:7px 12px;font-size:12.5px;cursor:pointer;font-weight:500}" +
    ".lena-qr button:hover{border-color:" + TERRA + "}" +
    ".lena-in{display:flex;gap:9px;padding:11px 14px 14px;background:" + CREMEL + ";align-items:center}" +
    ".lena-in input{flex:1;border:1.5px solid " + LINE + ";border-radius:999px;padding:11px 15px;font-size:14.5px;outline:none;color:" + CAFE + "}" +
    ".lena-in input:focus{border-color:" + TERRA + "}" +
    ".lena-snd{width:44px;height:44px;flex:0 0 auto;border:none;border-radius:50%;background:" + TERRA + ";color:#fff;cursor:pointer;font-size:17px}" +
    ".lena-snd:disabled{opacity:.45;cursor:not-allowed}" +
    ".lena-cta{margin:4px 14px 0;background:linear-gradient(150deg," + TERRA + ",#C24E2C);border-radius:16px;padding:15px 17px}" +
    ".lena-cta p{color:#fff;font-size:13.5px;font-weight:500;line-height:1.4;margin-bottom:10px}" +
    ".lena-cta .btns{display:flex;gap:9px}" +
    ".lena-cta button{flex:1;border-radius:11px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:'Bricolage Grotesque',sans-serif}" +
    ".lena-cta .b1{background:#fff;color:" + TERRA + "}.lena-cta .b2{background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.5)}";
    document.head.appendChild(st);
  }

  function shield() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z" stroke="' + SALVIA + '" stroke-width="2" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="' + SALVIA + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function renderConfig(root) {
    var s = seg();
    var html =
      '<div class="lena-form">' +
      '<div class="lena-h">Conte sobre o seu negócio</div>' +
      '<div class="lena-sub">Preencha rapidinho e converse com a Lena como se você fosse o seu cliente.</div>' +
      '<div class="lena-note">' + shield() + '<span>A Lena responde <b>exclusivamente com os dados que você informar aqui</b>. Quanto mais completo, mais certeira ela fica pro seu cliente, sem inventar nada.</span></div>' +

      '<span class="lena-lbl">Tipo de negócio</span><div class="lena-chips" id="lena-seg">' +
      SEGMENTS.map(function (x) { return '<div class="lena-chip' + (x.id === state.segment ? " on" : "") + '" data-seg="' + x.id + '">' + x.label + '</div>'; }).join("") +
      '</div>' +

      '<span class="lena-lbl">Nome do negócio</span><input class="lena-field" id="lena-name" placeholder="Ex: Clínica Sorriso">' +

      '<span class="lena-lbl">Horário de funcionamento</span><div class="lena-chips" id="lena-hours">' +
      HOURS.map(function (h) { return '<div class="lena-chip' + (state.hoursMode === "preset" && state.hours === h ? " on" : "") + '" data-h="' + esc(h) + '">' + h + '</div>'; }).join("") +
      '<div class="lena-chip' + (state.hoursMode === "custom" ? " on" : "") + '" data-h="__custom">Personalizado</div></div>' +
      '<input class="lena-field" id="lena-hours-custom" style="margin-top:9px;display:' + (state.hoursMode === "custom" ? "block" : "none") + '" placeholder="Ex: Seg a qui 8h-17h, sex até 15h">' +

      '<span class="lena-lbl">Serviços e faixa de preço</span><div id="lena-svcs">' +
      s.services.map(function (sv, i) {
        return '<div class="lena-srow"><input class="lena-field n" id="lena-svc-n-' + i + '" value="' + esc(sv.n) + '" placeholder="Serviço ' + (i + 1) + '"><input class="lena-field p" id="lena-svc-p-' + i + '" value="' + esc(sv.p) + '" placeholder="Valor"></div>';
      }).join("") + '</div>' +

      '<span class="lena-lbl">Item promocional <span>(opcional)</span></span><input class="lena-field" id="lena-promo" value="' + esc(s.promo) + '" placeholder="Ex: 1ª avaliação grátis">' +

      '<span class="lena-lbl">Informações extras <span>(opcional)</span></span><textarea class="lena-field" id="lena-extras" placeholder="Ex: aceitamos convênios, estacionamento próprio, formas de pagamento..."></textarea>' +

      '<span class="lena-lbl">Tom de voz da Lena</span><div class="lena-chips" id="lena-tone">' +
      TONES.map(function (t) { return '<div class="lena-chip' + (t === state.tone ? " on" : "") + '" data-t="' + t + '">' + t + '</div>'; }).join("") +
      '</div>' +

      '<button class="lena-go" id="lena-go" disabled>Conversar com a Lena →</button>' +
      '</div>';
    root.innerHTML = html;
    wireConfig(root);
  }

  function wireConfig(root) {
    var nameEl = root.querySelector("#lena-name");
    var goEl = root.querySelector("#lena-go");
    nameEl.addEventListener("input", function () { goEl.disabled = !nameEl.value.trim(); });

    root.querySelector("#lena-seg").addEventListener("click", function (e) {
      var c = e.target.closest("[data-seg]"); if (!c) return;
      state.segment = c.getAttribute("data-seg");
      var s = seg();
      for (var i = 0; i < 3; i++) {
        root.querySelector("#lena-svc-n-" + i).value = s.services[i].n;
        root.querySelector("#lena-svc-p-" + i).value = s.services[i].p;
      }
      root.querySelector("#lena-promo").value = s.promo;
      [].forEach.call(this.children, function (ch) { ch.classList.toggle("on", ch.getAttribute("data-seg") === state.segment); });
    });

    var hoursBox = root.querySelector("#lena-hours");
    var customEl = root.querySelector("#lena-hours-custom");
    hoursBox.addEventListener("click", function (e) {
      var c = e.target.closest("[data-h]"); if (!c) return;
      var h = c.getAttribute("data-h");
      if (h === "__custom") { state.hoursMode = "custom"; customEl.style.display = "block"; }
      else { state.hoursMode = "preset"; state.hours = h; customEl.style.display = "none"; }
      [].forEach.call(this.children, function (ch) {
        var v = ch.getAttribute("data-h");
        ch.classList.toggle("on", state.hoursMode === "custom" ? v === "__custom" : v === state.hours);
      });
    });

    root.querySelector("#lena-tone").addEventListener("click", function (e) {
      var c = e.target.closest("[data-t]"); if (!c) return;
      state.tone = c.getAttribute("data-t");
      [].forEach.call(this.children, function (ch) { ch.classList.toggle("on", ch.getAttribute("data-t") === state.tone); });
    });

    goEl.addEventListener("click", function () {
      var svcs = [];
      for (var i = 0; i < 3; i++) {
        svcs.push({ n: root.querySelector("#lena-svc-n-" + i).value, p: root.querySelector("#lena-svc-p-" + i).value });
      }
      state.cfg = {
        name: nameEl.value.trim(),
        segment: seg().label,
        hours: state.hoursMode === "custom" ? customEl.value : state.hours,
        services: svcs,
        promo: root.querySelector("#lena-promo").value,
        extras: root.querySelector("#lena-extras").value,
        tone: state.tone,
      };
      openChat();
    });
  }

  function openChat() {
    state.messages = [{ role: "assistant", content: "Oi! Aqui é a Lena, do " + (state.cfg.name || "seu negócio") + " 😊 Como posso te ajudar hoje?" }];
    state.userTurns = 0;
    var qr = state.segment === "escola"
      ? ["Tem vaga?", "Como é a mensalidade?", "Quero agendar uma visita"]
      : ["Quanto custa?", "Quais os horários?", "Quero agendar"];

    var ov = document.createElement("div");
    ov.className = "lena-ov";
    ov.innerHTML =
      '<div class="lena-modal"><div class="lena-chatcard">' +
      '<div class="lena-ch">' + av(38) + '<div><div class="nm">Lena · ' + esc(state.cfg.name) + '</div><div class="stt"><span class="lena-on"></span> respondendo só com os seus dados</div></div><button class="lena-x" id="lena-x">×</button></div>' +
      '<div class="lena-scroll" id="lena-scroll"></div>' +
      '<div class="lena-qr" id="lena-qr">' + qr.map(function (q) { return '<button>' + q + '</button>'; }).join("") + '</div>' +
      '<div class="lena-in"><input id="lena-input" placeholder="Escreva como se fosse seu cliente..."><button class="lena-snd" id="lena-send">➤</button></div>' +
      '</div></div>';
    document.body.appendChild(ov);

    function close() { ov.remove(); }
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector("#lena-x").addEventListener("click", close);
    var inp = ov.querySelector("#lena-input");
    ov.querySelector("#lena-send").addEventListener("click", function () { send(ov, inp.value); inp.value = ""; });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { send(ov, inp.value); inp.value = ""; } });
    ov.querySelector("#lena-qr").addEventListener("click", function (e) { if (e.target.tagName === "BUTTON") send(ov, e.target.textContent); });
    renderChat(ov);
  }

  function renderChat(ov) {
    var sc = ov.querySelector("#lena-scroll");
    var html = state.messages.map(function (m) {
      return '<div class="lena-row ' + (m.role === "user" ? "u" : "") + '"><div class="lena-bub ' + (m.role === "user" ? "u" : "a") + '">' + esc(m.content) + '</div></div>';
    }).join("");
    if (state.loading) html += '<div class="lena-row"><div class="lena-typ"><span></span><span></span><span></span></div></div>';
    if (state.userTurns >= 5 && !state.loading) {
      html += '<div class="lena-cta"><p>É assim que a Lena atenderia os seus clientes, 24 horas por dia, só com os seus dados. Quer colocar ela pra trabalhar no seu negócio?</p><div class="btns">' +
        '<button class="b1" onclick="window.open(\'https://lena.ia.br/precos\',\'_blank\')">Ver planos</button>' +
        '<button class="b2" onclick="window.open(\'https://lena.ia.br/interesse\',\'_blank\')">Falar com a equipe</button></div></div>';
    }
    sc.innerHTML = html;
    sc.scrollTop = sc.scrollHeight;
  }

  function send(ov, text) {
    text = (text || "").trim();
    if (!text || state.loading) return;
    state.messages.push({ role: "user", content: text });
    state.userTurns++;
    state.loading = true;
    renderChat(ov);
    fetch("/api/lena", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ config: state.cfg, messages: state.messages }),
    }).then(function (r) { return r.json(); }).then(function (d) {
      state.messages.push({ role: "assistant", content: d.reply || "Desculpa, pode repetir?" });
    }).catch(function () {
      state.messages.push({ role: "assistant", content: "Ops, tive um probleminha de conexão. Pode tentar de novo?" });
    }).then(function () { state.loading = false; renderChat(ov); });
  }

  function boot() {
    var root = document.getElementById("lena-demo");
    if (!root) return;
    injectCSS();
    renderConfig(root);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
