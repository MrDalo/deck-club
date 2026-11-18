// Bundles every MCP Apps view into one self-contained script per view.
// `BundledWidgetViews` inlines it into the brand HTML document at runtime.
import { build } from 'esbuild';
import { VIEW_ENTRIES } from '../src/modules/widgets/views/view-entries.ts';

const result = await build({
  entryPoints: VIEW_ENTRIES,
  outdir: 'dist/views',
  bundle: true,
  // One <script> in a sandboxed iframe: no imports, no module scope, no source maps.
  format: 'iife',
  platform: 'browser',
  target: ['chrome120', 'firefox120', 'safari17'],
  minify: true,
  legalComments: 'none',
  metafile: true,
});

for (const [file, output] of Object.entries(result.metafile.outputs))
  console.log(`${file} ${(output.bytes / 1024).toFixed(0)} kB`);
