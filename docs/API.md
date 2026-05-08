# API-Dokumentation fuer Frontend-Agenten

Diese Datei beschreibt den aktuellen API-Vertrag des Spring-Boot-Backends in
`apps/mvp`. Sie ist als Arbeitsgrundlage fuer einen weiteren Agenten gedacht,
der ein komplettes Frontend an diese API anbinden soll.

Die Doku beschreibt bewusst den Ist-Zustand des Codes. Stellen, an denen das
Backend noch nicht den idealen REST-Konventionen folgt, sind als Hinweise fuer
defensive Frontend-Implementierung markiert.

## Ueberblick

- Backend-Modul: `apps/mvp`
- Framework: Spring Boot
- Standard-Port: `8081`
- Globaler Context Path: `/api`
- Lokale Base URL: `http://localhost:8081/api`
- Datenformat: JSON
- Authentifizierung: aktuell keine erforderlich
- CSRF: aktuell deaktiviert
- CORS: keine explizite CORS-Konfiguration im Backend gefunden

Alle Pfade in dieser Doku enthalten den globalen Context Path `/api`.

## Frontend-Integration

Empfohlene Base-URL-Konstante fuer direkte Backend-Clients:

```ts
export const API_BASE_URL = 'http://localhost:8081/api'
```

Bei direktem Browser-Zugriff von Vite, zum Beispiel `http://localhost:5173`,
kann CORS relevant werden, weil das Backend keine explizite CORS-Konfiguration
enthaelt. Fuer lokale Entwicklung ist ein Vite-Proxy ein sinnvoller Default:

```ts
// apps/frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
    },
  },
})
```

Dann kann das Frontend relative Requests wie `fetch('/api/product/getProducts')`
verwenden.

Wichtig: Mit Vite-Proxy sieht der Request in den Browser-DevTools weiterhin wie
`http://localhost:5173/api/...` aus. Das ist korrekt: Der Browser spricht den
Vite-Dev-Server an, und Vite leitet serverseitig an
`http://127.0.0.1:8081/api/...` weiter. Ohne Proxy wuerde der Request auf Port
5173 landen und als API-Call fehlschlagen.

Der aktuelle Frontend-Client nutzt deshalb standardmaessig:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
```

`VITE_API_BASE_URL=http://localhost:8081/api` sollte nur gesetzt werden, wenn das
Backend CORS fuer den Frontend-Origin erlaubt. Aktuell ist im Backend keine
explizite CORS-Konfiguration vorhanden.

### Allgemeine Request-Regeln

- `Content-Type: application/json` fuer Requests mit Body setzen.
- UUIDs werden als Strings uebertragen.
- `price` ist ein Integer in Cent, nicht Euro als Float.
- Es gibt aktuell keine dokumentierte Pagination, Suche oder Sortierung.
- Es gibt keine Bean-Validation-Anmerkungen; das Frontend sollte Pflichtfelder
  selbst pruefen.
- Fehlerantworten sind nicht zentral standardisiert. Bei Backend-Fehlern ist mit
  Spring-Default-Fehlerobjekten oder leeren Fehlerantworten zu rechnen.

## Objektmodelle

### ProductDTO

Wird fuer Produktlisten, Produktdetails und Admin-Update-Requests verwendet.

```ts
type ProductDTO = {
  publicId: string | null
  name: string
  description: string
  imagePath: string
  price: number
  amountInStock: number
  tag: string
  status: 'ACTIVE' | 'INACTIVE' | null
}
```

Felder:

| Feld | Typ | Bedeutung |
| --- | --- | --- |
| `publicId` | `string | null` | Oeffentliche Produkt-ID als UUID. Bei neuen Produkten kann das Frontend `null` oder das Feld weglassen; das Backend generiert intern eine neue UUID. |
| `name` | `string` | Produktname. |
| `description` | `string` | Produktbeschreibung. |
| `imagePath` | `string` | Bildpfad oder Bild-URL, wie im Backend gespeichert. |
| `price` | `number` | Preis in Cent. Beispiel: `1299` bedeutet 12,99 EUR. |
| `amountInStock` | `number` | Lagerbestand. |
| `tag` | `string` | Freier Produkt-Tag oder Kategorie-String. |
| `status` | `'ACTIVE' | 'INACTIVE' | null` | Produktstatus. Wird in der DB ordinal als Integer gespeichert und vom Backend als Enum-String an das Frontend gegeben. |

