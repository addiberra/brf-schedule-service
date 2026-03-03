<script lang="ts">
  import type { BuildingConfig, Apartment } from '../models/building.js';

  interface Props {
    config: BuildingConfig;
    apartments: Apartment[];
  }

  let { config, apartments }: Props = $props();

  const APARTMENT_WIDTH = 70;
  const APARTMENT_HEIGHT = 55;
  const FLOOR_PADDING = 12;
  const WALL_PADDING = 30;
  const ROOF_HEIGHT = 50;
  const GROUND_HEIGHT = 35;
  const BALCONY_DEPTH = 10;
  const CHIMNEY_WIDTH = 16;
  const CHIMNEY_HEIGHT = 30;
  const DOOR_WIDTH = 40;
  const DOOR_HEIGHT = 44;

  let maxApartments = $derived(
    Math.max(...config.floors.map((f) => f.apartmentCount), 1)
  );

  let svgWidth = $derived(maxApartments * APARTMENT_WIDTH + 2 * WALL_PADDING);
  let buildingBodyHeight = $derived(
    config.floorCount * (APARTMENT_HEIGHT + FLOOR_PADDING)
  );
  let svgHeight = $derived(
    ROOF_HEIGHT + buildingBodyHeight + GROUND_HEIGHT
  );

  /** Building body top-left */
  let bodyX = $derived(WALL_PADDING);
  let bodyY = $derived(ROOF_HEIGHT);
  let bodyWidth = $derived(svgWidth - 2 * WALL_PADDING);

  /** Get the Y position for a floor (floors rendered bottom-up, floor 1 at bottom) */
  function floorY(floorNumber: number): number {
    return (
      ROOF_HEIGHT +
      (config.floorCount - floorNumber) * (APARTMENT_HEIGHT + FLOOR_PADDING) +
      FLOOR_PADDING / 2
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

  /** Roof polygon points */
  let roofPoints = $derived(() => {
    const leftX = bodyX;
    const rightX = bodyX + bodyWidth;
    const peakX = svgWidth / 2;
    const baseY = ROOF_HEIGHT;
    const peakY = 5;
    return `${leftX},${baseY} ${peakX},${peakY} ${rightX},${baseY}`;
  });

  /** Whether an apartment gets a balcony */
  function hasBalcony(floorNumber: number, position: number): boolean {
    return (floorNumber + position) % 2 === 0;
  }

  /** Window dimensions */
  const WIN_WIDTH = APARTMENT_WIDTH - 16;
  const WIN_HEIGHT = APARTMENT_HEIGHT - 18;
</script>

<svg
  class="mx-auto block h-auto w-full max-w-5xl rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-surface-0)]/80 p-2"
  viewBox="0 0 {svgWidth} {svgHeight}"
  width="100%"
  role="img"
  aria-label="Fasadillustration av byggnaden"
  data-testid="building-facade"
>
  <!-- Gradient and filter definitions -->
  <defs>
    <linearGradient id="wallGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8d5b8" />
      <stop offset="100%" stop-color="#d4b896" />
    </linearGradient>
    <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#87ceeb" />
      <stop offset="100%" stop-color="#b8dced" />
    </linearGradient>
    <linearGradient id="windowGlass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a8d4e6" />
      <stop offset="100%" stop-color="#d4e6f1" />
    </linearGradient>
    <linearGradient id="roofPattern" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8b4513" />
      <stop offset="100%" stop-color="#a0522d" />
    </linearGradient>
    <linearGradient id="groundGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a7c59" />
      <stop offset="100%" stop-color="#5a8c69" />
    </linearGradient>
    <filter id="buildingShadow">
      <feDropShadow dx="3" dy="3" stdDeviation="3" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Sky background -->
  <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#skyGradient)" />

  <!-- Ground area -->
  <rect
    x="0"
    y={svgHeight - GROUND_HEIGHT}
    width={svgWidth}
    height={GROUND_HEIGHT}
    fill="url(#groundGradient)"
  />
  <!-- Bushes -->
  <ellipse cx={bodyX - 6} cy={svgHeight - GROUND_HEIGHT + 10} rx="12" ry="8" fill="#3a6b49" />
  <ellipse cx={bodyX + bodyWidth + 8} cy={svgHeight - GROUND_HEIGHT + 12} rx="14" ry="9" fill="#3a6b49" />
  <ellipse cx={svgWidth / 2 + 20} cy={svgHeight - GROUND_HEIGHT + 14} rx="10" ry="7" fill="#3a6b49" />

  <!-- Building body -->
  <rect
    x={bodyX}
    y={bodyY}
    width={bodyWidth}
    height={buildingBodyHeight}
    fill="url(#wallGradient)"
    filter="url(#buildingShadow)"
  />

  <!-- Roof -->
  <polygon
    points={roofPoints()}
    fill="url(#roofPattern)"
    stroke="#5c3a1a"
    stroke-width="1.5"
  />
  <!-- Ridge line -->
  <line
    x1={svgWidth / 2 - bodyWidth * 0.15}
    y1={5 + (ROOF_HEIGHT - 5) * 0.3}
    x2={svgWidth / 2 + bodyWidth * 0.15}
    y2={5 + (ROOF_HEIGHT - 5) * 0.3}
    stroke="#5c3a1a"
    stroke-width="0.5"
    opacity="0.6"
  />

  <!-- Chimney -->
  <rect
    x={bodyX + bodyWidth - WALL_PADDING - CHIMNEY_WIDTH}
    y={ROOF_HEIGHT - CHIMNEY_HEIGHT}
    width={CHIMNEY_WIDTH}
    height={CHIMNEY_HEIGHT}
    fill="#8b7355"
  />
  <!-- Smoke wisps -->
  <path
    d="M {bodyX + bodyWidth - WALL_PADDING - CHIMNEY_WIDTH / 2} {ROOF_HEIGHT - CHIMNEY_HEIGHT} Q {bodyX + bodyWidth - WALL_PADDING - CHIMNEY_WIDTH / 2 - 4} {ROOF_HEIGHT - CHIMNEY_HEIGHT - 10} {bodyX + bodyWidth - WALL_PADDING - CHIMNEY_WIDTH / 2 - 2} {ROOF_HEIGHT - CHIMNEY_HEIGHT - 18}"
    fill="none"
    stroke="#ccc"
    stroke-width="1.5"
    opacity="0.5"
  />
  <path
    d="M {bodyX + bodyWidth - WALL_PADDING - CHIMNEY_WIDTH / 2 + 3} {ROOF_HEIGHT - CHIMNEY_HEIGHT} Q {bodyX + bodyWidth - WALL_PADDING - CHIMNEY_WIDTH / 2 + 7} {ROOF_HEIGHT - CHIMNEY_HEIGHT - 8} {bodyX + bodyWidth - WALL_PADDING - CHIMNEY_WIDTH / 2 + 5} {ROOF_HEIGHT - CHIMNEY_HEIGHT - 15}"
    fill="none"
    stroke="#ccc"
    stroke-width="1"
    opacity="0.5"
  />

  <!-- Floor separator lines -->
  {#each config.floors as floor}
    {#if floor.floorNumber < config.floorCount}
      <line
        x1={bodyX}
        y1={floorY(floor.floorNumber) - FLOOR_PADDING / 2}
        x2={bodyX + bodyWidth}
        y2={floorY(floor.floorNumber) - FLOOR_PADDING / 2}
        stroke="#c4a882"
        stroke-width="0.5"
        opacity="0.4"
      />
    {/if}
  {/each}

  <!-- Apartments: windows, balconies, labels -->
  {#each config.floors as floor}
    {#each { length: floor.apartmentCount } as _, pos}
      {@const apt = apartments.find(
        (a) => a.floor === floor.floorNumber && a.position === pos + 1
      )}
      {@const ax = apartmentX(floor.floorNumber, pos + 1)}
      {@const ay = floorY(floor.floorNumber)}
      {@const wx = ax + (APARTMENT_WIDTH - WIN_WIDTH) / 2}
      {@const wy = ay + (APARTMENT_HEIGHT - WIN_HEIGHT) / 2 - 2}

      <!-- Window header -->
      <rect
        x={wx - 2}
        y={wy - 3}
        width={WIN_WIDTH + 4}
        height={3}
        fill="#8b7355"
      />

      <!-- Window outer frame (dark wood) -->
      <rect
        x={wx}
        y={wy}
        width={WIN_WIDTH}
        height={WIN_HEIGHT}
        rx="1"
        fill="#5c4a30"
      />

      <!-- Window inner glass -->
      <rect
        x={wx + 2}
        y={wy + 2}
        width={WIN_WIDTH - 4}
        height={WIN_HEIGHT - 4}
        fill="url(#windowGlass)"
      />

      <!-- Window cross dividers -->
      <line
        x1={wx + WIN_WIDTH / 2}
        y1={wy + 2}
        x2={wx + WIN_WIDTH / 2}
        y2={wy + WIN_HEIGHT - 2}
        stroke="#5c4a30"
        stroke-width="0.7"
      />
      <line
        x1={wx + 2}
        y1={wy + WIN_HEIGHT / 2}
        x2={wx + WIN_WIDTH - 2}
        y2={wy + WIN_HEIGHT / 2}
        stroke="#5c4a30"
        stroke-width="0.7"
      />

      <!-- Window sill -->
      <rect
        x={wx - 2}
        y={wy + WIN_HEIGHT}
        width={WIN_WIDTH + 4}
        height={4}
        fill="#8b7355"
      />

      <!-- Balcony (conditional) -->
      {#if hasBalcony(floor.floorNumber, pos + 1)}
        <!-- Balcony platform -->
        <rect
          x={wx - 4}
          y={wy + WIN_HEIGHT + 4}
          width={WIN_WIDTH + 8}
          height={BALCONY_DEPTH}
          fill="#a09080"
          stroke="#8b7355"
          stroke-width="0.5"
        />
        <!-- Railing top bar -->
        <line
          x1={wx - 4}
          y1={wy + WIN_HEIGHT + 4}
          x2={wx + WIN_WIDTH + 4}
          y2={wy + WIN_HEIGHT + 4}
          stroke="#8b7355"
          stroke-width="1"
        />
        <!-- Railing vertical bars -->
        <line
          x1={wx}
          y1={wy + WIN_HEIGHT + 4}
          x2={wx}
          y2={wy + WIN_HEIGHT + 4 + BALCONY_DEPTH}
          stroke="#8b7355"
          stroke-width="0.5"
        />
        <line
          x1={wx + WIN_WIDTH / 2}
          y1={wy + WIN_HEIGHT + 4}
          x2={wx + WIN_WIDTH / 2}
          y2={wy + WIN_HEIGHT + 4 + BALCONY_DEPTH}
          stroke="#8b7355"
          stroke-width="0.5"
        />
        <line
          x1={wx + WIN_WIDTH}
          y1={wy + WIN_HEIGHT + 4}
          x2={wx + WIN_WIDTH}
          y2={wy + WIN_HEIGHT + 4 + BALCONY_DEPTH}
          stroke="#8b7355"
          stroke-width="0.5"
        />
      {/if}

      <!-- Apartment label -->
      {#if apt}
        <text
          x={ax + APARTMENT_WIDTH / 2}
          y={wy + WIN_HEIGHT / 2 + 3}
          text-anchor="middle"
          font-size="9"
          fill="#3c2e1a"
          font-weight="500"
        >
          {apt.id}
        </text>
      {/if}
    {/each}
  {/each}

  <!-- Entrance door (ground floor, centered) -->
  {#if config.floorCount >= 1}
    {@const doorX = svgWidth / 2 - DOOR_WIDTH / 2}
    {@const doorY = svgHeight - GROUND_HEIGHT - DOOR_HEIGHT}

    <!-- Door frame -->
    <rect
      x={doorX - 3}
      y={doorY - 3}
      width={DOOR_WIDTH + 6}
      height={DOOR_HEIGHT + 3}
      fill="#5c3a1a"
    />

    <!-- Door body -->
    <rect
      x={doorX}
      y={doorY}
      width={DOOR_WIDTH}
      height={DOOR_HEIGHT}
      fill="#8b6f47"
    />

    <!-- Door handle -->
    <circle
      cx={doorX + DOOR_WIDTH - 8}
      cy={doorY + DOOR_HEIGHT / 2}
      r="2.5"
      fill="#c0a040"
    />

    <!-- Transom window above door -->
    <rect
      x={doorX + 4}
      y={doorY - 12}
      width={DOOR_WIDTH - 8}
      height={8}
      fill="url(#windowGlass)"
      rx="1"
    />
  {/if}
</svg>
