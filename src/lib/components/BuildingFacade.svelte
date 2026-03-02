<script lang="ts">
  import type { BuildingConfig, Apartment } from '../models/building.js';

  interface Props {
    config: BuildingConfig;
    apartments: Apartment[];
  }

  let { config, apartments }: Props = $props();

  const APARTMENT_WIDTH = 60;
  const APARTMENT_HEIGHT = 50;
  const FLOOR_PADDING = 10;
  const WALL_PADDING = 20;
  const ROOF_HEIGHT = 40;

  let maxApartments = $derived(
    Math.max(...config.floors.map((f) => f.apartmentCount), 1)
  );

  let svgWidth = $derived(maxApartments * APARTMENT_WIDTH + 2 * WALL_PADDING);
  let svgHeight = $derived(
    config.floorCount * (APARTMENT_HEIGHT + FLOOR_PADDING) + ROOF_HEIGHT + WALL_PADDING
  );

  /** Get the Y position for a floor (floors rendered bottom-up, floor 1 at bottom) */
  function floorY(floorNumber: number): number {
    return (
      ROOF_HEIGHT +
      (config.floorCount - floorNumber) * (APARTMENT_HEIGHT + FLOOR_PADDING)
    );
  }

  /** Get the X position for an apartment on a floor (centered) */
  function apartmentX(floor: number, position: number): number {
    const floorConfig = config.floors.find((f) => f.floorNumber === floor);
    const count = floorConfig?.apartmentCount ?? 1;
    const totalFloorWidth = count * APARTMENT_WIDTH;
    const offsetX = (svgWidth - totalFloorWidth) / 2;
    return offsetX + (position - 1) * APARTMENT_WIDTH;
  }

  /** Get roof polygon points */
  let roofPoints = $derived(() => {
    const leftX = WALL_PADDING;
    const rightX = svgWidth - WALL_PADDING;
    const peakX = svgWidth / 2;
    const baseY = ROOF_HEIGHT;
    const peakY = 5;
    return `${leftX},${baseY} ${peakX},${peakY} ${rightX},${baseY}`;
  });
</script>

<svg
  viewBox="0 0 {svgWidth} {svgHeight}"
  width="100%"
  role="img"
  aria-label="Fasadillustration av byggnaden"
>
  <!-- Roof -->
  <polygon
    points={roofPoints()}
    fill="#8b6f47"
    stroke="#5c4a30"
    stroke-width="1.5"
  />

  <!-- Building walls -->
  <rect
    x={WALL_PADDING}
    y={ROOF_HEIGHT}
    width={svgWidth - 2 * WALL_PADDING}
    height={svgHeight - ROOF_HEIGHT - WALL_PADDING / 2}
    fill="#f0e6d3"
    stroke="#8b7355"
    stroke-width="1.5"
  />

  <!-- Floors and apartments -->
  {#each config.floors as floor}
    {#each { length: floor.apartmentCount } as _, pos}
      {@const apt = apartments.find(
        (a) => a.floor === floor.floorNumber && a.position === pos + 1
      )}
      {@const x = apartmentX(floor.floorNumber, pos + 1)}
      {@const y = floorY(floor.floorNumber)}

      <!-- Apartment window -->
      <rect
        {x}
        {y}
        width={APARTMENT_WIDTH - 4}
        height={APARTMENT_HEIGHT - 4}
        rx="2"
        fill="#d4e6f1"
        stroke="#2c3e50"
        stroke-width="1"
      />

      <!-- Window cross -->
      <line
        x1={x + (APARTMENT_WIDTH - 4) / 2}
        y1={y}
        x2={x + (APARTMENT_WIDTH - 4) / 2}
        y2={y + APARTMENT_HEIGHT - 4}
        stroke="#2c3e50"
        stroke-width="0.5"
      />
      <line
        x1={x}
        y1={y + (APARTMENT_HEIGHT - 4) / 2}
        x2={x + APARTMENT_WIDTH - 4}
        y2={y + (APARTMENT_HEIGHT - 4) / 2}
        stroke="#2c3e50"
        stroke-width="0.5"
      />

      <!-- Apartment label -->
      {#if apt}
        <text
          x={x + (APARTMENT_WIDTH - 4) / 2}
          y={y + APARTMENT_HEIGHT - 10}
          text-anchor="middle"
          font-size="10"
          fill="#2c3e50"
          font-weight="500"
        >
          {apt.id}
        </text>
      {/if}
    {/each}
  {/each}
</svg>

<style>
  svg {
    max-width: 100%;
    height: auto;
    display: block;
  }
</style>
