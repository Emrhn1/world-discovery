-- CreateEnum
CREATE TYPE "PlaceType" AS ENUM ('historical', 'nature', 'city');

-- CreateEnum
CREATE TYPE "DiscoveryType" AS ENUM ('historical_insight', 'engineering_mystery', 'cultural_shift', 'turning_point', 'hidden_detail');

-- CreateEnum
CREATE TYPE "HiddenTrigger" AS ENUM ('long_hover', 'double_click', 'chain');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video');

-- CreateTable
CREATE TABLE "Country" (
    "id" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "teaser" TEXT NOT NULL,
    "ambience" TEXT NOT NULL,
    "flag" TEXT,
    "dramaticIntro" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" VARCHAR(2) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "type" "PlaceType" NOT NULL,
    "teaser" TEXT NOT NULL,
    "shortStory" TEXT NOT NULL,
    "bullets" TEXT[],
    "ambience" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discovery" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "type" "DiscoveryType" NOT NULL,
    "isHero" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenTrigger" "HiddenTrigger",
    "chainRequires" INTEGER[],
    "positionTop" TEXT,
    "positionLeft" TEXT,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "Discovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "src" TEXT NOT NULL,
    "alt" TEXT,
    "mediaType" "MediaType" NOT NULL DEFAULT 'image',
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneHotspot" (
    "id" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "DiscoveryType",
    "positionTop" TEXT NOT NULL,
    "positionLeft" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "SceneHotspot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelinePhoto" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "era" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "src" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "chronologicalOrder" INTEGER NOT NULL,

    CONSTRAINT "TimelinePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coordsJson" JSONB NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "learned" BOOLEAN NOT NULL DEFAULT false,
    "learnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitedRegion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "regionType" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitedRegion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Country_name_idx" ON "Country"("name");

-- CreateIndex
CREATE INDEX "Place_countryId_idx" ON "Place"("countryId");

-- CreateIndex
CREATE INDEX "Place_type_idx" ON "Place"("type");

-- CreateIndex
CREATE INDEX "Place_countryId_type_idx" ON "Place"("countryId", "type");

-- CreateIndex
CREATE INDEX "Discovery_placeId_idx" ON "Discovery"("placeId");

-- CreateIndex
CREATE INDEX "Discovery_type_idx" ON "Discovery"("type");

-- CreateIndex
CREATE INDEX "Discovery_isHidden_idx" ON "Discovery"("isHidden");

-- CreateIndex
CREATE INDEX "Scene_placeId_displayOrder_idx" ON "Scene"("placeId", "displayOrder");

-- CreateIndex
CREATE INDEX "SceneHotspot_sceneId_displayOrder_idx" ON "SceneHotspot"("sceneId", "displayOrder");

-- CreateIndex
CREATE INDEX "TimelinePhoto_placeId_chronologicalOrder_idx" ON "TimelinePhoto"("placeId", "chronologicalOrder");

-- CreateIndex
CREATE INDEX "TimelinePhoto_year_idx" ON "TimelinePhoto"("year");

-- CreateIndex
CREATE INDEX "Zone_placeId_displayOrder_idx" ON "Zone"("placeId", "displayOrder");

-- CreateIndex
CREATE INDEX "Media_placeId_displayOrder_idx" ON "Media"("placeId", "displayOrder");

-- CreateIndex
CREATE INDEX "UserProgress_userId_idx" ON "UserProgress"("userId");

-- CreateIndex
CREATE INDEX "UserProgress_placeId_idx" ON "UserProgress"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_placeId_key" ON "UserProgress"("userId", "placeId");

-- CreateIndex
CREATE INDEX "VisitedRegion_userId_idx" ON "VisitedRegion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitedRegion_userId_regionId_key" ON "VisitedRegion"("userId", "regionId");

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discovery" ADD CONSTRAINT "Discovery_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneHotspot" ADD CONSTRAINT "SceneHotspot_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelinePhoto" ADD CONSTRAINT "TimelinePhoto_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
