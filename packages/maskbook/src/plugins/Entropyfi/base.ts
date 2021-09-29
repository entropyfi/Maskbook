import type { Plugin } from '@masknet/plugin-infra'
import { ChainId } from '@masknet/web3-shared'
import {
    ENTROPYFI_PLUGIN_ID,
    ENTROPYFI_PLUGIN_ICON,
    ENTROPYFI_PLUGIN_NAME,
    ENTROPYFI_PLUGIN_DESCRIPTION,
} from './constants'

export const base: Plugin.Shared.Definition = {
    ID: ENTROPYFI_PLUGIN_ID,
    icon: ENTROPYFI_PLUGIN_ICON,
    name: { fallback: ENTROPYFI_PLUGIN_NAME },
    description: { fallback: ENTROPYFI_PLUGIN_DESCRIPTION },
    publisher: { name: { fallback: 'Entropyfi' }, link: 'https://entropyfi.com/' },
    enableRequirement: {
        architecture: { app: false, web: true },
        networks: { type: 'opt-out', networks: {} },
        target: 'insider',
        web3: {
            operatingSupportedChains: [ChainId.Kovan, ChainId.Mumbai],
        },
    },

    // experimentalMark: true,
    // i18n: languages,
}
