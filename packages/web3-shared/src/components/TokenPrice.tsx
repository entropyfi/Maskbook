import { useTokenPrice } from '../hooks'

interface TokenPriceProps {
    contractAddress?: string
    amount: number
}

export const TokenPrice = ({ contractAddress, amount }: TokenPriceProps) => {
    const price = useTokenPrice(contractAddress, amount)
    return <span>${price.toFixed(2)}</span>
}
