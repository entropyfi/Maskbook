import { List, ListProps, ListItem, Skeleton } from '@material-ui/core'
import type { FC, HTMLProps } from 'react'
import classnames from 'classnames'
import { ERC721ContractDetailed, useERC721TokenDetailed } from '@masknet/web3-shared'
import { makeStyles } from '@masknet/theme'

const useStyles = makeStyles()({
    list: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridGap: 8,
    },
    nft: {
        display: 'flex',
        width: 120,
        height: 185,
        flexDirection: 'column',
        margin: '0 auto',
        borderRadius: 8,
        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.04)',
    },
    claimed: {
        backgroundColor: 'blue',
    },
    media: {
        height: 160,
        width: 120,
    },
    name: {
        fontSize: 12,
    },
})

interface NftItemProps extends HTMLProps<HTMLDivElement> {
    contract: ERC721ContractDetailed
    tokenId: string
    claimed?: boolean
}

export const NftItem: FC<NftItemProps> = ({ contract, tokenId, className, claimed, ...rest }) => {
    const result = useERC721TokenDetailed(contract, tokenId)
    const { classes } = useStyles()
    if (!result.value) {
        return (
            <div className={classnames(className, classes.nft)} {...rest}>
                <Skeleton height="185px" width="120px" />
            </div>
        )
    }
    const info = result.value.info
    return (
        <div className={classnames(className, classes.nft, { [classes.claimed]: claimed })} {...rest}>
            <img className={classes.media} src={info.image} width="120" height="160" alt={info.name} />
            <div className={classes.name}>{info.name}</div>
        </div>
    )
}

interface NftListProps extends ListProps {
    contract: ERC721ContractDetailed
    statusList: boolean[]
    tokenIds: string[]
}

export const NftList: FC<NftListProps> = ({ contract, statusList, tokenIds, className, ...rest }) => {
    const { classes } = useStyles()
    return (
        <List className={classnames(className, classes.list)} {...rest}>
            {tokenIds.map((tokenId, index) => (
                <ListItem key={tokenId}>
                    <NftItem contract={contract} claimed={statusList[index]} tokenId={tokenId} />
                </ListItem>
            ))}
        </List>
    )
}
