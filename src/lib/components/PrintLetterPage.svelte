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
</script>

<div
  class={`print-letter-page box-border break-after-page bg-white ${isLast ? 'break-after-auto' : ''}`}
  style={`width: calc(210mm - ${sheetMarginMm * 2}mm); min-height: calc(297mm - ${sheetMarginMm * 2}mm); padding: ${contentMarginMm}mm; padding-top: ${topMarginMm}mm; page-break-inside: avoid;`}
>
  <div class="h-full w-full">
    <pre class="m-0 whitespace-pre-wrap text-[12pt] leading-relaxed text-black [font-family:Georgia,'Times_New_Roman',serif]">{letter.renderedContent}</pre>
  </div>
</div>
