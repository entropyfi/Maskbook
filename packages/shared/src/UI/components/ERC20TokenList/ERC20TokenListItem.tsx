import { makeStyles, Theme } from '@material-ui/core/styles'
import { Button, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core'
import {
    Asset,
    ERC20TokenDetailed,
    formatBalance,
    FungibleTokenDetailed,
    isSameAddress,
    useWeb3Context,
} from '@masknet/web3-shared'
import { TokenIcon } from '../TokenIcon'
import type { MaskSearchableListItemProps } from '@masknet/theme'
import { some } from 'lodash-es'
import { useCallback } from 'react'

// todo: change Typography from global theme
const useStyles = makeStyles((theme: Theme) => ({
    icon: {
        width: 36,
        height: 36,
    },
    list: {
        paddingLeft: theme.spacing(1),
    },
    text: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    primary: {
        flex: 1,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        paddingRight: theme.spacing(1),
    },
    name: {
        display: 'block',
        lineHeight: '20px',
        fontSize: 14,
    },
    secondary: {
        fontSize: 14,
        textAlign: 'right',
    },
    symbol: {
        lineHeight: '20px',
        fontSize: 14,
    },
    importButton: {
        borderRadius: '30px',
    },
}))

export const getERC20TokenListItem =
    (addedTokens: FungibleTokenDetailed[], externalTokens: FungibleTokenDetailed[], account?: string) =>
    ({ data, onSelect }: MaskSearchableListItemProps<Asset>) => {
        const classes = useStyles()
        const { addERC20Token, trustERC20Token } = useWeb3Context()
        const token = data.token

        if (!token) return null
        const { address, name, symbol, logoURI } = token
        const isNotAdded = some(externalTokens, (t: any) => isSameAddress(address, t.address))
        const isAdded = some(addedTokens, (t: any) => isSameAddress(address, t.address))

        const onImport = useCallback(
            async (event: React.MouseEvent<HTMLButtonElement>) => {
                console.log(token)
                console.log(account)
                event.stopPropagation()
                if (!token || !account) return
                await Promise.all([
                    addERC20Token(token as ERC20TokenDetailed),
                    trustERC20Token(account, token as ERC20TokenDetailed),
                ])
            },
            [token, account],
        )

        const handleTokenSelect = (e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation()
            onSelect(data)
        }

        return (
            <ListItem button className={classes.list} onClick={handleTokenSelect}>
                <ListItemIcon>
                    <TokenIcon classes={{ icon: classes.icon }} address={address} name={name} logoURI={logoURI} />
                </ListItemIcon>
                <ListItemText classes={{ primary: classes.text }}>
                    <Typography className={classes.primary} color="textPrimary" component="span">
                        <span className={classes.symbol}>{symbol}</span>
                        <span className={classes.name}>
                            {name}
                            {isAdded && <span> • Added By User</span>}
                        </span>
                    </Typography>
                    <Typography className={classes.secondary} color="textSecondary" component="span">
                        {!isNotAdded ? (
                            <span>{formatBalance(data.balance, token.decimals)}</span>
                        ) : (
                            <Button className={classes.importButton} color="primary" onClick={onImport} size="small">
                                Import
                            </Button>
                        )}
                    </Typography>
                </ListItemText>
            </ListItem>
        )
    }
