/*
 * hacard.js
 * Ergaenzendes Verhalten fuer das FHEMWEB-Theme "hacard".
 *
 * Einbindung in FHEM:
 *   attr WEB JavaScripts pgm2/hacard.js
 *
 * Zwei Aufgaben, beide rein clientseitig (keine FHEM-Config wird
 * veraendert, kein eigener Server, kein eigenes Polling):
 *
 * 1) On/Off-Erkennung fuer die Karten-Hervorhebung (liest .dval-Text,
 *    setzt data-state="on|off" am tr.column). Reagiert per
 *    MutationObserver auf FHEMWEB-Longpoll-Updates.
 *
 * 2) Raum-Sidebar: FHEMWEB liefert die Raumliste bereits nativ in
 *    <div id="menu"><table>...<a href="?room=...">...</a>...</table></div>.
 *    Wir gruppieren diese Links hier nur visuell in aufklappbare
 *    <details>-Abschnitte - nach genau dem Praefix-Schema, das Daniel
 *    in FHEM selbst schon zur Sortierung nutzt (z. B. "0_ZigBee",
 *    "00_System", "1_DOIFs", "99_Telegram", "999_ROBO"). Kein Gerät,
 *    kein Attribut wird dafuer angefasst - reine Darstellung.
 *
 * Datei gehoert nach: <fhem>/www/pgm2/hacard.js
 */
(function () {
  "use strict";

  /* ---------- Teil 1: On/Off-Status fuer Karten ---------- */
  var ON_WORDS = ["on", "an", "open", "offen", "true", "1"];

  function markState(row) {
    var val = row.querySelector(".dval");
    if (!val) return;
    var text = val.textContent.trim().toLowerCase();
    var isOn = ON_WORDS.some(function (w) { return text.indexOf(w) === 0; });
    row.setAttribute("data-state", isOn ? "on" : "off");
  }

  function enhanceCards() {
    document.querySelectorAll("table.room tr.column").forEach(markState);
  }

  var cardObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      var row = m.target.closest ? m.target.closest("tr.column") : null;
      if (row) markState(row);
    });
  });

  function watchCards() {
    document.querySelectorAll("table.room .dval").forEach(function (el) {
      cardObserver.observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ---------- Teil 2: Raum-Sidebar gruppieren + Hamburger ---------- */
  function prefixOf(label) {
    var m = label.match(/^(\d+)_/);
    return m ? m[1] : "\u2022"; // Rooms ohne Zahlen-Praefix landen in "Sonstige"
  }

  function buildSidebar() {
    var menu = document.getElementById("menu");
    if (!menu || menu.dataset.hacardDone) return;

    // Alle Raum-Links einsammeln (native FHEMWEB-Links auf ?room=...)
    var links = Array.prototype.slice.call(
      menu.querySelectorAll('a[href*="room="], a[href*="detail="]')
    ).filter(function (a) {
      return a.getAttribute("href") && a.getAttribute("href").indexOf("room=") !== -1;
    });
    if (!links.length) return;

    var groups = {}; // prefix -> [linkEl,...]
    var order = [];
    links.forEach(function (a) {
      var label = a.textContent.trim();
      var p = prefixOf(label);
      if (!groups[p]) { groups[p] = []; order.push(p); }
      groups[p].push(a);
    });

    // Numerische Praefixe zuerst (in ihrer eigenen Groessenordnung), Rest zuletzt
    order.sort(function (a, b) {
      if (a === "\u2022") return 1;
      if (b === "\u2022") return -1;
      return a.length - b.length || a.localeCompare(b);
    });

    var frag = document.createDocumentFragment();
    order.forEach(function (p, idx) {
      var details = document.createElement("details");
      if (idx === 0) details.open = true; // erste Gruppe standardmaessig offen
      var summary = document.createElement("summary");
      summary.textContent = p === "\u2022" ? "Sonstige" : "Kategorie " + p;
      details.appendChild(summary);
      var list = document.createElement("div");
      groups[p].forEach(function (a) { list.appendChild(a); });
      details.appendChild(list);
      frag.appendChild(details);
    });

    // Ursprüngliche Menü-Tabelle leeren, gruppierte Struktur einsetzen
    var table = menu.querySelector("table");
    if (table) table.remove();
    menu.appendChild(frag);
    menu.dataset.hacardDone = "1";
  }

  function buildMenuToggle() {
    if (document.getElementById("hacardMenuToggle")) return;
    var hdr = document.getElementById("hdr");
    var menu = document.getElementById("menu");
    if (!hdr || !menu) return;
    var btn = document.createElement("button");
    btn.id = "hacardMenuToggle";
    btn.type = "button";
    btn.textContent = "\u2630";
    btn.setAttribute("aria-label", "Raumenü ein-/ausblenden");
    btn.addEventListener("click", function () {
      menu.classList.toggle("hacard-open");
    });
    hdr.insertBefore(btn, hdr.firstChild);

    // Nach Klick auf einen Raum-Link (Navigation) Sidebar auf Mobile wieder schliessen
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.innerWidth <= 900) {
        menu.classList.remove("hacard-open");
      }
    });
  }

  function init() {
    enhanceCards();
    watchCards();
    buildSidebar();
    buildMenuToggle();
  }

  if (document.readyState !== "loading") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
