/*
 * hacard.js
 * Ergaenzendes Verhalten fuer das FHEMWEB-Theme "hacard".
 *
 * Einbindung in FHEM:
 *   attr WEB JavaScripts pgm2/hacard.js
 *
 * Aufgaben, alle rein clientseitig (keine FHEM-Config wird veraendert,
 * kein eigener Server, kein eigenes Polling - FHEMWEB liefert Updates
 * bereits selbst per Longpoll, wir reagieren nur per MutationObserver):
 *
 * 1) On/Off-Erkennung + Leuchten fuer Lichter/Steckdosen (Raumansicht).
 * 2) Kurzes Aufblitzen (.hacard-flash) bei jeder Wertaenderung.
 * 3) Bewegungsmelder-Ping (.hacard-ping) beim Wechsel auf "motion".
 * 4) Dauerhaftes rotes Pulsieren (data-alert="1") bei kritischen Werten.
 * 5) Solar/Ertrag-Animation (.hacard-solar + CSS-Variable --yield).
 * 6) Animierte Raum-Sidebar mit Kategorien-Akkordeon + Hamburger-Toggle.
 * 7) Geraete-Detailseite (?detail=<name>): Readings-Zeilen im Abschnitt
 *    "Readings" (div.makeTable.readings, siehe FW_makeTable in
 *    01_FHEMWEB.pm) blitzen bei Wertaenderung ebenfalls kurz auf - gleiches
 *    Prinzip wie in der Raumansicht, nur auf Tabellenzeilen-Ebene.
 *
 * Datei gehoert nach: <fhem>/www/pgm2/hacard.js
 */
