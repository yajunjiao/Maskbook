import { useMemo } from 'react'
import type { Contract } from 'web3-eth-contract'
import type { AbiOutput } from 'web3-utils'
import { useMulticallContract } from '../contracts/useMulticallContract'
import { useAsync } from 'react-use'
import { nonFunctionalWeb3 } from '../web3'
import { decodeOutputString } from '../helpers'

function decodeAggreateReturnData(data: string[], outputAbis: AbiOutput[]) {
    return data.map((x) => {
        try {
            return {
                error: null,
                data: decodeOutputString(nonFunctionalWeb3, outputAbis, x),
            }
        } catch (error) {
            return {
                error: error as Error,
            }
        }
    })
}

//#region useMulticallCallback
interface Call {
    target: string
    callData: string
}

/**
 * The basic hook for fetching data from Multicall contract
 * @param calls
 */
export function useMulticallAggregate(calls: Call[]) {
    console.log('DEBUG: useMulticall')
    console.log(calls)

    const multicallContract = useMulticallContract()
    return useAsync(async () => {
        if (calls.length === 0) return []
        const { returnData } = await multicallContract.methods
            .aggregate(calls as { target: string; callData: string }[])
            .call()
        return returnData
    }, [calls])
}
//#endregion

export function useSingleContractMultipleData<T extends Contract, M extends keyof T['methods']>(
    contract: T,
    name: string,
    callDatas: Parameters<T['methods'][M]>[],
) {
    const calls = useMemo(
        () =>
            callDatas.map((data) => ({
                target: contract.options.address,
                callData: contract.methods[name](...data).encodeABI() as string,
            })),
        [contract, name, callDatas],
    )
    const returned = useMulticallAggregate(calls)
    const methodABI = contract.options.jsonInterface.find((x) => x.type === 'function' && x.name === name)
    return decodeAggreateReturnData(returned.value ?? [], methodABI ? methodABI.outputs ?? [] : [])
}

export function useMutlipleContractSingleData<T extends Contract, M extends keyof T['methods']>(
    contracts: T[],
    name: M,
    callData: Parameters<T['methods'][M]>,
) {
    const calls = useMemo(
        () =>
            contracts.map((contract) => ({
                target: contract.options.address,
                callData: contracts[0].methods[name](...callData).encodeABI() as string,
            })),
        [contracts, name, callData],
    )
    const returned = useMulticallAggregate(calls)
    console.log('DEBUG: useMutlipleContractSingleData')
    console.log(returned)
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
    return useMulticallAggregate(calls)
}
