# hAI.FHEMTheme – "hacard"

Ein Home-Assistant-artiges Karten-Theme für **FHEMWEB**, gebaut nach der
offiziellen FHEM-Theme-Konvention (drei Dateien mit gemeinsamem
`stylesheetPrefix`, siehe [FHEMWiki: FHEMWEB](https://wiki.fhem.de/wiki/FHEMWEB)).

Es verändert **kein** FHEM-Markup und benötigt **kein** eigenes FHEM-Modul –
nur CSS/JS, die auf dem nativen `table.room` / `div.col1..col3`-Aufbau von
FHEMWEB aufsetzen (gleiche Technik wie im Community-Theme
[`fhem-flex`](https://github.com/thecodingdad/fhem-flex)).

## Features (v3)

- **Karten-Grid-Layout** statt Tabellenzeilen – Geräte wirken wie Home-Assistant-Kacheln
- **Animierte Sidebar links**: die native FHEMWEB-Raumliste wird per JS in aufklappbare
  Kategorien gruppiert – nach demselben Zahlen-Präfix-Schema, das viele FHEM-Nutzer schon
  zur Sortierung verwenden (`0_`, `00_`, `1_`, `99_`, ...). Auf schmalen Bildschirmen klappt
  die Sidebar per ☰-Button ein/aus. Keine FHEM-Attribute werden dabei verändert – reine
  clientseitige Darstellung.
- **Leucht-Animation** für Lichter/Steckdosen im On-Zustand (pulsierender Glow + hellerer,
  leicht vergrößerter Icon-Filter)
- **Aufblitzen** bei jeder Wertaktualisierung – auch bei reinen Anzeige-Sensoren
  (Temperatur, Feuchte, Batterie, ...)
- **Ping-Ring** bei Bewegungsmeldern, sobald der Reading-Wert auf "motion" wechselt
- **Dauerhaftes rotes Pulsieren** bei kritischen Sensorwerten (Wasser "wet"/"nass", Feuer,
  Alarm, Tamper)
- **Solar/Ertrag-Animation**: Karten mit "Ertrag"/"Solar"/"kWh" im sichtbaren Text (z. B.
  `Steckdose.Solar.II`, MQTT2-Wechselrichter) bekommen ein rotierendes Sonnen-Icon und einen
  über die Karte laufenden Lichtschein. Geschwindigkeit/Helligkeit richten sich nach dem
  aktuell geparsten Watt-Wert (`SOLAR_MAX_WATT` in `hacard.js`, Default 1500 W, bei Bedarf
  anpassen)
- **Reine Anzeige-Sensoren** (kein `webCmd`) werden optisch als "readonly" markiert – Klick
  führt wie gewohnt über den nativen FHEMWEB-Link zur Geräte-Detailseite
- Respektiert `prefers-reduced-motion` – alle Animationen lassen sich vom Betriebssystem
  aus deaktivieren

## Enthaltene Dateien

| Datei | Zweck |
|---|---|
| `www/pgm2/hacardstyle.css` | Haupt-Layout, Sidebar, alle Animationen |
| `www/pgm2/hacard.js` | Zustandserkennung, Sidebar-Aufbau, Solar-Watt-Parsing, Hamburger-Toggle |
| `www/pgm2/hacardsvg_style.css` | Dunkles Styling für SVG-Plots/Diagramme |
| `www/pgm2/hacardsvg_defs.svg` | Farbverlauf-Definitionen für SVG-Plots |
| `controls_hacard.txt` | Kontrolldatei für den FHEM-Update-Manager |

> ⚠️ **Hinweis:** `controls_hacard.txt` enthält aktuell noch die Dateigrößen/Zeitstempel
> der ersten Version (v1) von `hacardstyle.css`/`hacard.js`. Wer über den FHEM-Update-Manager
> installiert, sollte vorher prüfen (lassen), ob die Kontrolldatei aktualisiert wurde –
> sonst erkennt `update check hacard` die neueren Dateien unter Umständen nicht sauber.
> Für manuelle Installation (`docker cp`, siehe unten) spielt das keine Rolle.

## Installation über den FHEM-Update-Manager (empfohlen, sobald controls_hacard.txt aktuell ist)

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

Kein separater Aufruf nötig – das Theme läuft in einer bestehenden FHEMWEB-Instanz,
nicht als eigenständige Anwendung. Ein typisches FHEM-Setup hat mehrere FHEMWEB-Instanzen
auf unterschiedlichen Ports, z. B.:

| Instanz | Typischer Port | Zweck |
|---|---|---|
| `WEB` | 8083 | Desktop/Haupt-Instanz |
| `WEBphone` | 8084 | Smartphone (schmales Layout) |
| `WEBtablet` | 8085 | Tablet/Wandpanel |
| `apiWeb` (falls vorhanden) | 4321 | reiner API-Zugriff (z. B. für MCP-Server), nicht für `hacard` gedacht |

`hacard` sollte auf der Instanz aktiviert werden, die tatsächlich als Dashboard genutzt
wird (oft `WEBtablet`), **nicht** auf einer reinen API-Instanz mit `csrfToken none`.

- **Standard:** einfach die gewohnte FHEMWEB-URL öffnen, z. B. `http://<host>:8085/fhem`
  – sobald `attr <Instanz> stylesheetPrefix hacard` gesetzt ist, zeigt genau diese Instanz
  automatisch das neue Karten-Layout.
- **FTUI bleibt unberührt:** FTUI ist ein komplett eigenes Frontend (eigener
  Container/eigene URL) und wird von `hacard` nicht verändert.
- **Mehrere Instanzen parallel**: falls das klassische FHEMWEB (z. B. für Admin-Aufgaben)
  erhalten bleiben soll, statt eine bestehende Instanz umzustellen, kann eine neue angelegt
  werden:

  ```
  define WEBcards FHEMWEB 8086 global
  attr WEBcards stylesheetPrefix hacard
  attr WEBcards JavaScripts pgm2/hacard.js
  ```

- **Fernzugriff:** Eine dedizierte `hacard`-Instanz kann bei Bedarf zusätzlich per
  Cloudflare Tunnel auf eine eigene Subdomain gelegt werden (getrennt von FTUI/WEB).

## Wichtig: devStateIcon ist weiterhin FHEM-Vorgabe

Dieses Theme stylt nur das Layout. Ob ein Gerät farbig/aktiv aussieht, entscheidet FHEM
selbst über das Attribut `devStateIcon` je Gerät – das kann kein Theme automatisch
überschreiben. Beispiele:

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

## Animationen im Detail (für Anpassungen)

Alle Animationslogik sitzt in `hacard.js` (Erkennung per Text/Klasse) und
`hacardstyle.css` (`@keyframes`). Wichtige Stellschrauben:

| Was | Wo anpassen |
|---|---|
| Wörter für "an" (Glow) | `ON_WORDS` in `hacard.js` |
| Wörter für kritische Werte (rotes Pulsieren) | `ALERT_WORDS` in `hacard.js` |
| Wörter für Bewegungserkennung (Ping) | `MOTION_WORDS` in `hacard.js` |
| Wörter für Solar/Ertrag-Erkennung | `SOLAR_WORDS` in `hacard.js` |
| Referenz-Leistung für volle Solar-Animation | `SOLAR_MAX_WATT` in `hacard.js` (Default 1500 W) |
| Glow-Stärke/Farbe | `@keyframes hacard-glow` in `hacardstyle.css` |
| Aufblitz-Dauer | `@keyframes hacard-flash` in `hacardstyle.css` |

## Bekannte Einschränkungen (v3)

- Getestet gegen die dokumentierten FHEMWEB-Klassen aus `fhem/fhem-mirror`
  (`f18style.css`, `01_FHEMWEB.pm`), nicht gegen die tatsächliche Live-Instanz – kein
  SSH/Portainer-Zugriff in der Entwicklungs-Session konfiguriert. Bitte nach der
  Installation kurz prüfen, ob eine neuere/andere FHEMWEB-Version abweichende Klassennamen
  nutzt.
- Erkennung von An/Aus, Alarm, Bewegung und Solar-Ertrag basiert auf sichtbarem Text
  (Sprache/Wortwahl im `stateFormat`) – abweichende Formulierungen ggf. in den jeweiligen
  Wortlisten in `hacard.js` ergänzen.
- `controls_hacard.txt` ist nicht automatisch synchron mit den tatsächlichen Dateigrößen
  (siehe Hinweis oben) – vor Update-Manager-Nutzung prüfen.
