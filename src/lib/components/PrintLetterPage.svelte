<script lang="ts">
  import type { ApartmentLetterData } from '../models/print.js';

  interface Props {
    letter: ApartmentLetterData;
    isLast: boolean;
  }

  let { letter, isLast }: Props = $props();
</script>

<div class="print-letter-page" class:last-page={isLast}>
  <div class="letter-content">
    <pre class="letter-text">{letter.renderedContent}</pre>
  </div>
</div>

<style>
  .print-letter-page {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm;
    box-sizing: border-box;
    background: white;
    page-break-after: always;
    break-after: page;
  }

  .print-letter-page.last-page {
    page-break-after: auto;
    break-after: auto;
  }

  .letter-content {
    width: 100%;
    height: 100%;
  }

  .letter-text {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.6;
    margin: 0;
    color: #1a1a1a;
  }
</style>
