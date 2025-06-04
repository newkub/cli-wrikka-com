import { defineConfig, presetIcons, presetMini, transformerVariantGroup, presetWebFonts, transformerCompileClass } from "unocss";
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local';

export default defineConfig({
    presets: [
        presetMini(),
        presetIcons({
            collections: {
                mdi: () =>
                    import("@iconify-json/mdi/icons.json").then((i) => i.default),
            },
        }),
        presetWebFonts({
            provider: 'none',
            fonts: {
                sans: 'Roboto',
                mono: 'Fira Code',
            },
            processors: createLocalFontProcessor({
                cacheDir: 'node_modules/.cache/unocss/fonts',
                fontAssetsDir: 'public/assets/fonts',
                fontServeBaseUrl: '/assets/fonts'
            })
        }),
    ],
    transformers: [
        transformerVariantGroup(),
        transformerCompileClass()
    ],
    
});