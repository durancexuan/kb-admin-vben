import { spawnSync } from 'node:child_process';

const pnpmCommand =
  process.env.npm_execpath && process.env.npm_execpath.endsWith('.cjs')
    ? [process.execPath, process.env.npm_execpath]
    : ['pnpm'];

const steps = [
  ['exec', 'tsdown', '--no-dts'],
  [
    'exec',
    'tsc',
    '-p',
    'tsconfig.build.json',
    '--emitDeclarationOnly',
    '--declaration',
    '--outDir',
    'dist',
  ],
];

function quoteIfNeeded(s) {
  return s.includes(' ') ? `"${s}"` : s;
}

for (const args of steps) {
  const [command, ...commandArgs] = pnpmCommand;
  const cmd = quoteIfNeeded(command);
  const quotedArgs = [...commandArgs, ...args].map((arg) => quoteIfNeeded(arg));
  const result = spawnSync(cmd, quotedArgs, {
    shell: true,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
