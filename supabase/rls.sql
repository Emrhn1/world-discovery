-- supabase/rls.sql
-- Run this in Supabase SQL Editor (one-time, idempotent-safe with DROP POLICY IF EXISTS)

BEGIN;

-- =========================================================
-- 1) ENABLE RLS ON ALL APP TABLES
-- =========================================================
ALTER TABLE IF EXISTS public."Country" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Place" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Discovery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Scene" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SceneHotspot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."TimelinePhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Zone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."UserProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."VisitedRegion" ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 2) PUBLIC READ POLICIES (anon + authenticated)
--    Countries/Places and read-only content can be read by all clients.
-- =========================================================

-- Country
DROP POLICY IF EXISTS "country_read_all" ON public."Country";
CREATE POLICY "country_read_all"
ON public."Country"
FOR SELECT
TO anon, authenticated
USING (true);

-- Place
DROP POLICY IF EXISTS "place_read_all" ON public."Place";
CREATE POLICY "place_read_all"
ON public."Place"
FOR SELECT
TO anon, authenticated
USING (true);

-- Discovery
DROP POLICY IF EXISTS "discovery_read_all" ON public."Discovery";
CREATE POLICY "discovery_read_all"
ON public."Discovery"
FOR SELECT
TO anon, authenticated
USING (true);

-- Scene
DROP POLICY IF EXISTS "scene_read_all" ON public."Scene";
CREATE POLICY "scene_read_all"
ON public."Scene"
FOR SELECT
TO anon, authenticated
USING (true);

-- SceneHotspot
DROP POLICY IF EXISTS "scene_hotspot_read_all" ON public."SceneHotspot";
CREATE POLICY "scene_hotspot_read_all"
ON public."SceneHotspot"
FOR SELECT
TO anon, authenticated
USING (true);

-- TimelinePhoto
DROP POLICY IF EXISTS "timeline_photo_read_all" ON public."TimelinePhoto";
CREATE POLICY "timeline_photo_read_all"
ON public."TimelinePhoto"
FOR SELECT
TO anon, authenticated
USING (true);

-- Zone
DROP POLICY IF EXISTS "zone_read_all" ON public."Zone";
CREATE POLICY "zone_read_all"
ON public."Zone"
FOR SELECT
TO anon, authenticated
USING (true);

-- Media
DROP POLICY IF EXISTS "media_read_all" ON public."Media";
CREATE POLICY "media_read_all"
ON public."Media"
FOR SELECT
TO anon, authenticated
USING (true);

-- =========================================================
-- 3) USER-OWNED POLICIES
--    Each user can read/write only their own rows.
--    IMPORTANT: userId column must store Supabase auth UID (uuid string).
-- =========================================================

-- UserProgress SELECT
DROP POLICY IF EXISTS "user_progress_select_own" ON public."UserProgress";
CREATE POLICY "user_progress_select_own"
ON public."UserProgress"
FOR SELECT
TO authenticated
USING ("userId" = auth.uid()::text);

-- UserProgress INSERT
DROP POLICY IF EXISTS "user_progress_insert_own" ON public."UserProgress";
CREATE POLICY "user_progress_insert_own"
ON public."UserProgress"
FOR INSERT
TO authenticated
WITH CHECK ("userId" = auth.uid()::text);

-- UserProgress UPDATE
DROP POLICY IF EXISTS "user_progress_update_own" ON public."UserProgress";
CREATE POLICY "user_progress_update_own"
ON public."UserProgress"
FOR UPDATE
TO authenticated
USING ("userId" = auth.uid()::text)
WITH CHECK ("userId" = auth.uid()::text);

-- UserProgress DELETE
DROP POLICY IF EXISTS "user_progress_delete_own" ON public."UserProgress";
CREATE POLICY "user_progress_delete_own"
ON public."UserProgress"
FOR DELETE
TO authenticated
USING ("userId" = auth.uid()::text);

-- VisitedRegion SELECT
DROP POLICY IF EXISTS "visited_region_select_own" ON public."VisitedRegion";
CREATE POLICY "visited_region_select_own"
ON public."VisitedRegion"
FOR SELECT
TO authenticated
USING ("userId" = auth.uid()::text);

-- VisitedRegion INSERT
DROP POLICY IF EXISTS "visited_region_insert_own" ON public."VisitedRegion";
CREATE POLICY "visited_region_insert_own"
ON public."VisitedRegion"
FOR INSERT
TO authenticated
WITH CHECK ("userId" = auth.uid()::text);

-- VisitedRegion UPDATE
DROP POLICY IF EXISTS "visited_region_update_own" ON public."VisitedRegion";
CREATE POLICY "visited_region_update_own"
ON public."VisitedRegion"
FOR UPDATE
TO authenticated
USING ("userId" = auth.uid()::text)
WITH CHECK ("userId" = auth.uid()::text);

-- VisitedRegion DELETE
DROP POLICY IF EXISTS "visited_region_delete_own" ON public."VisitedRegion";
CREATE POLICY "visited_region_delete_own"
ON public."VisitedRegion"
FOR DELETE
TO authenticated
USING ("userId" = auth.uid()::text);

COMMIT;
