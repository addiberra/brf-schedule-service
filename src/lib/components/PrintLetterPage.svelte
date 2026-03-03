<script lang="ts">
  import type { ApartmentLetterData } from '../models/print.js';

  interface Props {
    letter: ApartmentLetterData;
    isLast: boolean;
  }

  let { letter, isLast }: Props = $props();
</script>

<div class={`print-letter-page box-border w-[210mm] min-h-[297mm] break-after-page bg-white p-[15mm] ${isLast ? 'break-after-auto' : ''}`}>
  <div class="h-full w-full">
    <pre class="m-0 whitespace-pre-wrap text-[12pt] leading-relaxed text-black [font-family:Georgia,'Times_New_Roman',serif]">{letter.renderedContent}</pre>
  </div>
</div>
