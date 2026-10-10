-- Field outlines drawn on the satellite map (GeoJSON Polygon, [longitude, latitude]).
-- Additive only: a nullable column, so other branches on the shared database are unaffected.

-- AlterTable
ALTER TABLE "field" ADD COLUMN "boundary" JSONB;
