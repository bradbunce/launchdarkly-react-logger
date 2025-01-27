import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default {
 input: 'src/index.tsx',
 output: [
   {
     file: 'dist/index.js',
     format: 'cjs',
     sourcemap: true
   },
   {
     file: 'dist/index.esm.js',
     format: 'esm',
     sourcemap: true
   }
 ],
 plugins: [
   peerDepsExternal(),
   resolve(),
   commonjs(),
   typescript()
 ],
 external: ['react', 'react-dom', 'launchdarkly-react-client-sdk']
};