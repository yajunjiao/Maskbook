import React from 'react'
import type { PluginConfig } from '../plugin'
import type { PollMetaData } from './types'
import { PollMetadataReader } from './utils'
import PollsInPost from './UI/PollsInPost'
import { pluginName, identifier, POLL_META_KEY_1 } from './constants'

export const PollsPluginDefine: PluginConfig = {
    pluginName,
    identifier,
    successDecryptionInspector: function Comp(props) {
        const metadata = PollMetadataReader(props.message.meta)
        if (!metadata.ok) return null
        return <PollsInPost {...props} />
    },
    postDialogMetadataBadge: new Map([
        [POLL_META_KEY_1, (meta: PollMetaData) => `a poll of '${meta.question}' from ${meta.sender_name}`],
    ]),
}
