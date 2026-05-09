# 🛒 **MVP Webshop – ASTA**

**Ein Proof-of-Concept (PoC) Webshop-Projekt**, entwickelt von einem Team aus drei Studierenden der Informatik. Ziel des Projekts ist die Validierung einer skalierbaren Architektur für einen Webshop. Später soll das Projekt technisch vertieft und um weitere Features ergänzt werden.

---

## 🚀 **Projektstatus**

- **Startdatum:** 24. April 2026
- **Aktuelle Phase:** Aufbau der Kernfunktionalitäten (Frontend, Backend, Datenbank)
- **Architektur:** Microservice-basiert mit Docker-Compose
- **CI/CD-Pipeline:** Vollautomatisiert (Build, Test, Security-Scan, Deployment)

---

## 📌 **Features**

### **Frontend (Vite/React)**

- Austauschbare Shop-Ansicht (aktuell "gevibe-coded")
- Responsive Design für Desktop und Mobile
- Dynamische Produktdarstellung

### **Backend (Spring Boot)**

- RESTful APIs für:
  - Produktmanagement (`/api/products`)
  - Gesundheitscheck (`/actuator/health`)
- Sicherheitsfeatures:
  - Bearer-Token-Authentifizierung (geplant)
  - Proxy-Pattern für Datenbankzugriff (geplant)

### **Datenbank (PostgreSQL)**

- Tabellen für:
  - Produktdaten (`products`)
  - Kundendaten (`customers`)
- **Versionierung:** Flyway-Migrationen (integriert in CI/CD-Pipeline)

### **CI/CD-Pipeline (GitHub Actions)**

1. **Build & Test:**
  - Automatisches Bauen des Codes bei jedem Commit
  - Ausführung von Unit-Tests
2. **Security-Scan:**
  - Statische Code-Analyse (z. B. SonarQube oder Snyk)
  - Abhängigkeitschecks (OWASP Dependency-Check)
3. **Deployment:**
  - Docker-Image-Build für:
    - Frontend-Container
    - Backend-Container
    - Datenbank-Container
  - Push der Images in eine Container-Registry (z. B. Docker Hub, GitHub Container Registry)
  - Orchestrierung via **Docker Compose**

---

## 🛠 **Tech Stack**


| Komponente    | Technologie             | Version | Verantwortlich        |
| ------------- | ----------------------- | ------- | --------------------- |
| **Frontend**  | Vite + React            | Latest  | Systemintegratoren    |
| **Backend**   | Spring Boot             | 3.x     | Systemintegratoren    |
| **Datenbank** | PostgreSQL              | 17.x    | Entwickler            |
| **CI/CD**     | GitHub Actions          | –       | Entwickler            |
| **Container** | Docker + Docker Compose | Latest  | Team                  |
| **Analytics** | Python (geplant)        | –       | Entwickler            |


---

## 🏗 **Architektur**

```
┌───────────────────────────────────────────────────────┐
│                     Docker Compose                      │
│                                                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Frontend   │◄───►│  Backend    │◄───►│ PostgreSQL  │  │
│  │ (Vite/React)│    │ (Spring Boot)│    │             │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                           │
└───────────────────────────────────────────────────────┘
```

- **Kommunikation:** Frontend ↔ Backend via REST-API
- **Datenbank:** Backend greift direkt auf PostgreSQL zu (Proxy-Pattern geplant)
- **Deployment:** Alle Container laufen in einem Docker-Netzwerk

---

## 👥 **Team & Rollen**


| Name                | Ausbildung            | Fokus                      |
| ------------------- | ---------------- | -------------------------- |
| Luc  | Anwendungsentwickler       | CI/CD-Pipeline, Analytics, Aushilfe Spring boot  |
| Emilio | Systemintegrator | Spring Boot, Backend-Logik |
| Max  | Systemintegrator | Spring Boot, Backend-Logik |
| Johan  | Daten und Prozessanlyse | Frontend mit Vite |


**Ziele:**

- **Systemintegratoren:** Erste Coding-Erfahrungen mit Spring Boot sammeln
- **Luc Liss:** Vertiefung in CI/CD-Pipelines und Datenanalyse mit Python

---

## 📂 **Projektstruktur**

```bash
mvp-webshop-asta/
├── frontend/          # Vite/React-App
│   ├── src/
│   └── Dockerfile
├── backend/           # Spring Boot
│   ├── src/
│   └── Dockerfile
├── db/                # PostgreSQL-Skripte + Flyway-Migrationen
├── docker-compose.yml # Orchestrierung
├── .github/
│   └── workflows/     # CI/CD-Pipelines (GitHub Actions)
└── README.md          # Diese Datei
```

---

## 🔧 **Lokale Entwicklung**

### **Voraussetzungen**

- Docker & Docker Compose ([Installation](https://docs.docker.com/get-docker/))
- Node.js (für Frontend-Entwicklung)
- Java 21 (für Backend-Entwicklung)
- PostgreSQL 17 (optional, falls lokal getestet werden soll)

### **Projekt starten**

1. Repository klonen:
  ```bash
   git clone <repository-url>
   cd mvp-webshop-asta
  ```
2. Docker-Container starten:
  ```bash
   docker-compose up --build
  ```
  - Frontend: [http://localhost:5173](http://localhost:5173)
  - Backend: [http://localhost:8080](http://localhost:8080)
  - Datenbank: `localhost:5432` (Zugangsdaten in `docker-compose.yml`)
3. **Hinweis:** Die CI/CD-Pipeline wird automatisch bei jedem Push auf `main` ausgeführt.

---

## 📝 **Roadmap & Ideen**

- **Bearer-Token-Management** für Authentifizierung
- **Proxy-Pattern** für Datenbankzugriffe (Sicherheit & Skalierbarkeit)
- **Flyway-Migrationen** für Datenbankversionierung
- **Analytics-Dashboard** (Python + Jupyter/Streamlit)
- **Erweiterte Tests:** Integrationstests, E2E-Tests
- **Monitoring:** Prometheus + Grafana für Performance-Metriken

---

## 🤝 **Beitragen**

1. Issue erstellen oder Existing Issue kommentieren
2. Feature-Branch von `main` erstellen (`git checkout -b feature/xy`)
3. Änderungen committen (`git commit -m "feat: xy hinzugefügt"`)
4. Push auf Branch (`git push origin feature/xy`)
5. Pull Request erstellen

**Code-Review:** Mindestens ein Teammitglied muss den PR approven, bevor er gemerged wird.

---

## 📄 **Lizenz**

Dieses Projekt ist **nicht lizenziert** und dient ausschließlich Bildungszwecken.

---

**💡 Frage oder Verbesserungsvorschlag?**  
Öffne ein [Issue](&nbsp;/issues) oder kontaktiere uns direkt!

</canvaentity

> ---