(function () {
  "use strict";

  var ON_WORDS = ["on", "an", "open", "offen", "true", "1"];
  var ALERT_WORDS = ["wet", "nass", "alarm", "fire", "feuer", "tamper", "leak"];
  var MOTION_WORDS = ["motion", "bewegung"];
  var SOLAR_WORDS = ["ertrag", "solar", "kwh", "pv"];
  var SOLAR_MAX_WATT = 1500; // Referenzwert fuer volle Animationsintensitaet; bei Bedarf anpassen

  var lastValues = new WeakMap(); // Element -> letzter Text (fuer Change-Erkennung)

  function flash(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // Reflow erzwingen, damit die Animation neu startet
    el.classList.add(cls);
    el.addEventListener("animationend", function handler() {
      el.classList.remove(cls);
      el.removeEventListener("animationend", handler);
    });
  }

  /* ---------- Raumansicht: Karten ---------- */
  function markReadonly(row) {
    var hasButtons = row.querySelector(".col2 a, .col3 a");
    row.classList.toggle("hacard-readonly", !hasButtons);
  }

  function applySolar(row, fullText) {
    var isSolar = SOLAR_WORDS.some(function (w) { return fullText.indexOf(w) !== -1; });
    if (!isSolar) {
      row.classList.remove("hacard-solar");
      return;
    }
    row.classList.add("hacard-solar");
    var m = fullText.match(/(-?\d+(?:[.,]\d+)?)\s*w\b/i);
    var watt = m ? parseFloat(m[1].replace(",", ".")) : 0;
    var ratio = Math.max(0, Math.min(1, watt / SOLAR_MAX_WATT));
    row.style.setProperty("--yield", ratio.toFixed(2));
  }

  function updateCardRow(row, isFirstRun) {
    var val = row.querySelector(".dval");
    var fullText = row.textContent.trim().toLowerCase();
    if (!val) {
      applySolar(row, fullText);
      return;
    }
    var text = val.textContent.trim().toLowerCase();

    var isOn = ON_WORDS.some(function (w) { return text.indexOf(w) === 0; });
    row.setAttribute("data-state", isOn ? "on" : "off");

    var isAlert = ALERT_WORDS.some(function (w) { return text.indexOf(w) !== -1; });
    if (isAlert) row.setAttribute("data-alert", "1");
    else row.removeAttribute("data-alert");

    applySolar(row, fullText);
    markReadonly(row);

    var prev = lastValues.get(row);
    if (!isFirstRun && prev !== undefined && prev !== text) {
      var isMotion = MOTION_WORDS.some(function (w) { return text.indexOf(w) !== -1; });
      flash(row, isMotion ? "hacard-ping" : "hacard-flash");
    }
    lastValues.set(row, text);
  }

  function enhanceCards() {
    document.querySelectorAll("table.room tr.column").forEach(function (row) {
      updateCardRow(row, true);
    });
  }

  var cardObserver = new MutationObserver(function (mutations) {
    var seen = new Set();
    mutations.forEach(function (m) {
      var row = m.target.closest ? m.target.closest("tr.column") : null;
      if (row && !seen.has(row)) {
        seen.add(row);
        updateCardRow(row, false);
      }
    });
  });

  function watchCards() {
    document.querySelectorAll("table.room tr.column").forEach(function (row) {
      cardObserver.observe(row, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ---------- Detailseite: Readings-Zeilen ---------- */
  function updateReadingRow(row, isFirstRun) {
    var text = row.textContent.trim().toLowerCase();
    var prev = lastValues.get(row);
    if (!isFirstRun && prev !== undefined && prev !== text) {
      flash(row, "hacard-rowflash");
    }
    lastValues.set(row, text);
  }

  function enhanceReadingsTable() {
    var section = document.querySelector("div.makeTable.readings table.block.wide");
    if (!section) return;
    Array.prototype.slice.call(section.querySelectorAll("tr")).forEach(function (row) {
      updateReadingRow(row, true);
    });
    return section;
  }

  function watchReadingsTable(section) {
    if (!section) return;
    var obs = new MutationObserver(function (mutations) {
      var seen = new Set();
      mutations.forEach(function (m) {
        var row = m.target.closest ? m.target.closest("tr") : null;
        if (row && section.contains(row) && !seen.has(row)) {
          seen.add(row);
          updateReadingRow(row, false);
        }
      });
    });
    obs.observe(section, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- Animierte Raum-Sidebar ---------- */
  function prefixOf(label) {
    var m = label.match(/^(\d+)_/);
    return m ? m[1] : "\u2022";
  }

  function buildSidebar() {
    var menu = document.getElementById("menu");
    if (!menu || menu.dataset.hacardDone) return;

    var links = Array.prototype.slice.call(menu.querySelectorAll('a[href*="room="]'));
    if (!links.length) return;

    var groups = {};
    var order = [];
    links.forEach(function (a) {
      var label = a.textContent.trim();
      var p = prefixOf(label);
      if (!groups[p]) { groups[p] = []; order.push(p); }
      groups[p].push(a);
    });

    order.sort(function (a, b) {
      if (a === "\u2022") return 1;
      if (b === "\u2022") return -1;
      return a.length - b.length || a.localeCompare(b);
    });

    var frag = document.createDocumentFragment();
    order.forEach(function (p, idx) {
      var group = document.createElement("div");
      group.className = "menu-group" + (idx === 0 ? " open" : "");

      var summary = document.createElement("div");
      summary.className = "menu-summary";
      summary.textContent = p === "\u2022" ? "Sonstige" : "Kategorie " + p;
      summary.addEventListener("click", function () {
        group.classList.toggle("open");
      });

      var body = document.createElement("div");
      body.className = "menu-body";
      groups[p].forEach(function (a) { body.appendChild(a); });

      group.appendChild(summary);
      group.appendChild(body);
      frag.appendChild(group);
    });

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

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.innerWidth <= 900) {
        menu.classList.remove("hacard-open");
      }
    });
  }

  function init() {
    enhanceCards();
    watchCards();
    var readingsSection = enhanceReadingsTable();
    watchReadingsTable(readingsSection);
    buildSidebar();
    buildMenuToggle();
  }

  if (document.readyState !== "loading") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
