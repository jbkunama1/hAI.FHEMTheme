/*
 * hacard.js
 * Ergaenzendes Verhalten fuer das FHEMWEB-Theme "hacard".
 *
 * Einbindung in FHEM:
 *   attr WEB JavaScripts pgm2/hacard.js
 *
 * FHEMWEB laedt eigene Skripte NACH dem Rendern der Seite und ruft bei
 * Longpoll-Updates (attr WEB longpoll 1) automatisch document-Events.
 * Wir haengen uns an diese nativen Mechanismen an (kein eigener Server,
 * keine eigene Polling-Logik - das erledigt FHEMWEB bereits selbst).
 *
 * Datei gehoert nach: <fhem>/www/pgm2/hacard.js
 */
(function () {
  "use strict";

  var ON_WORDS = ["on", "an", "open", "offen", "true", "1"];

  function markState(row) {
    var val = row.querySelector(".dval");
    if (!val) return;
    var text = val.textContent.trim().toLowerCase();
    var isOn = ON_WORDS.some(function (w) { return text.indexOf(w) === 0; });
    row.setAttribute("data-state", isOn ? "on" : "off");
  }

  function enhance() {
    document.querySelectorAll("table.room tr.column").forEach(markState);
  }

  // Erstlauf nach DOM-Ready
  if (document.readyState !== "loading") {
    enhance();
  } else {
    document.addEventListener("DOMContentLoaded", enhance);
  }

  // FHEMWEB aktualisiert Readings per Longpoll direkt im DOM (kein Reload).
  // Wir beobachten Aenderungen an .dval per MutationObserver und
  // aktualisieren dann nur die betroffene Karte neu - sehr sparsam.
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      var row = m.target.closest ? m.target.closest("tr.column") : null;
      if (row) markState(row);
    });
  });

  document.querySelectorAll("table.room .dval").forEach(function (el) {
    observer.observe(el, { childList: true, characterData: true, subtree: true });
  });
})();
