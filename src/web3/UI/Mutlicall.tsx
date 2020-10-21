import React from 'react'
import { Box, Button } from '@material-ui/core'
import { useERC20TokenContract } from '../contracts/useERC20TokenContract'
import { useSingleContractMultipleData } from '../hooks/useMulticall'

export interface MulticallProps {}

export function Multicall(props: MulticallProps) {
    const contract = useERC20TokenContract('0x')
    const [
        singleContractMutlipleDataState,
        singleContractMutlipleDataCallback,
    ] = useSingleContractMultipleData(contract, 'balanceOf', [['0x'], ['0x']])

    console.log('DEBUG: multicall')
    console.log({
        singleContractMutlipleDataState,
    })

    return (
        <Box display="flex" flexDirection="column">
            <Button onClick={singleContractMutlipleDataCallback}>Single Contract Multiple Data</Button>
        </Box>
    )
}
