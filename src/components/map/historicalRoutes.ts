import L from 'leaflet';

interface RoutePoint { lat: number; lng: number; }

interface HistoricalRoute {
    id: string;
    name: string;
    era: string;
    color: string;
    icon: string;
    points: RoutePoint[];
    durationMs: number;
    startOffset: number;
}

const ROUTES: HistoricalRoute[] = [
    {
        id: 'silk-road',
        name: 'Silk Road',
        era: '130 BCE — 1453',
        color: '#e4b660',
        icon: '🐪',
        points: [
            { lat: 34.34, lng: 108.93 },
            { lat: 40.45, lng: 90.15 },
            { lat: 40.75, lng: 72.25 },
            { lat: 39.64, lng: 66.97 },
            { lat: 35.69, lng: 51.42 },
            { lat: 33.51, lng: 36.29 },
            { lat: 41.01, lng: 28.97 },
        ],
        durationMs: 220000,
        startOffset: 0,
    },
    {
        id: 'spice-route',
        name: 'Spice Route',
        era: '1450 — 1600',
        color: '#c48a3e',
        icon: '⛵',
        points: [
            { lat: 45.44, lng: 12.33 },
            { lat: 36.40, lng: 25.45 },
            { lat: 31.20, lng: 29.91 },
            { lat: 12.78, lng: 45.03 },
            { lat: 11.26, lng: 75.78 },
            { lat: 5.42, lng: 95.37 },
            { lat: 2.19, lng: 102.25 },
        ],
        durationMs: 190000,
        startOffset: 0.35,
    },
    {
        id: 'viking',
        name: 'Viking Voyages',
        era: '793 — 1066',
        color: '#5b8bb8',
        icon: '⛵',
        points: [
            { lat: 60.39, lng: 5.32 },
            { lat: 62.00, lng: -6.78 },
            { lat: 64.14, lng: -21.94 },
            { lat: 61.22, lng: -45.25 },
            { lat: 51.57, lng: -55.53 },
        ],
        durationMs: 160000,
        startOffset: 0.6,
    },
    {
        id: 'columbus',
        name: "Columbus’ Voyage",
        era: '1492',
        color: '#a8532e',
        icon: '⛵',
        points: [
            { lat: 37.23, lng: -6.90 },
            { lat: 28.29, lng: -16.62 },
            { lat: 24.00, lng: -74.50 },
            { lat: 19.48, lng: -70.69 },
        ],
        durationMs: 140000,
        startOffset: 0.15,
    },
    {
        id: 'magellan',
        name: "Magellan’s Circumnavigation",
        era: '1519 — 1522',
        color: '#8b6bb8',
        icon: '⛵',
        points: [
            { lat: 36.78, lng: -6.35 },
            { lat: -13.00, lng: -38.50 },
            { lat: -52.40, lng: -68.62 },
            { lat: -16.50, lng: -151.75 },
            { lat: 13.50, lng: 123.00 },
        ],
        durationMs: 260000,
        startOffset: 0.45,
    },
];

function segmentLengths(points: RoutePoint[]): number[] {
    const lengths: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].lng - points[i].lng;
        const dy = points[i + 1].lat - points[i].lat;
        lengths.push(Math.sqrt(dx * dx + dy * dy));
    }
    return lengths;
}

function pointAtProgress(points: RoutePoint[], lengths: number[], total: number, t: number): RoutePoint {
    const target = t * total;
    let acc = 0;
    for (let i = 0; i < lengths.length; i++) {
        if (acc + lengths[i] >= target) {
            const local = lengths[i] === 0 ? 0 : (target - acc) / lengths[i];
            const a = points[i];
            const b = points[i + 1];
            return {
                lat: a.lat + (b.lat - a.lat) * local,
                lng: a.lng + (b.lng - a.lng) * local,
            };
        }
        acc += lengths[i];
    }
    const last = points[points.length - 1];
    return { lat: last.lat, lng: last.lng };
}

function createShipIcon(emoji: string, color: string) {
    return L.divIcon({
        className: 'historical-ship',
        html: `
            <div style="
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                filter: drop-shadow(0 0 6px ${color}) drop-shadow(0 0 2px ${color});
                animation: historical-ship-bob 3s ease-in-out infinite;
            ">${emoji}</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

export interface HistoricalRoutesHandle {
    setVisible: (visible: boolean) => void;
    detach: () => void;
}

export function attachHistoricalRoutes(map: L.Map): HistoricalRoutesHandle {
    const layerGroup = L.layerGroup().addTo(map);
    const ships: { marker: L.Marker; route: HistoricalRoute; lengths: number[]; total: number }[] = [];
    let visible = true;
    let rafId = 0;
    const startTs = performance.now();

    for (const route of ROUTES) {
        const latlngs = route.points.map(p => [p.lat, p.lng] as [number, number]);

        const polyline = L.polyline(latlngs, {
            color: route.color,
            weight: 1.5,
            opacity: 0.55,
            dashArray: '4 8',
            className: 'historical-route-line',
            interactive: true,
        }).bindTooltip(
            `<strong>${route.name}</strong><br/><span style="opacity:.65;font-size:11px;letter-spacing:.12em">${route.era}</span>`,
            { className: 'custom-tooltip', direction: 'top', sticky: true }
        );
        layerGroup.addLayer(polyline);

        const lengths = segmentLengths(route.points);
        const total = lengths.reduce((a, b) => a + b, 0);
        const initial = pointAtProgress(route.points, lengths, total, route.startOffset);

        const marker = L.marker([initial.lat, initial.lng], {
            icon: createShipIcon(route.icon, route.color),
            interactive: true,
            keyboard: false,
        }).bindTooltip(`${route.icon}  ${route.name} · ${route.era}`, {
            className: 'custom-tooltip',
            direction: 'top',
            offset: [0, -10],
        });
        layerGroup.addLayer(marker);
        ships.push({ marker, route, lengths, total });
    }

    const tick = () => {
        if (visible) {
            const elapsed = performance.now() - startTs;
            for (const s of ships) {
                const t = ((elapsed / s.route.durationMs) + s.route.startOffset) % 1;
                const pt = pointAtProgress(s.route.points, s.lengths, s.total, t);
                s.marker.setLatLng([pt.lat, pt.lng]);
            }
        }
        rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return {
        setVisible: (v: boolean) => {
            if (v === visible) return;
            visible = v;
            if (v && !map.hasLayer(layerGroup)) map.addLayer(layerGroup);
            else if (!v && map.hasLayer(layerGroup)) map.removeLayer(layerGroup);
        },
        detach: () => {
            cancelAnimationFrame(rafId);
            if (map.hasLayer(layerGroup)) map.removeLayer(layerGroup);
        },
    };
}
