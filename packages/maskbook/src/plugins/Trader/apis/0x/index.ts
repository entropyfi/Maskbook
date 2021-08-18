import { safeUnreachable } from '@dimensiondev/kit'
import { NetworkType } from '@masknet/web3-shared'
import BigNumber from 'bignumber.js'
import { first } from 'lodash-es'
import { BIPS_BASE, ZRX_BASE_URL } from '../../constants'
import type {
    SwapErrorResponse,
    SwapQuoteRequest,
    SwapQuoteResponse,
    SwapServerErrorResponse,
    SwapValidationErrorResponse,
} from '../../types'

function resolveZRXLink(networkType: NetworkType) {
    switch (networkType) {
        case NetworkType.Binance:
            return `https://bsc.${ZRX_BASE_URL}`
        case NetworkType.Ethereum:
            return `https://${ZRX_BASE_URL}`
        case NetworkType.Polygon:
            return `https://polygon.${ZRX_BASE_URL}`
        case NetworkType.Arbitrum:
            return `https://${ZRX_BASE_URL}`
        default:
            safeUnreachable(networkType)
            return ''
    }
}

export async function swapQuote(networkType: NetworkType, request: SwapQuoteRequest) {
    const API_URL = resolveZRXLink(networkType)
    const params = new URLSearchParams()
    Object.entries(request).map(([key, value]) => {
        if (typeof value === 'string') params.set(key, value)
    })
    if (request.slippagePercentage)
        params.set('slippagePercentage', new BigNumber(request.slippagePercentage).dividedBy(BIPS_BASE).toFixed())
    if (request.buyTokenPercentageFee)
        params.set('buyTokenPercentageFee', new BigNumber(request.buyTokenPercentageFee).dividedBy(100).toFixed())
    if (request.includedSources) params.set('includedSources', request.includedSources.join())
    if (request.excludedSources) params.set('excludedSources', request.excludedSources.join())
    const response = await fetch(`${API_URL}/swap/v1/quote?${params.toString()}`)
    const response_ = (await response.json()) as SwapQuoteResponse | SwapErrorResponse

    const validationErrorResponse = response_ as SwapValidationErrorResponse
    if (validationErrorResponse.code)
        throw new Error(first(validationErrorResponse.validationErrors)?.reason ?? 'Unknown Error')

    const serverErrorResponse = response_ as SwapServerErrorResponse
    if (serverErrorResponse.reason)
        throw new Error(first(validationErrorResponse.validationErrors)?.reason || 'Unknown Error')

    const successResponse = response_ as SwapQuoteResponse
    return successResponse
}