Beispiel:

```json
{
  "publicId": "9d0e27fb-5c41-4b1d-a0a9-871f25e6f655",
  "name": "AStA Hoodie",
  "description": "Schwarzer Hoodie mit Logo",
  "imagePath": "/images/products/hoodie.png",
  "price": 3499,
  "amountInStock": 12,
  "tag": "clothing",
  "status": "ACTIVE"
}
```

### ProductEntity

Wird aktuell von `POST /api/admin/addProduct` zurueckgegeben. Das ist eine
Datenbank-Entity und enthaelt zusaetzlich die interne `productId`.

```ts
type ProductEntity = {
  productId: number
  publicId: string
  name: string
  description: string
  imagePath: string
  price: number
  amountInStock: number
  tag: string
  status: 'ACTIVE' | 'INACTIVE' | null
}
```

Hinweis: `productId` ist eine interne Datenbank-ID. Fuer Frontend-Routing,
Updates und Deletes sollte `publicId` verwendet werden.

### SessionDTO

Wird fuer Analytics-Session-Tracking an das Backend gesendet.

```ts
type SessionDTO = {
  analyticsId: string
  loginTimestamp: string
}
```

Felder:

| Feld | Typ | Bedeutung |
| --- | --- | --- |
| `analyticsId` | `string` | Client-seitig erzeugte UUID aus `localStorage`. Sie dient aktuell als Session-ID-Ersatz, um ein komplexes Cookie-Setup zu umgehen. |
| `loginTimestamp` | `string` | Zeitpunkt der Session. Backend-Typ ist `java.sql.Timestamp`; ISO-aehnliche Strings sind der beste Frontend-Default. |

Beispiel:

```json
{
  "analyticsId": "56e92b3e-c7d5-4f6e-97d9-58cf72f8b5c1",
  "loginTimestamp": "2026-05-01T10:30:00.000Z"
}
```

### SessionEntity

Wird aktuell von `POST /api/analytics/postSession` zurueckgegeben. Das Backend
exponiert hier die Datenbank-Entity.

```ts
type SessionEntity = {
  sessionId: number
  analytics_id: string
  loginTimestamp: string
}
```

Hinweis: Das Feld `analytics_id` kommt aus einem Java-Feld mit Unterstrich. Das
Frontend sollte fuer diese Response nicht `analyticsId` erwarten, solange das
Backend nicht auf DTO-Rueckgabe umgestellt ist.

### CartDTO

Wird fuer Warenkorb-Requests und fuer die Rueckgabe von `GET /api/cart/getCart/{analyticsId}` verwendet.

```ts
type CartDTO = {
  analyticsId: string
  publicProductId: string
  amountSelected: number
  status: number
}
```

Hinweis: `analyticsId` ist dieselbe UUID aus `localStorage`, die auch fuer Analytics-Sessions verwendet wird. `publicProductId` ist die `publicId` des Produkts.

## Endpunkte

### Health: Status pruefen

```http
GET /api/health/status
```

Zweck: Prueft, ob das Backend erreichbar ist.

Request:

- Kein Body.
- Keine Query-Parameter.

Response:

- `200 OK`
- Leerer Body.

Beispiel:

```ts
const response = await fetch('/api/health/status')
if (!response.ok) {
  throw new Error('Backend nicht erreichbar')
}
```

### Products: Alle Produkte laden

```http
GET /api/product/getProducts
```

Zweck: Liefert alle Produkte als Liste.

Request:

- Kein Body.
- Keine Query-Parameter.

Response:

- `200 OK`
- Body: `ProductDTO[]`

Beispiel-Response:

