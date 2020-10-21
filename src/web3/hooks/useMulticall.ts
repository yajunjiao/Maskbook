import { useState, useCallback, useMemo, useEffect } from 'react'
import type { Contract } from 'web3-eth-contract'
import { useMulticallContract } from '../contracts/useMulticallContract'

//#region useMulticallCallback
interface Call {
    target: string
    callData: string
}

export enum MulticalStateType {
    UNKNOWN,
    /** Wait for tx call */
    PENDING,
    /** Tx call resolved */
    SUCCEED,
    /** Tx call rejected */
    FAILED,
}

export type MulticalState =
    | {
          type: MulticalStateType.UNKNOWN
      }
    | {
          type: MulticalStateType.PENDING
      }
    | {
          type: MulticalStateType.SUCCEED
          results: string[]
      }
    | {
          type: MulticalStateType.FAILED
          error: Error
      }

/**
 * The basic hook for fetching data from Multicall contract
 * @param calls
 */
export function useMulticallCallback(calls: Call[]) {
    const multicallContract = useMulticallContract()
    const [multicallState, setMulticallState] = useState<MulticalState>({
        type: MulticalStateType.UNKNOWN,
    })
    const multicallCallback = useCallback(async () => {
        if (calls.length === 0 || !multicallContract) {
            setMulticallState({
                type: MulticalStateType.UNKNOWN,
            })
            return
        }
        try {
            setMulticallState({
                type: MulticalStateType.PENDING,
            })

            const { blockNumber, returnData } = await multicallContract.methods.aggregate(calls).call()

            console.log('DEBUG: mutli call')
            console.log({
                blockNumber,
                returnData,
            })

            setMulticallState({
                type: MulticalStateType.SUCCEED,
                results: returnData,
            })
        } catch (error) {
            setMulticallState({
                type: MulticalStateType.FAILED,
                error,
            })
        }
    }, [calls, multicallContract])
    return [multicallState, multicallCallback] as const
}
//#endregion

export function useSingleContractMultipleData<T extends Contract, M extends keyof T['methods']>(
    contract: T | null,
    name: string,
    callDatas: Parameters<T['methods'][M]>[],
) {
    const calls = useMemo(() => {
        if (!contract) return []
        return callDatas.map((data) => ({
            target: contract.options.address,
            callData: contract.methods[name](...data).encodeABI() as string,
        }))
    }, [contract, name, callDatas])
    return useMulticallCallback(calls)
}

export function useMutlipleContractSingleData<T extends Contract, M extends keyof T['methods']>(
    contracts: T[],
    name: string,
    callData: Parameters<T['methods'][M]>,
) {
    const calls = useMemo(
        () =>
            contracts.map((contract) => ({
                target: contract.options.address,
                callData: contracts[0].methods[name](callData).encodeABI() as string,
            })),
        [contracts, name, callData],
    )
    return useMulticallCallback(calls)
}

export function useMultipleContractMultipleData<T extends Contract, M extends keyof T['methods']>(
    contracts: T[],
    name: string,
    callDatas: Parameters<T['methods'][M]>,
) {
    const calls = useMemo(
        () =>
            contracts.map((contract, idx) => ({
                target: contract.options.address,
                callData: contracts[0].methods[name](callDatas[idx]).encodeABI() as string,
            })),
        [contracts, name, callDatas],
    )
    return useMulticallCallback(calls)
}
