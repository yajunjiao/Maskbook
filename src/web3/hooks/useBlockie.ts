import * as EthereumBlockie from 'ethereum-blockies'
import { useMemo } from 'react'

export function useBlockie(address: string) {
    return useMemo(() => {
        try {
            return EthereumBlockie.create({
                seed: address,
            }).toDataURL()
        } catch (e) {
            return ''
        }
    }, [address])
}
