# Vindra – Digital Seglingsloggbok

En webbaserad applikation för att logga seglingar, spara rutter och väderdata, hantera båtar och destinationer, samt dela resor. Projektet är utvecklat som ett slutprojekt i webbutvecklingsutbildningen.

---

## Innehållsförteckning

1. [Syfte & Mål](#syfte--mål)
2. [MVP & Fas 2](#mvp--fas-2)
3. [Milstolpar & Tidslinje](#milstolpar--tidslinje)
4. [Teknisk Stack](#teknisk-stack)
5. [Datamodeller](#datamodeller)
6. [API-kontrakt](#api-kontrakt)
7. [Designreferenser](#designreferenser)
8. [Kravchecklista (G/VG)](#kravchecklista-gvg)
9. [Repo-struktur & Startplan](#repo-struktur--startplan)
10. [Tillgänglighet (Lighthouse 100%)](#tillgänglighet-lighthouse-100)

---

## Syfte & Mål

Vindra är en digital loggbok för segling där användare kan:

- Skapa konto och logga in.
- Logga resor manuellt eller via GPS-tracking.
- Spara start-/slutdestination, rutt, väder/vind, besättning, anteckningar och foton.
- Hantera sina båtar och favoritplatser.
- Visa resor på karta och i en översikt.

---

## MVP & Fas 2

**MVP:**

- Autentisering (login/signup med JWT).
- Landningssida (feed) med lista av resor.
- Trip-detaljer med full information.
- CRUD för resor, båtar och platser.
- Fotouppladdning (lokal lagring).
- GPS-baserad live-tracking.
- Mobilanpassning.

**Fas 2 (extra USP):**

- Export (PDF/CSV/GPX), live-delning, serviceloggar, offline-läge, väder-API.

---

## Milstolpar & Tidslinje

**15–16 aug:** Repo-skelett, auth-baskod, placeholder-komponenter.

**17–19 aug:** Backend: modeller (User, Trip, Boat, Place, TrackingSession), CRUD, JWT, uppladdning.

**20–23 aug:** Frontend: Zustand/Context, TripForm, Leaflet-integration, Platser- och Båtar-sidor.

**24–26 aug:** Live-tracking, UI-polish, tillgänglighet.

**27 aug:** Deploy (Render + Netlify), demo-data, README, demo-GIF.

Deadline: **28 augusti 2025**.

---

## Teknisk Stack

**Frontend:** React + Vite, React Router, Zustand eller Context API, react-hook-form, Zod, Leaflet (react-leaflet), TailwindCSS.

**Backend:** Node.js + Express, MongoDB + Mongoose, JWT, Multer, Helmet, CORS.

**Övrigt:** ESLint, Prettier, date-fns.

---

## Datamodeller

**Trip**

```ts
Trip {
  _id: ObjectId,
  userId: ObjectId,
  boatId?: ObjectId,
  title: string,
  date: Date,
  durationMinutes?: number,
  crew?: string[],
  notes?: string,
  start: { lat: number, lng: number, name?: string },
  end: { lat: number, lng: number, name?: string },
  route?: Array<{ lat: number, lng: number, t?: string }>,
  wind?: { dir?: string; speedKn?: number },
  weather?: string,
  photos?: string[],
  createdAt: Date,
  updatedAt: Date
}
```

**Boat**

```ts
Boat {
  _id: ObjectId,
  userId: ObjectId,
  name: string,
  model?: string,
  lengthM?: number,
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Place**

```ts
Place {
  _id: ObjectId,
  userId: ObjectId,
  name: string,
  location: { lat: number, lng: number },
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

**TrackingSession**

```ts
TrackingSession {
  _id: ObjectId,
  userId: ObjectId,
  tripId?: ObjectId,
  startedAt: Date,
  endedAt?: Date,
  points: Array<{ lat: number; lng: number; t: string }>,
  isActive: boolean
}
```

---

## API-kontrakt

**Auth**

- `POST /api/auth/signup`
- `POST /api/auth/login`

**Trips**

- `GET /api/trips`
- `POST /api/trips`
- `GET /api/trips/:id`
- `PUT /api/trips/:id`
- `DELETE /api/trips/:id`

**Boats**

- `GET /api/boats`
- `POST /api/boats`
- `PUT /api/boats/:id`
- `DELETE /api/boats/:id`

**Places**

- `GET /api/places`
- `POST /api/places`
- `DELETE /api/places/:id`

**Tracking**

- `POST /api/tracking/start`
- `POST /api/tracking/:sessionId/point`
- `POST /api/tracking/:sessionId/stop`

---

## Designreferenser

- Login/Signup: Tvåkolumnslayout (blå panel + bild) + formulärkort.
- Landningssida: Sidebar med Rubrik, CTA, Nav; huvudområde med TripCards.
- Skapa resa: Formulärfält för titel, start/slut, datum, seglingstid, besättning, anteckningar, väder, foton, ruttkarta.
- Platser: Karta + lista + skapa plats.
- Båtar: Lista + form.
- Live-tracking: Start/stop-knapp, livekarta.

---

## Kravchecklista (G/VG)

**Tekniska G-krav:**

- [ ] React (Vite)
- [ ] Node.js + Express
- [ ] MongoDB
- [ ] Auth (JWT)
- [ ] React Router
- [ ] Global state (Zustand/Context)
- [ ] Minst två externa bibliotek (Leaflet, react-hook-form, Zod, Multer)
- [ ] En React hook utanför kursens standard
- [ ] Stöd för Chrome, Firefox, Safari
- [ ] Responsiv 320–1600px
- [ ] Lighthouse 100% A11y
- [ ] Clean Code

**Visuella G-krav:**

- [ ] Box-modellkonsekvens
- [ ] Konsistenta h1–h6
- [ ] Sammanhållen färgpalett
- [ ] Mobile-first

**VG-ambition:**

- [ ] Nya verktyg/APIs
- [ ] Motiverade arkitekturval
- [ ] Mikrointeraktioner
- [ ] Extra tillgänglighet
- [ ] Stark dokumentation
- [ ] Iteration/Changelog

---

## Repo-struktur & Startplan

**Backend:**

- `/src` med `models/`, `routes/`, `controllers/`, `middleware/`
- Paket: express, mongoose, cors, helmet, jsonwebtoken, bcrypt, multer, zod

**Frontend:**

- `/src` med `pages/`, `components/`, `store/`, `hooks/`, `lib/`
- Paket: react-router-dom, zustand, react-hook-form, zod, leaflet, react-leaflet, clsx, date-fns

**Miljövariabler:**

- Frontend: `VITE_API_URL`
- Backend: `MONGO_URL`, `JWT_SECRET`, `CORS_ORIGIN`

---

## Tillgänglighet (Lighthouse 100%)

- Semantiska taggar
- Labels för alla inputs
- Färgkontrast ≥4.5:1
- Tangentbordsnavigering
- Alt-texter för bilder
- Laddningsstatus och skeletons

---

## The problem

Describe how you approached to problem, and what tools and techniques you used to solve it. How did you plan? What technologies did you use? If you had more time, what would be next?

## View it live

Every project should be deployed somewhere. Be sure to include the link to the deployed project so that the viewer can click around and see what it's all about.
