CODPO — Product Requirements Document

Product: CODPO
Product Type: Local marketplace & COD platform
Market: Indonesia
Status: MVP
Document Purpose: Source of truth for AI coding agents and product implementation.

---

1. Product Overview

CODPO adalah marketplace lokal yang fokus pada barang murah dari orang yang sedang BU (Butuh Uang) dan transaksi COD secara langsung.

CODPO bukan marketplace general-purpose seperti Shopee.

Core behavior:

«Seller butuh uang → jual barang murah → buyer sekitar menemukan barang → chat → COD → transaksi selesai.»

Alasan utama buyer membuka CODPO:

«"Coba cek CODPO, siapa tahu ada barang BU murah di sekitar gue."»

---

2. Core Value Proposition

Untuk Buyer

Menemukan barang murah dari seller yang sedang BU di sekitar lokasi mereka.

Buyer mendapatkan:

- harga menarik
- barang dekat
- informasi seller
- reputasi seller
- availability COD
- pengalaman COD yang lebih terstruktur

Untuk Seller

Menjual barang dengan cepat kepada buyer lokal.

Seller mendapatkan:

- marketplace khusus barang lokal
- discovery berdasarkan lokasi
- BU badge
- chat buyer
- COD management
- reputation system
- optional paid boost

---

3. Product Principles

CODPO harus selalu mengutamakan:

Local First

Barang yang dekat dengan buyer diprioritaskan.

BU First

BU adalah core discovery mechanism.

COD First

COD bukan sekadar metode pembayaran tambahan.

COD adalah inti transaksi.

Fast Deal

Jarak antara melihat barang dan mengajukan COD harus sesingkat mungkin.

Trust

Reputasi user menjadi bagian penting marketplace.

Free Core Marketplace

Listing dasar dan transaksi dasar gratis.

Monetisasi MVP berasal dari:

Boost Listing.

---

4. Target Users

Buyer

Orang yang:

- suka mencari barang murah
- mencari barang second
- tertarik dengan deal
- bersedia COD
- berada di area urban/suburban
- lebih memilih barang yang dekat

Seller

Orang yang:

- ingin menjual barang pribadi
- sedang BU
- ingin barang cepat laku
- biasa berjualan melalui Facebook Marketplace, WhatsApp, grup jual beli, dll.

---

5. Platform Strategy

CODPO harus responsive dan dapat digunakan melalui:

Mobile

Primary experience.

Digunakan untuk:

- browsing
- search
- chat
- COD
- GPS

Desktop

Digunakan terutama untuk:

- seller dashboard
- listing management
- analytics
- marketplace browsing

Initial implementation dapat menggunakan satu responsive Next.js application.

Native Android/Kotlin adalah future phase dan bukan bagian MVP.

---

6. Account Model

Satu user hanya membutuhkan satu account.

User dapat switch antara:

Buyer Mode

dan

Seller Mode

Tidak perlu membuat account terpisah.

---

7. Buyer Mode

Buyer Mode memungkinkan user:

- browse listing
- search
- filter
- melihat barang terdekat
- melihat BU listing
- melihat detail barang
- melihat seller
- chat seller
- mengajukan COD
- mengelola transaksi
- melihat histori
- memberikan rating

---

8. Seller Mode

Seller Mode memungkinkan user:

- melihat dashboard
- membuat listing
- mengedit listing
- menghapus listing
- mengaktifkan BU
- mengatur harga
- mengatur lokasi COD
- mengatur availability
- menerima chat
- menerima/menolak COD request
- mengelola transaksi
- melihat rating
- melakukan boost listing

---

9. Marketplace Homepage

Homepage Buyer harus fokus pada discovery.

Primary section:

🔥 BU TERDEKAT

Listing diprioritaskan berdasarkan:

- distance
- BU status
- price competitiveness
- COD availability
- seller reputation
- freshness
- boost

Contoh:

iPhone 13 128GB
Rp4.800.000
🔥 BU
📍 1,2 km
🟢 COD sekarang

---

10. Discovery Sections

MVP:

1. BU Terdekat
2. Baru Ditambahkan
3. Harga Menarik
4. Kategori
5. Semua Barang

Future:

- Trending
- Recommended
- Flash BU
- Recently Viewed
- Saved Search

---

11. Categories

Initial categories:

- HP & Tablet
- Laptop & Komputer
- Elektronik
- Gaming
- Kamera
- Fashion
- Sepatu
- Kendaraan
- Furniture
- Rumah
- Hobi
- Lainnya

