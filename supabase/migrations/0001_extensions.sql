-- Extensions: PostGIS (PRD §46), pg_trgm (keyword search), pg_cron (BU expiry, purge, reminder)
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists pg_cron with schema extensions;