```json
[
  {
    "publicId": "9d0e27fb-5c41-4b1d-a0a9-871f25e6f655",
    "name": "AStA Hoodie",
    "description": "Schwarzer Hoodie mit Logo",
    "imagePath": "/images/products/hoodie.png",
    "price": 3499,
    "amountInStock": 12,
    "tag": "clothing"
  }
]
```

Frontend-Hinweise:

- Es gibt keine Pagination; bei groesserer Produktmenge muss das Frontend aktuell
  die komplette Liste laden.
- Sortierung und Filterung muessen aktuell client-seitig passieren.

### Products: Einzelnes Produkt laden

```http
GET /api/product/getProduct/{id}
```

Zweck: Liefert ein Produkt anhand seiner oeffentlichen UUID.

Path-Parameter:

| Name | Typ | Bedeutung |
| --- | --- | --- |
| `id` | `string` UUID | `publicId` des Produkts. |

Request:

- Kein Body.
- Keine Query-Parameter.

Response:

- `200 OK`
- Body: `ProductDTO`, wenn gefunden.
- Body kann leer oder `null` sein, wenn nicht gefunden, weil der Controller
  aktuell `Optional<ProductDTO>` mit `ResponseEntity.ok(...)` zurueckgibt.

Beispiel-Request:

```ts
const productId = '9d0e27fb-5c41-4b1d-a0a9-871f25e6f655'
const response = await fetch(`/api/product/getProduct/${productId}`)
const product = response.ok ? await response.json() : null
```

Beispiel-Response:

```json
{
  "publicId": "9d0e27fb-5c41-4b1d-a0a9-871f25e6f655",
  "name": "AStA Hoodie",
  "description": "Schwarzer Hoodie mit Logo",
  "imagePath": "/images/products/hoodie.png",
  "price": 3499,
  "amountInStock": 12,
  "tag": "clothing"
}
```

Defensive Frontend-Regel:

- Nicht allein auf `404` pruefen. Auch bei `200 OK` muss das Frontend mit leerem
  oder nicht verwertbarem Body umgehen.

### Admin: Produkt anlegen

```http
POST /api/admin/addProduct
```

Zweck: Legt ein neues Produkt an.

Request-Body: `ProductDTO`

Beim Anlegen erzeugt die Entity intern eine neue `publicId`. Der Mapper setzt
`publicId` aus dem Request nicht auf die Entity, daher sollte das Frontend bei
Create-Requests keine selbst gesetzte `publicId` erwarten.

Beispiel-Request:

```json
{
  "publicId": null,
  "name": "AStA Hoodie",
  "description": "Schwarzer Hoodie mit Logo",
  "imagePath": "/images/products/hoodie.png",
  "price": 3499,
  "amountInStock": 12,
  "tag": "clothing"
}
```

Response:

- `200 OK`
- Body: aktuell `ProductEntity`, nicht `ProductDTO`

Beispiel-Response:

```json
{
  "productId": 1,
  "publicId": "9d0e27fb-5c41-4b1d-a0a9-871f25e6f655",
  "name": "AStA Hoodie",
  "description": "Schwarzer Hoodie mit Logo",
  "imagePath": "/images/products/hoodie.png",
  "price": 3499,
  "amountInStock": 12,
  "tag": "clothing"
}
```

Frontend-Hinweise:

- Nach erfolgreichem Create fuer weitere Operationen `publicId` aus der Response
  verwenden.
- `productId` nicht fuer URLs, Updates oder Deletes verwenden.

### Admin: Produkt aktualisieren

```http
PUT /api/admin/updateProduct
```

Zweck: Aktualisiert ein bestehendes Produkt anhand von `publicId`.

Request-Body: vollstaendiges `ProductDTO`

`publicId` ist erforderlich. Das Backend aktualisiert die Felder `name`,
`description`, `price`, `amountInStock`, `imagePath` und `tag`.

Beispiel-Request:

```json
{
  "publicId": "9d0e27fb-5c41-4b1d-a0a9-871f25e6f655",
  "name": "AStA Hoodie",
  "description": "Schwarzer Hoodie mit Logo, aktualisierte Beschreibung",
  "imagePath": "/images/products/hoodie.png",
  "price": 3299,
  "amountInStock": 10,
  "tag": "clothing"
}
```

