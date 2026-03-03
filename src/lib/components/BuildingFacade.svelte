<script lang="ts">
  import type { BuildingConfig, Apartment } from '../models/building.js';

  interface Props {
    config: BuildingConfig;
    apartments: Apartment[];
  }

  let { config, apartments }: Props = $props();

  // Isometric projection
  const ISO_ANGLE = 30;
  const ISO_COS = Math.cos((ISO_ANGLE * Math.PI) / 180);
  const ISO_SIN = Math.sin((ISO_ANGLE * Math.PI) / 180);

  // Fixed visual dimensions - SVG scales to fit container
  const FLOOR_HEIGHT = 22;
  const BUILDING_DEPTH = 40;
  const BASE_HEIGHT = 12;
  const ROOF_HEIGHT = 6;
  const SIDE_PADDING = 8;
  const APARTMENT_WIDTH = 50;

  // Window band
  const BAND_HEIGHT = 14;
  const BAND_GAP = 4;

  let maxApartments = $derived(
    Math.max(...config.floors.map((f) => f.apartmentCount), 1)
  );
  let buildingWidth = $derived(maxApartments * APARTMENT_WIDTH + SIDE_PADDING * 2);
  let buildingHeight = $derived(config.floorCount * FLOOR_HEIGHT);
  let totalHeight = $derived(BASE_HEIGHT + buildingHeight + ROOF_HEIGHT);

  let svgWidth = $derived(buildingWidth + BUILDING_DEPTH * ISO_COS + 30);
  let svgHeight = $derived(totalHeight + BUILDING_DEPTH * ISO_SIN + 30);

  let originX = 15;
  let originY = $derived(svgHeight - 15);

  function toIso(x: number, y: number, z: number): { x: number; y: number } {
    return {
      x: originX + x + z * ISO_COS,
      y: originY - y - z * ISO_SIN,
    };
  }

  function isoPolygon(points: [number, number, number][]): string {
    return points.map((p) => {
      const iso = toIso(p[0], p[1], p[2]);
      return `${iso.x},${iso.y}`;
    }).join(' ');
  }

  function floorY(floorNumber: number): number {
    return BASE_HEIGHT + (floorNumber - 1) * FLOOR_HEIGHT + BAND_GAP;
  }
</script>

<svg
  class="mx-auto block w-full"
  viewBox="0 0 {svgWidth} {svgHeight}"
  style="min-height: {Math.min(svgHeight * 1.5, 600)}px;"
  preserveAspectRatio="xMidYMid meet"
  role="img"
  aria-label="Fasadillustration av byggnaden"
  data-testid="building-facade"
