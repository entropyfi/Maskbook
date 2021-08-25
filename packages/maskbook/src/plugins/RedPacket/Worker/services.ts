import type { ChainId } from '@masknet/web3-shared'
import type { RedPacketRecord } from '../types'
import * as subgraph from './apis'
import * as database from './database'

export async function discoverRedPacket(record: RedPacketRecord) {
    if (record.contract_version === 1) {
        const txid = await subgraph.getRedPacketTxid(record.id)
        if (!txid) return
        record.id = txid
    }
    database.addRedPacket(record)
}

export async function getRedPacketHistoryWithPassword(address: string, chainId: ChainId) {
    const histories = await subgraph.getRedPacketHistory(address, chainId)
    const historiesWithPassword = []
    for (const history of histories) {
        await database.updateV1ToV2(history)
        const record = await database.getRedPacket(history.txid)
        if (history.chain_id === chainId && record) {
            history.payload.password = history.password = record.password
        } else {
            history.payload.password = history.password = ''
        }
        historiesWithPassword.push(history)
    }
    return historiesWithPassword
}

export async function getNftRedPacketHistory(address: string, chainId: ChainId) {
    const histories = await subgraph.getNftRedPacketHistory(address, chainId)
    return histories
}