Response:

- `200 OK`
- Body: aktualisiertes `ProductDTO`

Beispiel-Response:

```json
{
  "publicId": "9d0e27fb-5c41-4b1d-a0a9-871f25e6f655",
  "name": "AStA Hoodie",
  "description": "Schwarzer Hoodie mit Logo, aktualisierte Beschreibung",
  "imagePath": "/images/products/hoodie.png",
  "price": 3299,
  "amountInStock": 10,
  "tag": "clothing"
}
```

Fehlerverhalten:

- Wenn `publicId` nicht existiert, wirft der Service eine `RuntimeException`.
- Ohne zentrale Fehlerbehandlung fuehrt das aktuell wahrscheinlich zu `500
  Internal Server Error`, nicht zu `404 Not Found`.

Defensive Frontend-Regel:

- Bei Update-Fehlern generische Fehlermeldung anzeigen und nicht spezifisch nur
  auf `404` pruefen.
- Vor dem Senden sicherstellen, dass `publicId` vorhanden ist.

### Admin: Produkt loeschen

```http
POST /api/admin/deleteProduct/{id}
```

Zweck: Legacy-Admin-Endpunkt. Im aktuellen Backend soll Produkt-Loeschen fachlich als "inaktiv setzen" behandelt werden, damit Datenintegritaet erhalten bleibt.

Path-Parameter:

| Name | Typ | Bedeutung |
| --- | --- | --- |
| `id` | `string` UUID | `publicId` des Produkts. |

Request:

- Kein Body.
- Keine Query-Parameter.

Response:

- `200 OK`
- Leerer Body.

Beispiel:

```ts
const productId = '9d0e27fb-5c41-4b1d-a0a9-871f25e6f655'
const response = await fetch(`/api/admin/deleteProduct/${productId}`, {
  method: 'POST',
})
if (!response.ok) {
  throw new Error('Produkt konnte nicht geloescht werden')
}
```

Hinweis: Das Frontend sollte bevorzugt `PATCH /api/product/setProductInactive/{publicId}` verwenden.

### Products: Produkt inaktiv setzen

```http
PATCH /api/product/setProductInactive/{publicId}
```

Zweck: Setzt ein Produkt auf `INACTIVE`, ohne es physisch aus der DB zu loeschen.

Path-Parameter:

| Name | Typ | Bedeutung |
| --- | --- | --- |
| `publicId` | `string` UUID | `publicId` des Produkts. |

Request:

- Kein Body.

Response:

- `200 OK`
- Body: aktualisiertes `ProductDTO` mit `status: "INACTIVE"`

Frontend-Hinweis:

- "Delete product" im Admin-Panel muss diesen Endpunkt verwenden und als Soft-Delete behandeln.

### Cart: Warenkorb laden

```http
GET /api/cart/getCart/{analyticsId}
```

Zweck: Liefert den aktuellen Warenkorb fuer die `analyticsId` aus `localStorage`.

Response:

- `200 OK`
- Body: `CartDTO[]`

### Cart: Produkt hinzufuegen

```http
POST /api/cart/addToCart
```

Request-Body: `CartDTO`

Beispiel-Request:

```json
{
  "analyticsId": "56e92b3e-c7d5-4f6e-97d9-58cf72f8b5c1",
  "publicProductId": "9d0e27fb-5c41-4b1d-a0a9-871f25e6f655",
  "amountSelected": 1,
  "status": 1
}
```

Response:

- `200 OK`
- Body: aktuell `CartEntity`

### Cart: Produkt entfernen

```http
POST /api/cart/removeFromCart/{analyticsId}/{publicId}
```

Zweck: Entfernt das Produkt aus dem Warenkorb der `analyticsId`.

Response:

- `200 OK`
- Body: aktualisierter `CartDTO[]`

### Analytics: Session posten

```http
POST /api/analytics/postSession
```

Zweck: Speichert ein Analytics-Session-Objekt.

Request-Body: `SessionDTO`

