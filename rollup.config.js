import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

const input = 'src/index.tsx';

// Peer dependencies (and their subpaths) are never bundled.
const external = [/^react(\/.*)?$/, /^react-dom(\/.*)?$/, /^@launchdarkly\/.*/];

export default [
  {
    input,
    output: [
      {
        file: './dist/index.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: './dist/index.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        // Declarations are bundled separately by rollup-plugin-dts below.
        declaration: false,
        declarationDir: undefined,
        exclude: ['**/__tests__/**', '**/*.test.*', 'src/setupTests.ts']
      }),
      terser()
    ],
    external
  },
  {
    input,
    output: { file: './dist/index.d.ts', format: 'es' },
    plugins: [dts()],
    external
  }
];
