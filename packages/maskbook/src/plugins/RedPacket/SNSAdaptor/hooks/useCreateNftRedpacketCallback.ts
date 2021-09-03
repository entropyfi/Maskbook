import {
    useTransactionState,
    useAccount,
    useChainId,
    useGasPrice,
    useNonce,
    TransactionStateType,
    TransactionEventType,
} from '@masknet/web3-shared'
import type { TransactionReceipt } from 'web3-core'
import Web3Utils from 'web3-utils'
import { EthereumAddress } from 'wallet.ts'
import { useCallback } from 'react'
import type { NftRedPacket } from '@masknet/web3-contracts/types/NftRedPacket'
import { useNftRedPacketContract } from './useNftRedPacketContract'
import type { NonPayableTx } from '@masknet/web3-contracts/types/types'

export function useCreateNftRedpacketCallback(
    duration: number,
    message: string,
    name: string,
    contractAddress: string,
    tokenIdList: string[],
) {
    const nonce = useNonce()
    const gasPrice = useGasPrice()
    const account = useAccount()
    const chainId = useChainId()
    const [createState, setCreateState] = useTransactionState()
    const nftRedPacketContract = useNftRedPacketContract()
    const createCallback = useCallback(
        async (publicKey: string) => {
            if (!nftRedPacketContract) {
                setCreateState({
                    type: TransactionStateType.UNKNOWN,
                })
                return
            }

            if (!contractAddress || !EthereumAddress.isValid(contractAddress)) {
                setCreateState?.({
                    type: TransactionStateType.FAILED,
                    error: new Error('NFT contract is invalid'),
                })
                return
            }

            if (tokenIdList.length === 0) {
                setCreateState?.({
                    type: TransactionStateType.FAILED,
                    error: new Error('Require to send one nft token at least'),
                })
                return
            } else {
                debugger
            }

            setCreateState({
                type: TransactionStateType.WAIT_FOR_CONFIRMING,
            })

            type MethodParameters = Parameters<NftRedPacket['methods']['create_red_packet']>

            const params: MethodParameters = [
                publicKey,
                duration,
                Web3Utils.sha3(Math.random().toString())!,
                message,
                name,
                contractAddress,
                tokenIdList,
            ]

            const config = {
                from: account,
                gas: await nftRedPacketContract.methods
                    .create_red_packet(...params)
                    .estimateGas({ from: account })
                    .catch((error) => {
                        setCreateState({ type: TransactionStateType.FAILED, error })
                        throw error
                    }),
                gasPrice,
                nonce,
                chainId,
            }

            return new Promise<void>(async (resolve, reject) => {
                const promiEvent = nftRedPacketContract.methods
                    .create_red_packet(...params)
                    .send(config as NonPayableTx)
                promiEvent.on(TransactionEventType.TRANSACTION_HASH, (hash: string) => {
                    setCreateState({
                        type: TransactionStateType.WAIT_FOR_CONFIRMING,
                        hash,
                    })
                })
                promiEvent.on(TransactionEventType.RECEIPT, (receipt: TransactionReceipt) => {
                    setCreateState({
                        type: TransactionStateType.CONFIRMED,
                        no: 0,
                        receipt,
                    })
                })

                promiEvent.on(TransactionEventType.CONFIRMATION, (no: number, receipt: TransactionReceipt) => {
                    setCreateState({
                        type: TransactionStateType.CONFIRMED,
                        no,
                        receipt,
                    })
                    resolve()
                })

                promiEvent.on(TransactionEventType.ERROR, (error: Error) => {
                    setCreateState({
                        type: TransactionStateType.FAILED,
                        error,
                    })
                    reject(error)
                })
            })
        },
        [duration, message, name, contractAddress, tokenIdList, nftRedPacketContract, setCreateState, account, chainId],
    )
    const resetCallback = useCallback(() => {
        setCreateState({
            type: TransactionStateType.UNKNOWN,
        })
    }, [])

    return [createState, createCallback, resetCallback] as const
}