Beispiel-Request:

```json
{
  "analyticsId": "56e92b3e-c7d5-4f6e-97d9-58cf72f8b5c1",
  "loginTimestamp": "2026-05-01T10:30:00.000Z"
}
```

Response:

- `200 OK`
- Body: aktuell `SessionEntity`, nicht `SessionDTO`

Beispiel-Response:

```json
{
  "sessionId": 1,
  "analytics_id": "56e92b3e-c7d5-4f6e-97d9-58cf72f8b5c1",
  "loginTimestamp": "2026-05-01T10:30:00.000+00:00"
}
```

Frontend-Hinweise:

- Fuer Analytics sollte das Frontend eine stabile UUID aus `localStorage` lesen
  und als `analyticsId` senden. Falls noch keine UUID existiert, erzeugt das
  Frontend eine neue UUID und speichert sie in `localStorage`.
- Diese `analyticsId` dient aktuell als Session-ID-Ersatz, um ein schwieriges
  Cookie-Setup in der MVP-Phase zu umgehen.
- Die Response muss fuer normale Shop-Flows nicht zwingend verwendet werden.
- Wegen `analytics_id` in der Response defensive Mapping-Logik verwenden, wenn
  die Response doch verarbeitet wird.

## Nicht aktive oder indirekte Endpunkte

### Cart

Cart-REST-Endpunkte sind seit dem Product-Domain-Update vorhanden und im Abschnitt "Endpunkte" dokumentiert. Das Frontend soll die `analyticsId` aus `localStorage` als Warenkorb-Schluessel verwenden.

### Actuator

Das Backend exponiert laut Konfiguration alle Actuator-Web-Endpunkte. Diese
liegen durch den globalen Context Path ebenfalls unter `/api/actuator/**`.

Fuer das Shop-Frontend sind diese Endpunkte nicht Teil des fachlichen API-
Vertrags. Sie sollten nicht in normalen UI-Flows verwendet werden.

## Bekannte API-Eigenheiten

- `GET /api/product/getProduct/{id}` gibt bei nicht gefundenem Produkt
  wahrscheinlich keinen sauberen `404` zurueck.
- `POST /api/admin/addProduct` gibt eine Datenbank-Entity zurueck und kann
  dadurch `productId` exponieren.
- `POST /api/analytics/postSession` gibt eine Datenbank-Entity zurueck und
  verwendet in der Response wahrscheinlich `analytics_id` statt `analyticsId`.
- Produkt-Loeschen soll fachlich als Soft-Delete ueber
  `PATCH /api/product/setProductInactive/{publicId}` umgesetzt werden.
- Cart-Endpunkte verwenden die `analyticsId` als Session-Ersatz.
- Es gibt keine zentrale Fehlerantwort-Struktur.
- Es gibt keine sichtbaren Validierungsregeln im Backend; das Frontend sollte
  mindestens UUIDs, Pflichtfelder, Preis und Lagerbestand validieren.
- Es gibt keine explizite CORS-Konfiguration; fuer lokale Entwicklung ist ein
  Vite-Proxy empfehlenswert.
- Admin-Endpunkte sind aktuell nicht geschuetzt. Spaetere Authentifizierung ist
  im README als Idee erwaehnt, aber derzeit nicht umgesetzt.

## Minimaler Frontend-Client

```ts
const API_BASE_URL = '/api'

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (null as T)
}

export function getProducts() {
  return requestJson<ProductDTO[]>('/product/getProducts')
}

export function getProduct(publicId: string) {
  return requestJson<ProductDTO | null>(`/product/getProduct/${publicId}`)
}

export function addProduct(product: Omit<ProductDTO, 'publicId'>) {
  return requestJson<ProductEntity>('/admin/addProduct', {
    method: 'POST',
    body: JSON.stringify({ ...product, publicId: null }),
  })
}

export function updateProduct(product: ProductDTO) {
  return requestJson<ProductDTO>('/admin/updateProduct', {
    method: 'PUT',
    body: JSON.stringify(product),
  })
}

export function setProductInactive(publicId: string) {
  return requestJson<ProductDTO>(`/product/setProductInactive/${publicId}`, {
    method: 'PATCH',
  })
}

export function postSession(session: SessionDTO) {
  return requestJson<SessionEntity>('/analytics/postSession', {
    method: 'POST',
    body: JSON.stringify(session),
  })
}
```