Categories harus configurable melalui Admin Dashboard.

---

12. Location System

Location merupakan bagian fundamental CODPO.

Location digunakan untuk:

- nearby listings
- distance calculation
- radius filtering
- ranking
- COD meeting point
- live COD tracking

User dapat memilih radius:

- 1 km
- 3 km
- 5 km
- 10 km
- 25 km

Default:

5 km

---

13. Location Privacy

CODPO tidak boleh mengekspos alamat pribadi seller secara publik.

Public listing hanya menampilkan:

«📍 Bekasi Utara
1,2 km dari kamu»

Bukan exact residential address.

Exact meeting location hanya dibagikan setelah COD session disepakati.

---

14. Seller Listing

Seller dapat membuat listing.

Required:

- title
- description
- category
- condition
- price
- images
- location
- COD availability
- sale type

Sale type MVP:

- NORMAL
- BU

---

15. BU Mode

Seller dapat menandai listing sebagai:

🔥 BU — BUTUH UANG

BU menunjukkan bahwa seller ingin barang cepat terjual dan menawarkan harga menarik.

Listing BU mendapatkan:

- BU badge
- ranking boost
- dedicated BU discovery

BU bukan jaminan bahwa harga pasti termurah.

---

16. BU Pricing

Seller dapat memasukkan:

Normal Price

dan jika BU:

BU Price

Contoh:

Normal:

Rp6.000.000

BU:

Rp4.800.000

Frontend menampilkan:

/Rp6.000.000/

Rp4.800.000

🔥 BU

Seller dapat menentukan:

BU expiration

Contoh:

- 24 jam
- 3 hari
- 7 hari
- custom

Setelah expiration:

BU status otomatis kembali menjadi NORMAL.

Listing tidak otomatis dihapus.

---

17. Listing Images

Seller dapat upload multiple images.

MVP:

- minimum 1 image
- maximum configurable
- image compression
- thumbnail generation

Images disimpan di:

Cloudflare R2

Database hanya menyimpan metadata/file references.

Do not store large image binaries in PostgreSQL.

---

18. Listing Card

Listing card harus menampilkan:

- image
- title
- price
- original price jika BU
- BU badge
- distance
- COD availability
- seller rating

Example:

🔥 BU

iPhone 13 128GB

/Rp6.000.000/

Rp4.800.000

📍 1,2 km
🟢 COD sekarang
⭐ 4.9

---

19. Search

Search menggunakan:

- keyword
- category
- location
- radius
- price
- condition
- BU
- COD availability

Example:

User search:

«iPhone»

Filter:

«🔥 BU
≤5 km
Rp3–6 juta
COD sekarang»

---

20. Sorting

MVP:

- Recommended
- Terdekat
- Terbaru
- Termurah
- Termahal

Default:

Recommended

---

21. Ranking Algorithm

Ranking harus deterministic dan explainable.

Initial ranking:

ranking_score =
relevance

- distance
- BU_score
- price_score
- freshness
- seller_reputation
- COD_availability
- boost_score

Distance harus memiliki bobot besar.

Example:

Barang 1:

«1 km / BU / rating 4.9»

Barang 2:

«15 km / BU / rating 4.9»

Barang 1 seharusnya secara umum berada di atas Barang 2 jika faktor lain serupa.

BU memberikan ranking advantage.

Boost memberikan ranking advantage.

Boost tidak boleh sepenuhnya mengabaikan relevance dan distance.

Do not use machine learning for MVP.

---

22. Product Detail

Product detail harus menampilkan:

- image gallery
- title
- price
- normal price
- BU status
- BU expiration
- condition
- description
- specifications
- seller profile
- rating
- completed transactions
- approximate location
- distance
- COD availability

Primary CTA:

AJUKAN COD

Secondary:

CHAT SELLER

---

23. Seller Profile

Seller profile:

- avatar
- name
- rating
- completed transactions
- account age
- active listings
- response rate
- verification status

Future:

- seller level
- followers
- seller reviews
- badges

---

24. Chat System

Buyer dan seller dapat chat mengenai listing.

Chat harus contextual.

Example:

Chat tentang:

iPhone 13 128GB
Rp4.800.000
🔥 BU

Messages support:

- text
- image
- system message
- location
- COD action

---

25. Chat Quick Actions

MVP quick actions:

Ajukan COD

Kirim Lokasi

Saya OTW

Saya Sudah Sampai

Quick actions harus terhubung dengan transaction state.

---

26. Chat Architecture

Use:

Supabase PostgreSQL

untuk message persistence.

Use:

Supabase Realtime

untuk realtime delivery.

Basic entities:

conversations
messages
conversation_participants

Users may only access conversations where they are participants.

RLS must enforce this.

---

27. COD Request

Buyer membuka listing:

AJUKAN COD

Buyer memilih:

- preferred date
- preferred time
- meeting location
- optional note

System creates:

COD Request

Seller dapat:

- Accept
- Reject
- Suggest different time
- Suggest different location

---

28. COD Session

Jika seller accept:

COD Session dibuat.

Data:

- listing
- buyer
- seller
- meeting point
- scheduled date
- scheduled time
- status

---

29. COD State Machine

REQUESTED
↓
ACCEPTED
↓
SCHEDULED
↓
OTW
↓
NEAR_LOCATION
↓
ARRIVED
↓
ITEM_CHECK
↓
COMPLETED

Alternative:

CANCELLED
NO_SHOW
DISPUTED
EXPIRED

State transitions harus divalidasi server-side.

---

30. Live COD Tracking

Live GPS hanya aktif ketika COD session berlangsung.

Flow:

COD ACCEPTED
↓
User activates location sharing
↓
Location updates
↓
Supabase Realtime
↓
Other participant sees location
↓
COD COMPLETED
↓
Tracking stops

Location update harus throttled.

Do not send GPS every second.

Use configurable:

- time interval
- distance threshold

---

31. GPS Privacy

Rules:

1. User must explicitly enable location sharing.
2. Live location only available to COD participants.
3. Live location stops when COD ends.
4. Precise movement history should not be unnecessarily retained.
5. Public listings never expose exact private addresses.
6. RLS protects location data.

---

32. Meeting Point

Meeting point can be selected using map.

MVP:

- map
- pin
- approximate address
- coordinates

Future:

- recommended public COD locations
- safe meetup locations
- partner locations

CODPO should encourage public meeting points.

---

33. Item Check

Before completing transaction:

Buyer selects:

Barang sudah diterima dan diperiksa

Then:

SELESAIKAN TRANSAKSI

Transaction changes to:

COMPLETED

---

34. Payment

MVP principle:

CODPO DOES NOT PROCESS THE PRODUCT PAYMENT.

Payment occurs directly between buyer and seller during COD.

Supported externally:

- cash
- bank transfer
- e-wallet

CODPO only records:

transaction completed

Do not implement:

- escrow
- payment holding
- marketplace checkout
- product payment gateway

in MVP.

---

35. Transaction

Transaction is created after COD session is accepted.

Transaction stores:

- listing
- buyer
- seller
- agreed price
- COD session
- timestamps
- status

Status:

PENDING
IN_PROGRESS
ITEM_CHECK
COMPLETED
CANCELLED
NO_SHOW
DISPUTED

---

36. Rating

After COMPLETED:

Buyer can rate seller.

Seller can rate buyer.

Rating:

1–5 stars

Optional review.

Store:

- rating
- review
- reviewer
- recipient
- transaction
- timestamp

---

37. Reputation

User reputation includes:

- average rating
- completed transactions
- cancellation rate
- no-show rate

Reputation can affect ranking.

Future:

COD Reliability Score

Do not over-engineer reputation in MVP.

---

38. No Show

User can be reported for not attending an accepted COD.

Repeated no-show can cause:

- warning
- reputation penalty
- ranking penalty
- temporary restriction
- suspension

Admin can review.

---

39. Boost Listing

Primary MVP monetization.

Seller can purchase:

🚀 BOOST

Purpose:

Increase listing visibility.

Example products:

Boost 24 Hours

Rp3.000–Rp5.000

Boost 3 Days

Rp7.000–Rp10.000

Super Boost

Rp15.000+

Prices must be configurable through admin.

Boost should not modify listing price.

Boost only influences ranking.

---

40. Seller Dashboard

Desktop-focused.

Sections:

Overview

- active listings
- total listings
- sold
- views
- COD requests
- completed transactions
- rating

Listings

Columns:

- image
- product
- price
- BU
- views
- status
- boost
- actions

Transactions

- product
- buyer
- date
- COD status
- transaction status

---

41. Buyer Transactions

Buyer can see:

- active COD
- upcoming COD
- completed transactions
- cancelled transactions

Active COD should show:

- product
- seller
- meeting point
- time
- current status
- live location when active

---

42. Notifications

MVP:

