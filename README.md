# hAI.FHEMTheme – "hacard"

Ein Home-Assistant-artiges Karten-Theme für **FHEMWEB**, gebaut nach der
offiziellen FHEM-Theme-Konvention (drei Dateien mit gemeinsamem
`stylesheetPrefix`, siehe [FHEMWiki: FHEMWEB](https://wiki.fhem.de/wiki/FHEMWEB)).

Es verändert **kein** FHEM-Markup und benötigt **kein** eigenes FHEM-Modul –
nur CSS/JS, die auf dem nativen `table.room` / `div.col1..col3`-Aufbau von
FHEMWEB aufsetzen (gleiche Technik wie im Community-Theme
[`fhem-flex`](https://github.com/thecodingdad/fhem-flex)).

## Enthaltene Dateien

| Datei | Zweck |
|---|---|
| `www/pgm2/hacardstyle.css` | Haupt-Layout: Räume als Karten-Grid statt Tabelle |
| `www/pgm2/hacard.js` | Erkennt An/Aus-Zustand für Karten-Hervorhebung, reagiert auf FHEMWEB-Longpoll-Updates |
| `www/pgm2/hacardsvg_style.css` | Dunkles Styling für SVG-Plots/Diagramme |
| `www/pgm2/hacardsvg_defs.svg` | Farbverlauf-Definitionen für SVG-Plots |
| `controls_hacard.txt` | Kontrolldatei für den FHEM-Update-Manager |

## Installation über den FHEM-Update-Manager (empfohlen)

In der FHEM-Kommandozeile (Weboberfläche oder telnet):

```
update add https://raw.githubusercontent.com/jbkunama1/hAI.FHEMTheme/main/controls_hacard.txt
update check hacard
update install hacard
```

Danach Theme aktivieren:

```
attr WEB stylesheetPrefix hacard
attr WEB JavaScripts pgm2/hacard.js
```

Browser-Cache leeren (Strg+F5). Für spätere Aktualisierungen reicht künftig:

```
update all hacard
```

## Installation manuell (Docker ohne Update-Manager)

Falls dein FHEM-Container keinen Internetzugriff auf GitHub hat oder du es
erst offline testen willst:

```bash
docker cp hacardstyle.css        <container>:/opt/fhem/www/pgm2/
docker cp hacard.js              <container>:/opt/fhem/www/pgm2/
docker cp hacardsvg_style.css    <container>:/opt/fhem/www/pgm2/
docker cp hacardsvg_defs.svg     <container>:/opt/fhem/www/pgm2/
```

Danach wie oben die beiden `attr`-Befehle setzen.

## Zugriff / Aufruf

Kein separater Aufruf nötig – das Theme läuft in der bestehenden
FHEMWEB-Instanz, nicht als eigenständige Anwendung.

- **Standard:** einfach die gewohnte FHEMWEB-URL öffnen, z. B.
  `http://192.168.178.15:8085/fhem` – sobald `attr WEB stylesheetPrefix
  hacard` gesetzt ist, zeigt genau diese Instanz automatisch das neue
  Karten-Layout. Kein neuer Port, kein zusätzlicher Container.
- **FTUI bleibt unberührt:** FTUI ist ein komplett eigenes Frontend
  (eigener Container/eigene URL) und wird von `hacard` nicht verändert.
  Beide Oberflächen laufen unabhängig nebeneinander.
- **Optional: eigene Instanz nur fürs Theme**, falls das klassische
  FHEMWEB (z. B. für Admin-Aufgaben) parallel erhalten bleiben soll,
  statt `WEB` direkt umzustellen:

  ```
  define WEBcards FHEMWEB 8086 global
  attr WEBcards stylesheetPrefix hacard
  attr WEBcards JavaScripts pgm2/hacard.js
  ```

  Danach erreichbar unter `http://192.168.178.15:8086/fhem`, während
  `http://192.168.178.15:8085/fhem` unverändert bleibt.
- **Fernzugriff:** Diese zweite Instanz kann bei Bedarf zusätzlich per
  Cloudflare Tunnel auf eine eigene Subdomain gelegt werden (getrennt
  von der bestehenden FTUI-/WEB-Tunnel-Route).

## Wichtig: devStateIcon ist weiterhin FHEM-Vorgabe

Dieses Theme stylt nur das Layout. Ob ein Gerät farbig/aktiv aussieht,
entscheidet FHEM selbst über das Attribut `devStateIcon` je Gerät – das
kann kein Theme automatisch überschreiben. Beispiele passend zu deinem
Zigbee-Setup (ConBee II, Steckdosen, Thermostate, Taster):

```
# Steckdose (Plug/Switch)
attr Steckdose.LichtAnyS devStateIcon on:on@ffb648 off:off@8a929c

# Thermostat
attr Thermostat.IV.Paula devStateIcon .*:general_an@ffb648

# Fenster/Kontakt
attr Fenster.EGEZ.Carport devStateIcon open:fts_window_1w_open@e06060 closed:fts_window_1w_closed@7be27b

# Taster/Button (nur Klick-Ereignis, kein Dauerzustand)
attr MiButton.I devStateIcon .*:control_home
```

Für viele Geräte auf einmal lohnt sich `attr .* devStateIcon ...` über eine
FHEM-`filter`-Anweisung oder ein kleines DOIF/Notify, das die Attribute
einmalig für alle Geräte eines Typs setzt – dazu gerne im nächsten Schritt
mehr, sobald das Theme läuft.

## Bekannte Einschränkungen (v1)

- Getestet gegen die dokumentierten FHEMWEB-Klassen aus `fhem/fhem-mirror`
  (`f18style.css`, `01_FHEMWEB.pm`), nicht gegen deine tatsächliche
  Live-Instanz – kein SSH/Portainer-Zugriff in dieser Session konfiguriert.
  Bitte nach der Installation kurz prüfen, ob dein FHEM eine neuere/andere
  FHEMWEB-Version mit abweichenden Klassennamen nutzt.
- `hacard.js` erkennt "an"-Zustände über den sichtbaren Text in `.dval`
  (z. B. "on", "an", "open", "offen"). Abweichende Sprachwerte (z. B. "1"
  vs. "on") ggf. in `ON_WORDS` ergänzen.
