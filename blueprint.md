# Blueprint: LexOpen 4.0 - Plattform für Open-Access-Fachliteratur und juristische Kommentare**

## 1. Vision & Kernziele

LexOpen ist eine moderne, webbasierte Alternative zu proprietären juristischen Datenbanken. Ziel ist es, hochwertige juristische Inhalte (Kommentare, Zeitschriften, Gesetze) unter Creative-Commons-Lizenzen bereitzustellen. Dabei wird die strukturelle Tiefe klassischer Werke (Randnummern, Zitierfähigkeit) mit modernen Software-Workflows (Git, Markdown, Serverless) kombiniert.

---

## 2. System-Architektur (Tech-Stack)

### 2.1 Hosting & Frontend

* **Framework:** Next.js (App Router) für Performance und SEO.
* **Hosting:** Vercel (Hobby-Tarif) zur Nutzung von Serverless Functions und Edge-Rendering.
* **Sprache:** TypeScript für Typsicherheit.
* **Styling:** Tailwind CSS für ein schlankes, responsives Design.

### 2.2 Content-Management (Source of Truth)

* **Speicherung:** Private Repositories auf **GitHub (Pro-Account)**. Jedes Werk (z. B. ein DSGVO-Kommentar) ist ein eigenes Repository.
* **Format:** Markdown (Pandoc-Flavor) für Inhalte; YAML für Metadaten.
* **Versionierung:** Editionen und Auflagen werden über Git-Branches abgebildet.
* **Schnittstelle:** Zugriff des Portals auf private Repos via **GitHub Personal Access Token (PAT)**, sicher gespeichert in den Environment Variables auf Vercel.

### 2.3 Datenbank & Personalisierung

* **Technologie:** **Vercel KV (Redis)**.
* **Zweck:** Speicherung von Nutzerpräferenzen, Lesezeichen und Besuchsverlauf.
* **Vorteil:** Extrem niedrige Latenz und kein Wartungsaufwand für klassische SQL-Server.

---

## 3. Funktionale Anforderungen (Requirements)

### 3.1 Authentifizierung (Social-Only)

* **Anmeldung:** Ausschließlich über OAuth-Provider (**GitHub, Google, Apple**).
* **Kein Passwort-Management:** Das System speichert keine Passwörter oder E-Mail-Adressen für den Login-Vorgang.
* **User-Profil:** Automatische Erstellung eines Profil-Eintrags in Vercel KV bei der ersten Anmeldung.

### 3.2 Leseerlebnis & Juristische UX

* **Randnummern (Rn.):** Automatische Generierung von stabilen IDs für jede Randnummer. Jede Rn. ist über einen Anker-Link direkt ansteuerbar (Deep-Linking).
* **Zitier-Bar:** Ein permanent am Bildschirmrand fixiertes Element, das dynamisch das korrekte Zitat der aktuellen Stelle generiert (z. B. *Autor, Werk, Art. X Rn. Y*).
* **Fußnoten-Management:**
  * **Hover-Preview:** Anzeige des Inhalts beim Drüberfahren.
  * **Sticky Drawer:** Ein mitscrollender Bereich am unteren Rand, der die Fußnoten des aktuellen Sichtfelds anzeigt.
* **Journal-Logik:** Simulation von Seitenzahlen für Zeitschriftenartikel, um die Zitierfähigkeit der Druckfassung (PDF) zu gewährleisten.

### 3.3 Personalisierung & Privacy

* **Lesezeichen:** Möglichkeit, einzelne Randnummern oder Artikel dauerhaft zu speichern.
* **Besuchsverlauf („Zuletzt gelesen“):**
  * **Standard:** Speicherung für 30 Tage.
  * **Konfigurierbarkeit:** Nutzer kann die Dauer wählen (7, 30, 90 Tage oder unbegrenzt).
  * **Privacy-Control:** Vollständige Deaktivierung des Verlaufs (Opt-out) sowie manuelles Löschen per Klick möglich.
* **Dashboard:** Zentrale Ansicht der Lesezeichen und des Verlaufs nach dem Login.

### 3.4 Feedback-Loop (Community-Interaktion)

* **Markierungs-Feature:** Nutzer können Textstellen markieren und Feedback (Fehlermeldungen, Ergänzungen) geben.
* **GitHub-Integration:** Das Portal erstellt via GitHub-API automatisch ein **Issue** im privaten Content-Repository des Autors.
* **Issue-Inhalt:** Markierter Text, Fundstelle (URL/Rn.) und Nutzerkommentar.

---

## 4. Datenmodell (Vercel KV)

| Key | Typ | Beschreibung |
| :--- | :--- | :--- |
| `user:settings:[ID]` | JSON | Speichert Privacy-Optionen (History-Dauer, Status). |
| `user:bookmarks:[ID]` | List | Liste von Objekten mit URLs und Titeln. |
| `user:history:[ID]` | List | Liste von besuchten URLs mit Zeitstempel (Pruning-Logik anwenden). |

---

## 5. Nicht-funktionale Anforderungen

### 5.1 Performance

* Die Ladezeit für einen Artikel (Markdown -> HTML) muss unter 200ms liegen (Caching-Strategien nutzen).
* Optimale Darstellung auf Desktop, Tablet und Smartphone (Responsive Design).

### 5.2 Datenschutz & Sicherheit

* **Sicherheits-Token:** Der GitHub PAT darf niemals an den Client übertragen werden. Alle Datei-Abrufe erfolgen über Server-Side-Logik.
* **DSGVO:** Minimale Datenspeicherung. Lösch-Anfragen werden durch das Leeren der KV-Einträge sofort technisch umgesetzt.

### 5.3 Stabilität & Persistenz

* **Stabile URLs:** Einmal vergebene Slugs für Paragraphen dürfen sich nicht ändern, um die Zitierfähigkeit dauerhaft zu erhalten.
* **Zeitreisen:** Unterstützung von Gesetzesfassungen zu verschiedenen Zeitpunkten durch Git-Tags/Branches.

---

## 6. Workflow-Prozesse

1. **Content-Update:** Autor pusht Markdown-Änderung in das private GitHub-Repo -> Vercel triggert Revalidation -> Neue Inhalte sind live.
2. **Feedback-Prozess:** Nutzer sendet Feedback -> API-Route auf Vercel authentifiziert sich bei GitHub -> Issue wird im privaten Repo angelegt -> Autor erhält Benachrichtigung.
3. **History-Pruning:** Bei jedem Login/Seitenaufruf prüft ein Skript die `user:history`, ob Einträge älter als die definierte Dauer (z. B. 30 Tage) sind, und entfernt diese automatisch.

---

## 7. Roadmap (Phasen)

* **Phase 1:** Setup Next.js, NextAuth (Social Login) und Vercel KV-Anbindung.
* **Phase 2:** Entwicklung des Markdown-Parsers mit Rn.-Logik und Fußnoten-Drawer.
* **Phase 3:** Implementierung der Lesezeichen- und Verlaufs-Logik (inkl. Privacy-Settings).
* **Phase 4:** API-Integration für das Feedback-System zu GitHub Issues.
* **Phase 5:** Deployment der Dokument-Konvertierung (PDF-Export via Pandoc für den Druck).