- new chat
- COD request
- COD accepted
- COD rejected
- COD reminder
- seller/buyer OTW
- arrived
- transaction completed
- rating request

Start with:

in-app notifications

Push notifications can be added later.

---

43. Admin Dashboard

Admin must manage:

Users

- view
- suspend
- ban
- restore

Listings

- view
- remove
- moderate

Categories

- create
- edit
- disable

Reports

- review
- resolve
- take action

Boost

- configure pricing
- activate/deactivate products

Analytics

- users
- listings
- BU listings
- transactions
- completed COD
- reports

---

44. Reports

Users can report:

- scam
- fake item
- misleading listing
- prohibited item
- inappropriate content
- suspicious user
- price manipulation

Admin handles reports.

---

45. Security

Required:

- authentication
- authorization
- RLS
- server-side validation
- input sanitization
- upload validation
- rate limiting
- protected admin routes

Rules:

Seller can only modify their own listings.

Buyer cannot modify another user's transaction.

Users cannot access private conversations they do not participate in.

COD location is only accessible to authorized participants.

Never trust frontend-only authorization.

---

46. Database

Recommended:

PostgreSQL + PostGIS

Core tables:

users
profiles
user_locations

categories

listings
listing_images

conversations
conversation_participants
messages

cod_requests
cod_sessions
cod_locations

transactions

reviews
reports

boost_products
listing_boosts

notifications

admin_users
admin_actions

Use PostGIS for geographic queries.

---

47. Storage

Use:

Cloudflare R2

For:

- listing images
- chat images
- profile images if desired

PostgreSQL stores:

- object key
- URL/reference
- metadata

Implement image compression before upload.

Generate thumbnails where appropriate.

---

48. Recommended Tech Stack

Frontend:

Next.js + TypeScript

Backend/platform:

Supabase

Services:

- Supabase Auth
- PostgreSQL
- PostGIS
- Supabase Realtime

Storage:

Cloudflare R2

Deployment:

Vercel

Future:

Native Android/Kotlin can use the same backend.

---

49. Architecture Principle

Do not tightly couple business logic to the frontend.

The architecture should allow:

                ┌── Next.js Web
                │

CODPO Backend ──┼── Android Kotlin
│
└── Admin
↓
Supabase
↓
R2

The database and authorization layer must remain the source of truth.

---

50. Responsive Navigation

Mobile

Bottom navigation:

Home
Search
Sell
Transactions
Profile

Seller mode can expose:

Dashboard
Listings
Orders/COD
Chat
Profile

Desktop

Sidebar:

Home
BU Terdekat
Categories
Chat
Transactions
Favorites

SELLER
Dashboard
Listings
Transactions
Analytics

---

51. Visual Direction

CODPO should feel like a modern consumer marketplace.

Characteristics:

- clean
- modern
- mobile-first
- strong product imagery
- strong price hierarchy
- clear distance information
- recognizable BU badge
- simple COD CTA

Do not make consumer marketplace UI look like a generic SaaS dashboard.

Seller dashboard may use more SaaS-like information density.

---

52. MVP Scope

MUST HAVE

Account

- register
- login
- profile
- buyer/seller mode

Marketplace

- feed
- search
- categories
- filters
- distance
- listing detail

Seller

- seller dashboard
- create listing
- edit listing
- delete listing
- BU
- COD availability

Communication

- realtime chat
- image sharing
- listing context

COD

- request
- accept/reject
- meeting point
- COD state
- live location

Transaction

- item check
- completion
- rating

Admin

- user management
- listing management
- reports
- categories

Monetization

- listing boost

---

53. NOT MVP

Explicitly do not implement unless requested:

- Open PO
- preorder
- escrow
- marketplace checkout
- product payment gateway
- delivery/courier service
- seller subscription
- AI negotiation
- recommendation ML
- livestream
- social feed
- affiliate
- loyalty
- advanced KYC
- native iOS
- native Android
- multi-country support

Open PO is a future feature.

The product should first prove that:

«BU listing → local discovery → COD → completed transaction»

works.

---

54. Cold Start Strategy

CODPO should not initially launch nationwide.

Start with a dense local market.

Goal:

«Enough BU listings within a geographic area that buyers repeatedly find attractive deals.»

Initial supply acquisition:

- Facebook Marketplace
- Facebook buy/sell groups
- WhatsApp communities
- local communities
- personal network

Buyer acquisition:

- organic social content
- "BU hari ini"
- local deal content
- community marketing

Paid advertising should scale after supply exists.

---

55. Monetization Philosophy

Do not take transaction percentage during MVP.

