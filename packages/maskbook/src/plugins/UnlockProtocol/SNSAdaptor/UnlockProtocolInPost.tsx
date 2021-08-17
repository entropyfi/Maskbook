import type { TypedMessage } from '../../../protocols/typed-message'
import { Button } from '@material-ui/core'
import { useEffect, useState } from 'react'
import { useI18N } from '../../../utils'
import MaskbookPluginWrapper from '../../MaskbookPluginWrapper'
import { paywallUrl } from '../constants'
import { renderWithUnlockProtocolMetadata, UnlockProtocolMetadataReader } from '../helpers'
import { useAccount, useChainId } from '@masknet/web3-shared'
import { PuginUnlockProtocolRPC } from '../messages'

interface UnlockProtocolInPostProps {
    message: TypedMessage
}

export default function UnlockProtocolInPost(props: UnlockProtocolInPostProps) {
    const { t } = useI18N()
    const { message } = props
    const [content, setContent] = useState('')
    const [address, setAddress] = useState(useAccount())
    const [chain, setChain] = useState(useChainId())
    const [redirurl, setRedirurl] = useState('')

    useEffect(() => {
        const metadata = UnlockProtocolMetadataReader(props.message.meta)
        if (metadata.ok) {
            if (!!address) {
                const data: { locks: Record<string, object> } = { locks: {} }
                PuginUnlockProtocolRPC.getPurchasedLocks(address).then((res) => {
                    metadata.val.unlockLocks.forEach((locks) => {
                        res.forEach((e: { lock: string }) => {
                            if (e.lock === locks.unlocklock) {
                                const requestdata = {
                                    lock: e.lock,
                                    address: address,
                                    chain: locks.chainid,
                                    identifier: metadata.val.iv,
                                }
                                PuginUnlockProtocolRPC.getKey(requestdata)
                                    .catch((error) => {
                                        if (error.code === -1) {
                                            setContent(t('plugin_unlockprotocol_server_error'))
                                        }
                                    })
                                    .then((response) => {
                                        setContent(response.message)
                                        PuginUnlockProtocolRPC.decryptUnlockData(
                                            metadata.val.iv,
                                            response.post.unlockKey,
                                            metadata.val.post,
                                        ).then((content) => {
                                            setContent(content.content)
                                        })
                                    })
                            }
                        })
                        data.locks[locks.unlocklock] = { network: locks.chainid }
                    })
                    setRedirurl(paywallUrl + encodeURI(JSON.stringify(data)))
                })
            } else {
                setContent(t('plugin_unlockprotocol_connect_wallet'))
            }
        }
    }, useState(useAccount()))
    if (!!content) {
        const jsx = message
            ? renderWithUnlockProtocolMetadata(props.message.meta, (r) => {
                  return (
                      <>
                          <MaskbookPluginWrapper width={300} pluginName="Unlock Protocol">
                              {content}
                          </MaskbookPluginWrapper>
                      </>
                  )
              })
            : null

        return <>{jsx}</>
    } else if (!!redirurl) {
        const jsx = message
            ? renderWithUnlockProtocolMetadata(props.message.meta, (r) => {
                  return (
                      <MaskbookPluginWrapper width={300} pluginName="Unlock Protocol">
                          <>
                              <text>"You don't have access to this content"</text>
                              <br />
                              <Button target="_blank" href={redirurl}>
                                  Buy Lock
                              </Button>
                          </>
                      </MaskbookPluginWrapper>
                  )
              })
            : null

        return <>{jsx}</>
    } else {
        const jsx = message
            ? renderWithUnlockProtocolMetadata(props.message.meta, (r) => {
                  return (
                      <MaskbookPluginWrapper width={300} pluginName="Unlock Protocol">
                          <>
                              <text>"Loading..."</text>
                              <br />
                          </>
                      </MaskbookPluginWrapper>
                  )
              })
            : null

        return <>{jsx}</>
    }
}
