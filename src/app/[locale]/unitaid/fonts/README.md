# Module fonts

The host already ships Roboto, Inter and Poppins (`import { roboto, inter, poppins } from "@/fonts"`). Use them whenever possible. When the module needs another typeface:

1. Put the `.woff2` files in `files/` (one file per weight/style, max 1 MB each). Convert TTF/OTF to woff2 first; keep only the weights you use. Record family, weights and licence in `INTEGRATION.md`, section 10.
2. Declare every font in `index.ts` with `next/font/local`, at module scope:

   ```ts
   import localFont from "next/font/local";

   export const brand = localFont({
   	src: [
   		{ path: "./files/brand-400.woff2", weight: "400", style: "normal" },
   		{ path: "./files/brand-700.woff2", weight: "700", style: "normal" },
   	],
   	variable: "--font-brand",
   	display: "swap",
   });
   ```

3. Use it in the page: `import { brand } from "./fonts";` then `className={brand.className}`.

Converting TTF/OTF to woff2: `npx -y woff2-cli font.ttf` (or `woff2_compress` from the `woff2` package, or an online converter from the font vendor). Google Fonts families can be downloaded as woff2 from the font's "Download" page or from the `@fontsource` packages (copy the `.woff2` files; do not add the package as a dependency).

`npm run check:contract` enforces: font files only in `fonts/files/`, `.woff2` only, `next/font/local` only in `fonts/index.ts`, `next/font/google` never (the build has no network access). The host fonts under `src/fonts/` are protected and cannot be changed or removed.