Reason:

BU sellers are price-sensitive.

Instead:

«Sell visibility, not transaction value.»

Primary:

Boost Listing

Future:

- Featured listings
- Seller Pro
- seller analytics
- premium tools
- optional buyer protection

---

56. North Star Metric

Primary:

COMPLETED COD TRANSACTIONS

Do not optimize only for:

- registered users
- downloads
- page views
- listings

The marketplace is successful when:

«users discover → communicate → meet → complete transactions.»

Supporting metrics:

- active listings
- active BU listings
- COD requests
- COD acceptance rate
- completed COD rate
- average time to sale
- repeat buyers
- repeat sellers
- no-show rate

---

57. Core Product Loop

SELLER NEEDS MONEY
↓
UPLOAD ITEM
↓
MARK AS BU
↓
LOCAL BUYER DISCOVERS
↓
CHAT
↓
COD REQUEST
↓
SELLER ACCEPTS
↓
MEETING POINT
↓
LIVE LOCATION
↓
MEET
↓
CHECK ITEM
↓
PAY DIRECTLY
↓
COMPLETE
↓
RATE

Everything in the MVP should support this loop.

---

58. Implementation Strategy for AI Coding Agent

The AI coding agent must:

1. Treat this PRD as the product source of truth.
2. Do not implement features outside MVP without explicit approval.
3. Build in small vertical slices.
4. Finish backend/database/security before considering a feature complete.
5. Never rely only on frontend validation.
6. Use RLS for protected Supabase data.
7. Use PostGIS for distance queries.
8. Use R2 for images.
9. Use Supabase Realtime for chat and active COD tracking.
10. Keep GPS updates throttled.
11. Protect precise location data.
12. Keep payment processing outside the MVP.
13. Keep PO outside the MVP.
14. Avoid premature microservices.
15. Avoid unnecessary custom WebSocket infrastructure.
16. Keep components reusable.
17. Make mobile UX first-class.
18. Implement loading, empty, error, and permission states.
19. Test every feature before moving to the next.
20. Do not consider UI-only implementation as feature completion.

---

59. Recommended Development Order

Phase 1 — Foundation

- Next.js setup
- TypeScript
- design system
- Supabase connection
- authentication
- profiles
- RLS

Phase 2 — Marketplace

- categories
- listings
- image upload to R2
- listing CRUD
- marketplace feed
- detail page

Phase 3 — Location

- browser geolocation
- PostGIS
- distance calculation
- radius filtering
- nearby discovery
- ranking

Phase 4 — BU

- BU toggle
- BU price
- BU expiration
- BU badge
- BU ranking
- BU feed

Phase 5 — Chat

- conversations
- messages
- Supabase Realtime
- image messages
- contextual listing chat

Phase 6 — COD

- COD request
- accept/reject
- meeting point
- COD state machine
- live tracking

Phase 7 — Trust

- ratings
- reviews
- no-show
- reports
- moderation

Phase 8 — Monetization

- boost products
- listing boost
- payment for boost

Phase 9 — Admin

- users
- listings
- reports
- categories
- boost management
- analytics

---

60. MVP Definition of Done

CODPO MVP is complete when:

- User can register/login.
- User can switch Buyer/Seller Mode.
- Seller can upload a list
  Seller can mark listing as BU.
  Seller can set BU price.
  Buyer can discover nearby listings.
  Buyer can filter by radius.
  Buyer can filter BU listings.
  Buyer can search by category/keyword.
  Buyer can view seller reputation.
  Buyer can chat with seller in realtime.
  Buyer can request COD.
  Seller can accept/reject COD.
  Both parties can choose/see meeting point.
  Both parties can activate live location during COD.
  Transaction can progress through COD states.
  Buyer can confirm item received.
  Transaction can be completed.
  Both users can rate each other.
  Seller can purchase listing boost.
  Admin can moderate users/listings/reports.
  Mobile and desktop layouts work.
  RLS and authorization prevent unauthorized access.
  Images are stored in R2.
  Core database queries are indexed and optimized.

61. Final Product Definition
    CODPO is:
    A local marketplace for people looking for cheap goods from sellers who are BU, designed around direct COD transactions.
    The product should make this behavior extremely easy:
    "Gue butuh duit."
    → Upload barang murah.
    "Gue cari barang murah."
    → Buka CODPO.
    "Barangnya deket."
    → Chat.
    "Deal."
    → COD.
    "Selesai."
    That is the product.
    Do not let secondary features distract from this core loop.
