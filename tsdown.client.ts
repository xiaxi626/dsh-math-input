import type { UserConfig } from 'tsdown'

const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-runtime/client',
  '@deepseek-ai/dsh-client-ui-conversation/client',
  '@deepseek-ai/dsh-client-ui-settings/client',
  '@deepseek-ai/dsh-client-ui-input-trigger/client',
  '@deepseek-ai/dsh-api-remotes/client'
] as const

export function clientBundle(id: string, entry: string): UserConfig {
  return {
    name: `${id}/client`,
    entry: { client: entry },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    sourcemap: true,
    clean: false,
    deps: {
      neverBundle: [...CLIENT_EXTERNALS],
      alwaysBundle: (specifier: string) => (CLIENT_EXTERNALS.includes(specifier as typeof CLIENT_EXTERNALS[number]) ? undefined : true)
    },
    outputOptions: {
      entryFileNames: 'client.js',
      // The browser DSH module loader wraps this bundle in a `require`-based
      // factory and has no way to resolve separate chunk files emitted by
      // rolldown's code splitting (e.g. `core-*.cjs`). Disable code splitting
      // so every dynamic import is inlined into the single `client.js` output.
      codeSplitting: false,
      intro: 'var module = { exports: {} }; var exports = module.exports; var __origRequire = require; require = function(s) { if (s === "module") return { createRequire: function() { return __origRequire; } }; if (s === "url") return { pathToFileURL: function(p) { return { href: typeof p === "string" ? p : "", protocol: "file:" }; }, fileURLToPath: function(p) { return typeof p === "string" ? p : ""; } }; return __origRequire(s); }; var __filename = ""; var __dirname = ""; var process = { env: {} }; var Buffer = { concat: function(a){for(var t=0,i=0;i<a.length;i++)t+=a[i].length;var b=new Uint8Array(t),o=0;for(i=0;i<a.length;i++){b.set(a[i],o);o+=a[i].length;}return b;} };',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });'
    }
  }
}
