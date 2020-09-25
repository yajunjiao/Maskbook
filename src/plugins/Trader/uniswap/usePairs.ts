import { useMemo, useEffect } from 'react'
import { useAsync } from 'react-use'
import { Pair as UniswapPair, Token as UniswapToken, Pair, TokenAmount } from '@uniswap/sdk'
import { usePairContract, usePairContracts } from '../contracts/usePairContract'
import { useConstant } from '../../../web3/hooks/useConstant'
import { useBlockNumber } from '../../../web3/hooks/useBlockNumber'
import { CONSTANTS } from '../../../web3/constants'
import { useSingleContractMultipleData, useMutlipleContractSingleData } from '../../../web3/hooks/useMulticall'

function resolvePairResult<T>(result: PromiseSettledResult<T>, fallback: T) {
    return result.status === 'fulfilled' ? result.value : fallback
}

export enum PairState {
    NOT_EXISTS,
    EXISTS,
    INVALID,
}

export type TokenPair = [UniswapToken, UniswapToken]

export function useUniswapPairs(tokens: readonly TokenPair[]): [PairState, Pair] {
    const ETH_ADDRESS = useConstant(CONSTANTS, 'ETH_ADDRESS')

    const listOfAddress = useMemo(
        () =>
            tokens
                .map(([tokenA, tokenB]) =>
                    tokenA && tokenB && !tokenA.equals(tokenB) ? UniswapPair.getAddress(tokenA, tokenB) : undefined,
                )
                .filter(Boolean) as string[],
        [tokens],
    )

    // this initial address is fake we use the real address in the call() method
    const pairContracts = usePairContracts(listOfAddress)

    // auto refresh pair reserves for each block
    const blockNumber = useBlockNumber()

    type C = Parameters<typeof pairContracts[0]['methods']['getReserves']>
    const d = pairContracts[0].methods.getReserves()

    const callData = useMemo(() => [], [])
    const returned = useMutlipleContractSingleData(pairContracts, 'getReserves', callData)

    console.log('DEBUG: the final result')
    console.log(returned)

    return [PairState.NOT_EXISTS, null] as any

    // computed pairs
    // return useMemo(() => {
    //     if (multicallState.type !== MulticalStateType.SUCCEED) return []
    //     if (tokens.length !== multicallState.results.length) return []
    //     return multicallState.results.map((x, i) => {
    //         const tokenA = tokens[i][0]
    //         const tokenB = tokens[i][1]

    //         console.log('DEBUG: pair fetched')
    //         console.log({
    //             tokenA,
    //             tokenB,
    //             x,
    //         })

    //         return [PairState.NOT_EXISTS, null] as [PairState, Pair | null]
    //         // const reserves = resolvePairResult(x, undefined)
    //         // if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
    //         // if (!reserves) return [PairState.NOT_EXISTS, null]
    //         // const { 0: reserve0, 1: reserve1 } = reserves
    //         // const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
    //         // return [
    //         //     PairState.EXISTS,
    //         //     new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString())),
    //         // ]
    //     })
    // }, [tokens, multicallState])

    // get reserves for each pair
    // const { value: results = [] } = useAsync(async () => {
    //     if (!pairContract) return []
    //     return Promise.allSettled(
    //         pairAddresses.map((address) =>
    //             pairContract.methods.getReserves().call({
    //                 // the real contract address
    //                 to: address,
    //             }),
    //         ),
    //     )
    // }, [pairAddresses.join(), pairContract, blockNumber])

    // return useMemo(() => {
    //     if (tokens.length !== results.length) return []
    //     return results.map((x, i) => {
    //         const tokenA = tokens[i][0]
    //         const tokenB = tokens[i][1]
    //         const reserves = resolvePairResult(x, undefined)
    //         if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
    //         if (!reserves) return [PairState.NOT_EXISTS, null]
    //         const { 0: reserve0, 1: reserve1 } = reserves
    //         const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
    //         return [
    //             PairState.EXISTS,
    //             new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString())),
    //         ]
    //     })
    // }, [results, tokens])
}
