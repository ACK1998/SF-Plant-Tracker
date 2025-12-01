// src/data/farmLayout.js
import { FARM_OVERLAY, pixelToLngLat } from '../config/farmOverlay';
// SF4 farm layout data (generated from database)
// SF4 is at a different location, so we use direct lat/lng coordinates instead of pixel conversion
import { sf4FarmLayout } from './sf4FarmLayout';

const generateRange = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, idx) => start + idx);

const createGridFeatures = ({
  codes,
  startX,
  startY,
  columns,
  size,
  gapX = 0,
  gapY = 0,
}) => {
  const half = size / 2;
  const strideX = size + gapX;
  const strideY = size + gapY;

  return codes.map((code, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + col * strideX;
    const y = startY + row * strideY;

    return {
      code: String(code),
      label: `Plot ${code}`,
      pixel: { x, y },
      polygon: [
        { x: x - half, y: y - half },
        { x: x + half, y: y - half },
        { x: x + half, y: y + half },
        { x: x - half, y: y + half },
      ],
    };
  });
};

const domainCenter = {
  x: FARM_OVERLAY.imageSize.width / 2,
  y: FARM_OVERLAY.imageSize.height / 2,
};

const rawFeatures = {
  domains: [
    {
      key: 'sf3',
      label: 'SF3',
      aliases: ['sf3 domain', 'sf-3'],
      pixel: domainCenter,
      radiusMeters: 750,
    },
  ],
  plots: [
    ...createGridFeatures({
      codes: generateRange(1, 109),
      startX: 1800,
      startY: 4700,
      columns: 15,
      size: 220,
      gapX: 20,
      gapY: 30,
    }),
    ...createGridFeatures({
      codes: generateRange(200, 260),
      startX: 900,
      startY: 3400,
      columns: 11,
      size: 220,
      gapX: 25,
      gapY: 35,
    }),
    ...createGridFeatures({
      codes: generateRange(300, 347),
      startX: 10250,
      startY: 16000,
      columns: 12,
      size: 220,
      gapX: 25,
      gapY: 35,
    }),
  ],
};

const ensureClosedRing = (ring) => {
  if (!ring.length) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) {
    return ring;
  }
  return [...ring, first];
};

const withLngLat = {
  domains: [
    ...rawFeatures.domains.map((domain) => ({
      ...domain,
      centroid: pixelToLngLat(domain.pixel.x, domain.pixel.y),
    })),
    sf4FarmLayout.domain,
  ],
  plots: [
    ...rawFeatures.plots.map((plot) => {
      const polygonLngLat = ensureClosedRing(
        plot.polygon.map(({ x, y }) => pixelToLngLat(x, y))
      );
      return {
        ...plot,
        centroid: pixelToLngLat(plot.pixel.x, plot.pixel.y),
        polygonLngLat,
      };
    }),
    ...sf4FarmLayout.plots.map((plot) => ({
      ...plot,
      // Ensure polygon is closed
      polygonLngLat: ensureClosedRing(plot.polygonLngLat),
    })),
  ],
};

export default withLngLat;

