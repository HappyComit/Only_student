-- ═══════════════════════════════════════════════════════════════
-- OnlyStudents — Database Hardening Migration
-- ═══════════════════════════════════════════════════════════════
-- Run this SQL in your Supabase Dashboard → SQL Editor → New Query
-- This adds database-level constraints and performance indexes
-- that Prisma cannot express natively.
--
-- Safe to run multiple times (all statements use IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. CHECK CONSTRAINTS (Data Integrity) ──────────────────

-- Order status can only be one of the valid state machine values
DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "order_status_check"
    CHECK (status IN (
      'PENDING', 'PENDING_ACCEPTANCE', 'IN_PROGRESS',
      'DELIVERED', 'COMPLETED', 'CANCELLED', 'DECLINED'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Review ratings must be between 1 and 5
DO $$ BEGIN
  ALTER TABLE "Review" ADD CONSTRAINT "review_rating_check"
    CHECK (rating >= 1 AND rating <= 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Gig prices and delivery days must be positive
DO $$ BEGIN
  ALTER TABLE "Gig" ADD CONSTRAINT "gig_price_positive"
    CHECK (price > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Gig" ADD CONSTRAINT "gig_delivery_positive"
    CHECK ("deliveryDays" > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order prices must be positive
DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "order_price_positive"
    CHECK (price > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ─── 2. GIN TRIGRAM INDEXES (Fast ILIKE/contains search) ────

-- Enable the pg_trgm extension (required for trigram indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fast case-insensitive search on gig titles (used by GET /api/gigs?search=)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Gig_title_trgm_idx"
  ON "Gig" USING gin (title gin_trgm_ops);

-- Fast case-insensitive search on gig descriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Gig_description_trgm_idx"
  ON "Gig" USING gin (description gin_trgm_ops);


-- ─── 3. ROW LEVEL SECURITY (Defense-in-Depth) ──────────────
-- Your backend uses DATABASE_URL (postgres role) which bypasses RLS.
-- These policies protect against direct PostgREST/anon-key access.
-- Uncomment and run when ready to enable RLS.

/*
ALTER TABLE "User"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Gig"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"  ENABLE ROW LEVEL SECURITY;
*/
