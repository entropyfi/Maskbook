import { Typography, List } from '@material-ui/core'
import { makeStyles } from '@masknet/theme'
import type { NftRedPacketJSONPayload } from '../types'
import { useAccount, useChainId } from '@masknet/web3-shared'
import { NftRedPacketHistoryItem } from './NftRedPacketHistoryItem'
import { useNftRedPacketHistory } from './hooks/useNftRedPacketHistory'
import { useEffect } from 'react'

const useStyles = makeStyles()({
    root: {
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        margin: '0 auto',
    },
    placeholder: {
        textAlign: 'center',
    },
})

interface NftRedPacketHistoryListProps {
    onSelect: (payload: NftRedPacketJSONPayload) => void
}

export function NftRedPacketHistoryList(props: NftRedPacketHistoryListProps) {
    const { onSelect } = props
    const { classes } = useStyles()
    const account = useAccount()
    const chainId = useChainId()
    const { value: histories, loading, retry } = useNftRedPacketHistory(account, chainId)

    useEffect(() => {
        retry()
    }, [chainId])

    if (loading) {
        return (
            <Typography className={classes.placeholder} color="textSecondary">
                Loading...
            </Typography>
        )
    }
    if (!histories?.length) {
        return null
    }

    return (
        <div className={classes.root}>
            <List>
                {histories.map((history) => (
                    <NftRedPacketHistoryItem key={history.rpid} history={history} onSelect={onSelect} />
                ))}
            </List>
        </div>
    )
}
