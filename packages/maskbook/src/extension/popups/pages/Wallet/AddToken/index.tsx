import { memo, useCallback, useMemo } from 'react'
import { Button, makeStyles, Typography } from '@material-ui/core'
import {
    Asset,
    currySameAddress,
    EthereumTokenType,
    useAssetsByTokenList,
    useERC20TokensDetailedFromTokenLists,
    useEthereumConstants,
    useWallet,
} from '@masknet/web3-shared'
import { uniqBy } from 'lodash-es'
import { EthereumAddress } from 'wallet.ts'
import { TokenList } from '@masknet/shared'
import { WalletRPC } from '../../../../../plugins/Wallet/messages'

const useStyles = makeStyles(() => ({
    header: {
        padding: '10px 16px',
        backgroundColor: '#EFF5FF',
        color: '#1C68F3',
        fontSize: 14,
        lineHeight: '20px',
    },
    content: {
        flex: 1,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        color: '#1C68F3',
        fontSize: 12,
        lineHeight: '16px',
        marginBottom: 10,
    },
    button: {
        padding: '9px 0',
        borderRadius: 20,
        fontSize: 14,
        color: '#1C68F3',
        lineHeight: '20px',
        backgroundColor: '#F7F9FA',
    },
}))

const AddToken = memo(() => {
    const classes = useStyles()
    const wallet = useWallet()
    const { ERC20_TOKEN_LISTS } = useEthereumConstants()
    const { value: erc20TokensDetailed = [], loading: erc20TokensDetailedLoading } =
        useERC20TokensDetailedFromTokenLists(ERC20_TOKEN_LISTS, '')

    const excludeTokens = Array.from(wallet?.erc20_token_whitelist ?? [])

    const filteredTokens = erc20TokensDetailed.filter(
        (token) => !excludeTokens.length || !excludeTokens.some(currySameAddress(token.address)),
    )

    const renderTokens = uniqBy(filteredTokens, (x) => x.address.toLowerCase())

    const { loading: loadingAssets, value: assets } = useAssetsByTokenList(
        renderTokens.filter((x) => EthereumAddress.isValid(x.address)),
    )

    const placeholder = useMemo(() => {
        if (erc20TokensDetailedLoading) return 'Loading token lists'
        if (loadingAssets) return 'Loading token assets'
        if (!assets.length) return 'No token found'
        return undefined
    }, [erc20TokensDetailedLoading, loadingAssets, renderTokens])

    const onSubmit = useCallback(
        async (asset: Asset) => {
            if (wallet && asset.token.type === EthereumTokenType.ERC20) {
                await Promise.all([
                    WalletRPC.addERC20Token(asset.token),
                    WalletRPC.trustERC20Token(wallet.address, asset.token),
                ])
            }
        },
        [wallet],
    )

    return (
        <>
            <div className={classes.header}>Add Token</div>
            <div className={classes.content}>
                <Typography className={classes.label}>Token</Typography>
                <TokenList onSelect={onSubmit} assets={assets} loading={loadingAssets} placeholder={placeholder} />
            </div>
            <div style={{ padding: 16 }}>
                <Button className={classes.button}>Go back</Button>
            </div>
        </>
    )
})

export default AddToken