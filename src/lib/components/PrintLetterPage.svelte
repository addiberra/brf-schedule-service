<script lang="ts">
  import type { ApartmentLetterData } from '../models/print.js';

  interface Props {
    letter: ApartmentLetterData;
    isLast: boolean;
    sheetMarginMm: number;
    contentMarginMm: number;
    topMarginMm: number;
  }

  let { letter, isLast, sheetMarginMm, contentMarginMm, topMarginMm }: Props = $props();

  const COMPACT_LENGTH_THRESHOLD = 1150;
  const DENSE_LENGTH_THRESHOLD = 1450;

  let textDensity = $derived.by<'normal' | 'compact' | 'dense'>(() => {
    const normalizedLength = letter.renderedContent.replace(/\s+/g, ' ').trim().length;
    if (normalizedLength >= DENSE_LENGTH_THRESHOLD) return 'dense';
    if (normalizedLength >= COMPACT_LENGTH_THRESHOLD) return 'compact';
    return 'normal';
  });

  let textClassName = $derived.by(() => {
    if (textDensity === 'dense') {
      return 'text-[10.5pt] leading-[1.32]';
    }
    if (textDensity === 'compact') {
      return 'text-[11pt] leading-[1.4]';
    }
    return 'text-[12pt] leading-relaxed';
  });
</script>

<div
  class={`print-letter-page box-border break-after-page bg-white ${isLast ? 'break-after-auto' : ''}`}
  style={`width: calc(210mm - ${sheetMarginMm * 2}mm); min-height: calc(297mm - ${sheetMarginMm * 2}mm); padding: ${contentMarginMm}mm; padding-top: ${topMarginMm}mm; page-break-inside: avoid;`}
>
  <div class="h-full w-full">
    <pre class={`m-0 whitespace-pre-wrap text-black [font-family:Georgia,'Times_New_Roman',serif] ${textClassName}`}>{letter.renderedContent}</pre>
  </div>
</div>