>
  <!-- Base platform top -->
  <polygon
    points={isoPolygon([
      [-6, 0, -6],
      [buildingWidth + 6, 0, -6],
      [buildingWidth + 6, 0, BUILDING_DEPTH + 6],
      [-6, 0, BUILDING_DEPTH + 6],
    ])}
    fill="#d8dee4"
  />
  <!-- Base platform front -->
  <polygon
    points={isoPolygon([
      [-6, -6, -6],
      [buildingWidth + 6, -6, -6],
      [buildingWidth + 6, 0, -6],
      [-6, 0, -6],
    ])}
    fill="#e8ecf0"
  />
  <!-- Base platform side -->
  <polygon
    points={isoPolygon([
      [buildingWidth + 6, -6, -6],
      [buildingWidth + 6, -6, BUILDING_DEPTH + 6],
      [buildingWidth + 6, 0, BUILDING_DEPTH + 6],
      [buildingWidth + 6, 0, -6],
    ])}
    fill="#c8d0d8"
  />

  <!-- Building front face -->
  <polygon
    points={isoPolygon([
      [0, 0, 0],
      [buildingWidth, 0, 0],
      [buildingWidth, buildingHeight + BASE_HEIGHT, 0],
      [0, buildingHeight + BASE_HEIGHT, 0],
    ])}
    fill="#f0f3f6"
  />

  <!-- Building right side -->
  <polygon
    points={isoPolygon([
      [buildingWidth, 0, 0],
      [buildingWidth, 0, BUILDING_DEPTH],
      [buildingWidth, buildingHeight + BASE_HEIGHT, BUILDING_DEPTH],
      [buildingWidth, buildingHeight + BASE_HEIGHT, 0],
    ])}
    fill="#dce2e8"
  />

  <!-- Roof top surface (the flat top) -->
  <polygon
    points={isoPolygon([
      [0, buildingHeight + BASE_HEIGHT + ROOF_HEIGHT, 0],
      [buildingWidth, buildingHeight + BASE_HEIGHT + ROOF_HEIGHT, 0],
      [buildingWidth, buildingHeight + BASE_HEIGHT + ROOF_HEIGHT, BUILDING_DEPTH],
      [0, buildingHeight + BASE_HEIGHT + ROOF_HEIGHT, BUILDING_DEPTH],
    ])}
    fill="#c4ccd4"
  />

  <!-- Roof front face -->
  <polygon
    points={isoPolygon([
      [0, buildingHeight + BASE_HEIGHT, 0],
      [buildingWidth, buildingHeight + BASE_HEIGHT, 0],
      [buildingWidth, buildingHeight + BASE_HEIGHT + ROOF_HEIGHT, 0],
      [0, buildingHeight + BASE_HEIGHT + ROOF_HEIGHT, 0],
    ])}
    fill="#e4e9ee"
  />

  <!-- Roof right side face -->
  <polygon
    points={isoPolygon([
      [buildingWidth, buildingHeight + BASE_HEIGHT, 0],
      [buildingWidth, buildingHeight + BASE_HEIGHT, BUILDING_DEPTH],
      [buildingWidth, buildingHeight + BASE_HEIGHT + ROOF_HEIGHT, BUILDING_DEPTH],
      [buildingWidth, buildingHeight + BASE_HEIGHT + ROOF_HEIGHT, 0],
    ])}
    fill="#d0d8e0"
  />

  <!-- Front window bands per floor -->
  {#each config.floors as floor}
    {@const bandY = floorY(floor.floorNumber)}
    <polygon
      points={isoPolygon([
        [SIDE_PADDING, bandY, 0],
        [buildingWidth - SIDE_PADDING, bandY, 0],
        [buildingWidth - SIDE_PADDING, bandY + BAND_HEIGHT, 0],
        [SIDE_PADDING, bandY + BAND_HEIGHT, 0],
      ])}
      fill="#a8b8c8"
    />
  {/each}

  <!-- Side window bands per floor -->
  {#each config.floors as floor}
    {@const bandY = floorY(floor.floorNumber)}
    <polygon
      points={isoPolygon([
        [buildingWidth, bandY, 6],
        [buildingWidth, bandY, BUILDING_DEPTH - 6],
        [buildingWidth, bandY + BAND_HEIGHT, BUILDING_DEPTH - 6],
        [buildingWidth, bandY + BAND_HEIGHT, 6],
      ])}
      fill="#8898a8"
    />
  {/each}

  <!-- Apartment labels -->
  {#each config.floors as floor}
    {@const bandY = floorY(floor.floorNumber)}
    {@const floorConfig = config.floors.find((f) => f.floorNumber === floor.floorNumber)}
    {@const count = floorConfig?.apartmentCount ?? 1}
    {@const aptWidth = (buildingWidth - SIDE_PADDING * 2) / count}
    {#each { length: count } as _, pos}
      {@const apt = apartments.find(
        (a) => a.floor === floor.floorNumber && a.position === pos + 1
      )}
      {#if apt}
        {@const labelX = SIDE_PADDING + pos * aptWidth + aptWidth / 2}
        {@const labelY = bandY + BAND_HEIGHT / 2}
        {@const labelPos = toIso(labelX, labelY, 0)}
        <text
          x={labelPos.x}
          y={labelPos.y + 1}
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="8"
          fill="#4a5a6a"
          font-weight="500"
        >
          {apt.id}
        </text>
      {/if}
    {/each}
  {/each}
</svg>
