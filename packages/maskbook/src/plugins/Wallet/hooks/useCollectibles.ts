import { ValueRef } from '@dimensiondev/holoflows-kit'
import type { ERC721TokenRecordInDatabase } from '../database/types'
import { useAsyncRetry } from 'react-use'
import { WalletRPC, WalletMessages } from '../messages'
import { ERC721TokenArrayComparer } from '../helpers'
import type { CollectibleProvider } from '../types'
import { useRef } from 'react'
import { uniqWith } from 'lodash-es'
import { createERC721Token, isSameAddress } from '../../../web3/helpers'
import type { ERC1155TokenAssetDetailed, ERC721TokenAssetDetailed } from '../../../web3/types'

//#region cache service query result
const erc721TokensRef = new ValueRef<ERC721TokenRecordInDatabase[]>([], ERC721TokenArrayComparer)

async function revalidate() {
    // erc721 tokens
    const erc721Tokens = await WalletRPC.getERC721Tokens()
    erc721TokensRef.value = erc721Tokens
}
WalletMessages.events.erc721TokensUpdated.on(revalidate)
revalidate()
//#endregion

export function useCollectibles(address: string, provider: CollectibleProvider, page: number) {
    const values = useRef<(ERC721TokenAssetDetailed | ERC1155TokenAssetDetailed)[]>([])
    return useAsyncRetry(async () => {
        if (page === 1) values.current = []

        if (!address) return []
        // a list of mock data address:
        // 0x3c6137504c38215fea30605b3e364a23c1d3e14f
        // 0x65c1b9ae4e4d8dcccfd3dc41b940840fe8570f2a
        // 0xa357a589a37cf7b6edb31b707e8ed3219c8249ac
        const result = await WalletRPC.getAssetsListNFT(
            '0x3c6137504c38215fea30605b3e364a23c1d3e14f'.toLowerCase(),
            provider,
            page,
        )
        const erc721Tokens = await WalletRPC.getERC721TokensPaged(page, 50)

        values.current.push(
            ...uniqWith(
                [
                    ...result,
                    ...erc721Tokens.map((x) =>
                        createERC721Token(x.chainId, x.tokenId, x.address, x.name, x.symbol, x.baseURI, x.tokenURI, {
                            name: x.assetName,
                            description: x.assetDescription,
                            image: x.assetImage,
                        }),
                    ),
                ],
                (a, b) => {
                    return isSameAddress(a.address, b.address) && a.tokenId === b.tokenId
                },
            ),
        )
        return values.current
    }, [address, provider, page])
}