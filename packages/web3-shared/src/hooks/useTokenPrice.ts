import { useEffect, useState } from 'react'
import { useChainId } from './useChainId'
import assetsPlatforms from './coingecko-asset-platforms.json'

const POLLING_DELAY = 5 * 1000
function createTrackHook(initialValue: number, refresher: (...args: any[]) => Promise<number> | number) {
    return function useTrack(contractAddress: string | undefined, amount: number) {
        const [value, setValue] = useState(initialValue)
        const chainId = useChainId()
        const platform = assetsPlatforms.find((a) => a.chain_identifier === chainId)?.id
        useEffect(() => {
            let timer: ReturnType<typeof setTimeout>
            const tick = async () => {
                clearTimeout(timer)
                const result = await refresher(platform, contractAddress, setValue)
                setValue(result)
                timer = setTimeout(tick, POLLING_DELAY)
            }
            tick()
            return () => clearTimeout(timer)
        }, [platform, contractAddress])

        return value * amount
    }
}

interface PriceRecord {
    [currency: string]: number
}
interface TokenRecord {
    [token: string]: PriceRecord
}
interface CacheRecord {
    timestamp: number
    value: number | Promise<number>
}
const priceCache: Record<`${string}-${string}`, CacheRecord> = Object.create(null)

const API_BASE = 'https://api.coingecko.com/api/v3'
export const useTokenPrice = createTrackHook(
    0,
    (platform: string, contractAddress: string | undefined, updater: (value: number) => void) => {
        const category = contractAddress ?? platform
        const cacheKey: `${string}-${string}` = `${platform}-${category}`
        const cached = priceCache[cacheKey]
        if (cached) {
            if (cached.value instanceof Promise) {
                return cached.value
            }
            updater(cached.value)
        }
        const requestPath = contractAddress
            ? `/simple/token_price/${platform}?contract_addresses=${contractAddress}&vs_currencies=usd`
            : `/simple/price?ids=${platform}&vs_currencies=usd`

        const promise = fetch(`${API_BASE}${requestPath}`)
            .then((r) => r.json() as Promise<TokenRecord>)
            .then(
                (data) => {
                    const price = data[category].usd
                    priceCache[cacheKey] = {
                        timestamp: Date.now(),
                        value: price,
                    }
                    updater(price)
                    return price
                },
                () => {
                    delete priceCache[cacheKey]
                    return 0
                },
            )
        priceCache[cacheKey] = {
            timestamp: Date.now(),
            value: promise,
        }
        return promise
    },
)
