import { TokenIcon } from '@masknet/shared'
import { makeStyles } from '@masknet/theme'
import { TransactionStateType, useAccount } from '@masknet/web3-shared'
import { Box, ListItem, Typography } from '@material-ui/core'
import { fill } from 'lodash-es'
import classNames from 'classnames'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import { useI18N } from '../../../utils/i18n-next-ui'
import { dateTimeFormat } from '../../ITO/assets/formatDate'
import { NftRedPacketHistory, RedPacketJSONPayload, RedPacketStatus } from '../types'
import { useAvailabilityComputed } from './hooks/useAvailabilityComputed'
import { useAvailabilityNftRedPacket } from './hooks/useAvailabilityNftRedPacket'
import { useRefundCallback } from './hooks/useRefundCallback'
import { NftList } from './NftList'

const useStyles = makeStyles()((theme) => ({
    primary: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    secondary: {
        fontSize: 12,
    },
    message: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    strong: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    span: {
        maxWidth: 350,
        display: 'inline-flex',
    },
    time: {
        fontSize: 12,
        color: theme.palette.text.secondary,
    },
    root: {
        borderRadius: 10,
        border: `solid 1px ${theme.palette.divider}`,
        marginBottom: theme.spacing(1.5),
        position: 'static !important' as any,
        height: 'auto !important',
        padding: theme.spacing(2),
    },
    box: {
        display: 'flex',
        width: '100%',
    },
    content: {
        transform: 'translateY(-4px)',
        width: '100%',
        padding: theme.spacing(0, '1rem'),
    },
    section: {
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing(2),
    },
    div: {},
    icon: {
        width: 27,
        height: 27,
    },
    title: {
        whiteSpace: 'break-spaces',
        fontWeight: 500,
        fontSize: 16,
    },
    info: {
        fontSize: 14,
        color: theme.palette.mode === 'light' ? '#5B7083' : '#c3cbd2',
    },
    actionButton: {
        height: 26,
        minHeight: 'auto',
    },
    footer: {
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: theme.spacing(2),
    },
    footerInfo: {
        fontSize: 15,
        color: theme.palette.mode === 'light' ? '#5B7083' : '#c3cbd2',
        '& strong': {
            color: theme.palette.text.primary,
        },
    },
}))

export interface NftRedPacketHistoryItemProps {
    history: NftRedPacketHistory
    onSelect: (payload: RedPacketJSONPayload) => void
}
export const NftRedPacketHistoryItem = memo<NftRedPacketHistoryItemProps>((props: NftRedPacketHistoryItemProps) => {
    const account = useAccount()
    const { history, onSelect } = props
    const { t } = useI18N()
    const { classes } = useStyles()
    const {
        computed: { canRefund, canSend, listOfStatus },
    } = useAvailabilityComputed(account, history.payload)
    const contractDetailed = useMemo(() => {
        // @ts-ignore
        return { ...history.token.contractDetailed, address: history.token.address }
        // @ts-ignore
    }, [history.token.contractDetailed, history.token.address])

    const [refundState, refundCallback, resetRefundCallback] = useRefundCallback(1, account, history.rpid)

    const onSendOrRefund = useCallback(async () => {
        if (canRefund) await refundCallback()
        if (canSend) onSelect(history.payload)
    }, [onSelect, refundCallback, canRefund, canSend, history])
    const { value: redpacketStatus, error } = useAvailabilityNftRedPacket(history.rpid, account)
    const statusList = redpacketStatus
        ? redpacketStatus.bit_status
              .split('')
              .reverse()
              .map((bit) => bit === '1')
        : fill(Array(history.token_ids.length), false)

    console.log('statusList', statusList, error)

    return (
        <ListItem className={classes.root}>
            <Box className={classes.box}>
                {/* @ts-ignore */}
                <TokenIcon
                    classes={{ icon: classes.icon }}
                    address={history.token.address}
                    name={history.token.name}
                    logoURI={history.token.logoURI}
                />
                <Box className={classes.content}>
                    <section className={classes.section}>
                        <div className={classes.div}>
                            <Typography variant="body1" className={classNames(classes.title, classes.message)}>
                                {history.message === '' ? t('plugin_red_packet_best_wishes') : history.message}
                            </Typography>
                            <Typography variant="body1" className={classNames(classes.info, classes.message)}>
                                {t('plugin_red_packet_history_duration', {
                                    startTime: dateTimeFormat(new Date(history.creation_time)),
                                    endTime: dateTimeFormat(new Date(history.creation_time + history.duration), false),
                                })}
                            </Typography>
                        </div>
                        {canRefund ||
                        canSend ||
                        listOfStatus.includes(RedPacketStatus.empty) ||
                        refundState.type === TransactionStateType.HASH ? (
                            <ActionButton
                                onClick={onSendOrRefund}
                                disabled={
                                    listOfStatus.includes(RedPacketStatus.empty) ||
                                    refundState.type === TransactionStateType.HASH
                                }
                                className={classes.actionButton}
                                variant="contained"
                                size="large">
                                {canSend
                                    ? t('plugin_red_packet_history_send')
                                    : refundState.type === TransactionStateType.HASH
                                    ? t('plugin_red_packet_refunding')
                                    : listOfStatus.includes(RedPacketStatus.empty)
                                    ? t('plugin_red_packet_empty')
                                    : t('plugin_red_packet_refund')}
                            </ActionButton>
                        ) : null}
                    </section>
                    <section>
                        <NftList contract={contractDetailed} statusList={statusList} tokenIds={history.token_ids} />
                    </section>
                    <section className={classes.footer}>
                        <Typography variant="body1" className={classes.footerInfo}>
                            <Trans
                                i18nKey="plugin_red_packet_history_claimed"
                                components={{
                                    strong: <strong />,
                                }}
                                values={{
                                    claimedShares: history.claimers.length,
                                    shares: history.shares,
                                }}
                            />
                        </Typography>
                    </section>
                </Box>
            </Box>
        </ListItem>
    )
})
