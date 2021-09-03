import { useEffect, useState } from 'react'
import { useChainId } from './useChainId'
import assetsPlatforms from './coingecko-asset-platforms.json'

enum Currency {
    usd = 'usd',
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
const priceCache: Record<string, CacheRecord> = Object.create(null)
const getCacheKey = (platform: string, contractAddress: string | undefined): string => {
    return `${platform}-${contractAddress ?? platform}`
}

type Refresher = (platform: string, contractAddress: string | undefined, currency: Currency) => Promise<number>

const POLLING_DELAY = 5 * 1000
function createTrackHook(initialValue: number, refresher: Refresher) {
    return function useTrack(contractAddress: string | undefined, amount: number, currency: Currency = Currency.usd) {
        const [value, setValue] = useState(initialValue)
        const chainId = useChainId()
        const platform = assetsPlatforms.find((a) => a.chain_identifier === chainId)?.id
        useEffect(() => {
            if (!platform) return
            const cacheKey = getCacheKey(platform, contractAddress)

            let timer: ReturnType<typeof setTimeout>
            const tick = async () => {
                clearTimeout(timer)
                const cached = priceCache[cacheKey]
                if (cached?.value instanceof Promise) {
                    setValue(await cached.value)
                } else {
                    if (cached.value) setValue(cached.value)
                    try {
                        const promise = refresher(platform, contractAddress, currency).then((result) => {
                            priceCache[cacheKey] = {
                                timestamp: Date.now(),
                                value: result,
                            }
                            setValue(result)
                            return result
                        })
                        priceCache[cacheKey] = {
                            timestamp: Date.now(),
                            value: promise,
                        }
                    } catch (error) {}
                }
                timer = setTimeout(tick, POLLING_DELAY)
            }
            tick()
            return () => clearTimeout(timer)
        }, [platform, contractAddress])

        return value * amount
    }
}

const URL_BASE = 'https://api.coingecko.com/api/v3'
export const useTokenPrice = createTrackHook(0, (platform, contractAddress, currency) => {
    const category = contractAddress ?? platform
    const requestPath = contractAddress
        ? `/simple/token_price/${platform}?contract_addresses=${contractAddress}&vs_currencies=${currency}`
        : `/simple/price?ids=${platform}&vs_currencies=${currency}`

    const promise = fetch(`${URL_BASE}${requestPath}`)
        .then((r) => r.json() as Promise<TokenRecord>)
        .then((data) => data[category][currency])
    return promise
})

export const useEtherPrice = createTrackHook(0, async () => {
    const url = `${URL_BASE}/simple/price=ethereum&vs_currencies=usd`
    const response = await fetch(url)
    const record: TokenRecord = await response.json()
    return record.ethereum.usd
})
