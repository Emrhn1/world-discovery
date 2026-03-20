import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const countriesDir = path.join(root, 'data', 'countries');
const placesDir = path.join(root, 'data', 'places');

const discoveryTypeMap = {
  'historical-insight': 'historical_insight',
  'engineering-mystery': 'engineering_mystery',
  'cultural-shift': 'cultural_shift',
  'turning-point': 'turning_point',
  'hidden-detail': 'hidden_detail',
};

const hiddenTriggerMap = {
  'long-hover': 'long_hover',
  'double-click': 'double_click',
  chain: 'chain',
};

const placeTypeMap = {
  historical: 'historical',
  nature: 'nature',
  city: 'city',
};

const mediaTypeMap = {
  image: 'image',
  video: 'video',
};

async function readJsonFiles(dirPath) {
  const files = await fs.readdir(dirPath);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));
  const data = [];

  for (const file of jsonFiles) {
    const full = path.join(dirPath, file);
    const text = await fs.readFile(full, 'utf8');
    data.push(JSON.parse(text));
  }

  return data;
}

async function seedCountries(countries) {
  for (const c of countries) {
    await prisma.country.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        name: c.name,
        latitude: c.coords?.[0] ?? 0,
        longitude: c.coords?.[1] ?? 0,
        teaser: c.teaser ?? '',
        ambience: c.ambience ?? 'default',
        flag: c.flag ?? null,
        dramaticIntro: c.dramaticIntro ?? '',
      },
      update: {
        name: c.name,
        latitude: c.coords?.[0] ?? 0,
        longitude: c.coords?.[1] ?? 0,
        teaser: c.teaser ?? '',
        ambience: c.ambience ?? 'default',
        flag: c.flag ?? null,
        dramaticIntro: c.dramaticIntro ?? '',
      },
    });
  }
}

async function seedPlaces(places) {
  for (const p of places) {
    await prisma.place.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        name: p.name,
        countryId: p.countryId,
        latitude: p.coords?.[0] ?? 0,
        longitude: p.coords?.[1] ?? 0,
        type: placeTypeMap[p.type] ?? 'historical',
        teaser: p.teaser ?? '',
        shortStory: p.shortStory ?? '',
        bullets: Array.isArray(p.bullets) ? p.bullets : [],
        ambience: p.ambience ?? null,
      },
      update: {
        name: p.name,
        countryId: p.countryId,
        latitude: p.coords?.[0] ?? 0,
        longitude: p.coords?.[1] ?? 0,
        type: placeTypeMap[p.type] ?? 'historical',
        teaser: p.teaser ?? '',
        shortStory: p.shortStory ?? '',
        bullets: Array.isArray(p.bullets) ? p.bullets : [],
        ambience: p.ambience ?? null,
      },
    });

    await prisma.discovery.deleteMany({ where: { placeId: p.id } });
    await prisma.sceneHotspot.deleteMany({ where: { scene: { placeId: p.id } } });
    await prisma.scene.deleteMany({ where: { placeId: p.id } });
    await prisma.timelinePhoto.deleteMany({ where: { placeId: p.id } });
    await prisma.zone.deleteMany({ where: { placeId: p.id } });
    await prisma.media.deleteMany({ where: { placeId: p.id } });

    if (Array.isArray(p.discoveries)) {
      for (let i = 0; i < p.discoveries.length; i += 1) {
        const d = p.discoveries[i];
        await prisma.discovery.create({
          data: {
            id: `${p.id}-disc-${i}`,
            placeId: p.id,
            hook: d.hook ?? '',
            story: d.story ?? '',
            type: discoveryTypeMap[d.type] ?? 'historical_insight',
            isHero: Boolean(d.isHero),
            isHidden: Boolean(d.isHidden),
            hiddenTrigger: d.hiddenTrigger ? (hiddenTriggerMap[d.hiddenTrigger] ?? null) : null,
            chainRequires: Array.isArray(d.chainRequires) ? d.chainRequires : [],
            positionTop: d.position?.top ?? null,
            positionLeft: d.position?.left ?? null,
            displayOrder: i,
          },
        });
      }
    }

    if (Array.isArray(p.scenes)) {
      for (let i = 0; i < p.scenes.length; i += 1) {
        const s = p.scenes[i];
        await prisma.scene.create({
          data: {
            id: `${p.id}-scene-${s.id ?? i}`,
            placeId: p.id,
            title: s.title ?? `Scene ${i + 1}`,
            description: s.description ?? null,
            src: s.src ?? '',
            alt: s.alt ?? null,
            mediaType: mediaTypeMap[s.mediaType] ?? 'image',
            displayOrder: i,
          },
        });

        if (Array.isArray(s.hotspots)) {
          for (let j = 0; j < s.hotspots.length; j += 1) {
            const h = s.hotspots[j];
            await prisma.sceneHotspot.create({
              data: {
                id: `${p.id}-scene-${s.id ?? i}-hotspot-${h.id ?? j}`,
                sceneId: `${p.id}-scene-${s.id ?? i}`,
                icon: h.icon ?? '',
                title: h.title ?? `Hotspot ${j + 1}`,
                description: h.description ?? '',
                type: h.type ? (discoveryTypeMap[h.type] ?? null) : null,
                positionTop: h.position?.top ?? '50%',
                positionLeft: h.position?.left ?? '50%',
                displayOrder: j,
              },
            });
          }
        }
      }
    }

    if (Array.isArray(p.timelinePhotos)) {
      for (let i = 0; i < p.timelinePhotos.length; i += 1) {
        const t = p.timelinePhotos[i];
        await prisma.timelinePhoto.create({
          data: {
            id: `${p.id}-timeline-${i}`,
            placeId: p.id,
            era: t.era ?? `Era ${i + 1}`,
            year: Number(t.year ?? 0),
            src: t.src ?? '',
            description: t.description ?? '',
            chronologicalOrder: i,
          },
        });
      }
    }

    if (Array.isArray(p.zones)) {
      for (let i = 0; i < p.zones.length; i += 1) {
        const z = p.zones[i];
        await prisma.zone.create({
          data: {
            id: `${p.id}-zone-${i}`,
            placeId: p.id,
            name: z.name ?? `Zone ${i + 1}`,
            coordsJson: Array.isArray(z.coords) ? z.coords : [],
            color: z.color ?? null,
            description: z.description ?? null,
            displayOrder: i,
          },
        });
      }
    }

    if (Array.isArray(p.media)) {
      for (let i = 0; i < p.media.length; i += 1) {
        const m = p.media[i];
        await prisma.media.create({
          data: {
            id: `${p.id}-media-${i}`,
            placeId: p.id,
            type: mediaTypeMap[m.type] ?? 'image',
            src: m.src ?? '',
            alt: m.alt ?? null,
            displayOrder: i,
          },
        });
      }
    }
  }
}

async function main() {
  const countries = await readJsonFiles(countriesDir);
  const places = await readJsonFiles(placesDir);

  await seedCountries(countries);
  await seedPlaces(places);

  console.log(`Seed complete: ${countries.length} countries, ${places.length} places.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
