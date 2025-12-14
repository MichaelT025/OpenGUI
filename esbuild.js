const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const ctx = esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
  minify: !watch,
  logLevel: 'info',
}).then(ctx => {
  if (watch) {
    ctx.watch();
    console.log('Watching extension...');
  } else {
    ctx.rebuild().then(() => {
      ctx.dispose();
      console.log('Extension build complete');
    });
  }
}).catch(() => process.exit(1));