## Empfohlene Frontend-Akzeptanzkriterien

- Produktliste laedt aus `GET /api/product/getProducts`.
- Produktdetails verwenden ausschliesslich `publicId`.
- Create-Flow erwartet `ProductEntity` und extrahiert daraus `publicId`.
- Update-Flow sendet ein vollstaendiges `ProductDTO` mit vorhandener `publicId`.
- Delete-Flow im Admin setzt Produkte ueber `PATCH /api/product/setProductInactive/{publicId}` auf `INACTIVE`.
- Warenkorb laedt ueber `GET /api/cart/getCart/{analyticsId}` und kann Produkte ueber `POST /api/cart/addToCart` sowie `POST /api/cart/removeFromCart/{analyticsId}/{publicId}` hinzufuegen und entfernen.
- Analytics-Tracking liest `analyticsId` aus `localStorage`, erzeugt sie bei
  Bedarf einmalig neu, sendet `analyticsId` und `loginTimestamp`, aber blockiert
  den Shop-Flow nicht, falls der Request fehlschlaegt.
- UI-Fehlerbehandlung geht mit `500`, leerem Body und nicht standardisierten
  Fehlerantworten robust um.

## 🛒 Orders API

### Neue Bestellung anlegen
Erstellt eine neue Bestellung basierend auf den übergebenen Produktdaten.

*   **URL:** `/api/orders`
*   **Method:** `POST`
*   **Request Body (DTO):**
    ```json
    {
      "customerName": "Max Mustermann",
      "items": [
        {
          "productId": 1,
          "quantity": 2
        }
      ]
    }
    ```
*   **Success Response:**
    *   **Code:** `201 CREATED`
    *   **Content:** Gibt das erstellte Order-Objekt inklusive generierter ID und Gesamtpreis zurück.
*   **Error Response (Validation):**
    *   **Code:** `400 BAD REQUEST` (z. B. wenn `quantity` < 1 oder `customerName` leer ist).

### Alle Bestellungen abrufen
Gibt eine Liste aller getätigten Bestellungen zurück.

*   **URL:** `/api/orders`
*   **Method:** `GET`
*   **Success Response:**
    *   **Code:** `200 OK`
    *   **Content:** `[ { "id": 1, "customerName": "Max...", "status": "PENDING", ... } ]`

### Einzelne Bestellung abrufen
*   **URL:** `/api/orders/{id}`
*   **Method:** `GET`
*   **Success Response:** `200 OK`
*   **Error Response:** `404 NOT FOUND` (Wenn die ID nicht existiert, sauber gehandelt via Optional).

---

## 📦 Products API (Refactored)

*Hinweis: Die Product API wurde überarbeitet, um saubere HTTP-Statuscodes zu liefern und Invalid-Requests durch DTO-Validierung frühzeitig abzufangen.*

### Produkt abrufen (Optional Handling Fix)
*   **URL:** `/api/products/{id}`
*   **Method:** `GET`
*   **Success Response:**
    *   **Code:** `200 OK`
    *   **Content:** `{ "id": 1, "name": "Kaffee", "price": 2.50 }`
*   **Error Response:**
    *   **Code:** `404 NOT FOUND` (Gefixt: Gibt nun korrekten 404 Statuscode statt einer NullPointerException zurück, falls das Produkt nicht existiert).

### Neues Produkt anlegen (DTO Validation)
*   **URL:** `/api/products`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "name": "Club Mate",
      "price": 1.50,
      "stock": 100
    }
    ```
*   **Success Response:** `201 CREATED`
*   **Error Responses:** 
    *   **Code:** `400 BAD REQUEST`
    *   **Ursache:** Tritt auf, wenn die `@Valid`-Constraints des DTOs verletzt werden (z. B. negativer Preis, fehlender Name).