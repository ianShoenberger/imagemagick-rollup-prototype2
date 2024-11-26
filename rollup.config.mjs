import { nodeResolve } from '@rollup/plugin-node-resolve'
// import { babel } from '@rollup/plugin-babel';
import commonjs  from '@rollup/plugin-commonjs';
import clear from 'rollup-plugin-clear'
import { wasm } from '@rollup/plugin-wasm';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/renderQueue.js',
    format: 'umd',
    name: 'RenderQueue',
    sourcemap: true,
  },
  plugins: [
    nodeResolve({ preferBuiltins: true, browser: true }),
    commonjs(),
    // babel({ babelHelpers: 'bundled' }),
    // wasm({ targetEnv: 'browser', publicPath: 'http://localhost:8080/' }), // try auto-inline
    wasm({ targetEnv: 'auto-inline' }),
    clear({ targets: ['./dist'] }),
    webWorkerLoader({ targetPlatform : 'browser', externals: []}),
  ]
};
