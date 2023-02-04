import { Currency, Token } from '@uniswap/sdk-core'
import { ExtendedEther, WETH9_EXTENDED } from '../constants/tokens'
import { NEVER_RELOAD, useSingleCallResult } from '../state/multicall/hooks'
import { TOKEN_SHORTHANDS, nativeOnChain } from './Shorthands'
import { TokenAddressMap, useUnsupportedTokenList } from './../state/lists/hooks'
import { useAllLists, useCombinedActiveList, useInactiveListUrls } from '../state/lists/hooks'
import { useBytes32TokenContract, useTokenContract } from './useContract'

import { WrappedTokenInfo } from '../state/lists/wrappedTokenInfo'
import { arrayify } from 'ethers/lib/utils'
import { binanceTokens } from 'utils/binance.tokens'
import { createTokenFilterFunction } from '../components/SearchModal/filtering'
import { isAddress } from '../utils'
import { parseBytes32String } from '@ethersproject/strings'
import { supportedChainId } from 'utils/supportedChainId'
import { useActiveWeb3React } from './web3'
import { useMemo } from 'react'
import { useUserAddedTokens } from '../state/user/hooks'
import { useWeb3React } from '@web3-react/core'

// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(tokenMap: TokenAddressMap, includeUserAdded: boolean): { [address: string]: Token } {
  const { chainId } = useActiveWeb3React()
  const userAddedTokens = useUserAddedTokens()

  return useMemo(() => {
    if (!chainId) return {}

    // reduce to just tokens
    const mapWithoutUrls = Object.keys(tokenMap[chainId] ?? {}).reduce<{ [address: string]: Token }>(
      (newMap, address) => {
        newMap[address] = tokenMap[chainId][address].token
        return newMap
      },
      {}
    )

    if (includeUserAdded) {
      return (
        userAddedTokens
          // reduce into all ALL_TOKENS filtered by the current chain
          .reduce<{ [address: string]: Token }>(
            (tokenMap, token) => {
              tokenMap[token.address] = token
              return tokenMap
            },
            // must make a copy because reduce modifies the map, and we do not
            // want to make a copy in every iteration
            { ...mapWithoutUrls }
          )
      )
    }

    return mapWithoutUrls
  }, [chainId, userAddedTokens, tokenMap, includeUserAdded])
}

export function useAllTokens(): { [address: string]: Token } {
  const allTokens = useCombinedActiveList()
  return useTokensFromMap(allTokens, true)
}

export function useUnsupportedTokens(): { [address: string]: Token } {
  const unsupportedTokensMap = useUnsupportedTokenList()
  return useTokensFromMap(unsupportedTokensMap, false)
}

export function useSearchInactiveTokenLists(search: string | undefined, minResults = 10): WrappedTokenInfo[] {
  const lists = useAllLists()
  const inactiveUrls = useInactiveListUrls()
  const { chainId } = useActiveWeb3React()
  const activeTokens = useAllTokens()
  return useMemo(() => {
    if (!search || search.trim().length === 0) return []
    const tokenFilter = createTokenFilterFunction(search)
    const result: WrappedTokenInfo[] = []
    const addressSet: { [address: string]: true } = {}
    for (const url of inactiveUrls) {
      const list = lists[url].current
      if (!list) continue
      for (const tokenInfo of list.tokens) {
        if (tokenInfo.chainId === chainId && tokenFilter(tokenInfo)) {
          const wrapped: any = new WrappedTokenInfo(tokenInfo, list)
          if (!(wrapped.address in activeTokens) && !addressSet[wrapped.address]) {
            addressSet[wrapped.address] = true
            result.push(wrapped)
            if (result.length >= minResults) return result
          }
        }
      }
    }
    return result
  }, [activeTokens, chainId, inactiveUrls, lists, minResults, search])
}

export function useIsTokenActive(token: Token | undefined | null): boolean {
  const activeTokens = useAllTokens()

  if (!activeTokens || !token) {
    return false
  }

  return !!activeTokens[token.address]
}

// Check if currency is included in custom list from user storage
export function useIsUserAddedToken(currency: Currency | undefined | null): boolean {
  const userAddedTokens = useUserAddedTokens()

  if (!currency) {
    return false
  }

  return !!userAddedTokens.find((token) => currency.equals(token))
}

// parse a name or symbol from a token response
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/

function parseStringOrBytes32(str: string | undefined, bytes32: string | undefined, defaultValue: string): string {
  return str && str.length > 0
    ? str
    : // need to check for proper bytes string and valid terminator
    bytes32 && BYTES32_REGEX.test(bytes32) && arrayify(bytes32)[31] === 0
      ? parseBytes32String(bytes32)
      : defaultValue
}

// undefined if invalid or does not exist
// null if loading
// otherwise returns the token
export function useToken(tokenAddress?: string): Token | undefined | null {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  const address = isAddress(tokenAddress?.toLowerCase())

  const tokenContract = useTokenContract(address ? address : undefined, false)
  const tokenContractBytes32 = useBytes32TokenContract(address ? address : undefined, false)
  const token: Token | undefined = address ? tokens[address] : undefined

  const tokenName = useSingleCallResult(token ? undefined : tokenContract, 'name', undefined, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(
    token ? undefined : tokenContractBytes32,
    'name',
    undefined,
    NEVER_RELOAD
  )
  const symbol = useSingleCallResult(token ? undefined : tokenContract, 'symbol', undefined, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(token ? undefined : tokenContractBytes32, 'symbol', undefined, NEVER_RELOAD)
  const decimals = useSingleCallResult(token ? undefined : tokenContract, 'decimals', undefined, NEVER_RELOAD)

  return useMemo(() => {
    if (token) return token
    if (!chainId || !address) return undefined
    if (decimals.loading || symbol.loading || tokenName.loading) return null
    if (decimals.result) {
      return new Token(
        chainId,
        address,
        decimals.result[0],
        parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
        parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token')
      )
    }
    return undefined
  }, [
    address,
    chainId,
    decimals.loading,
    decimals.result,
    symbol.loading,
    symbol.result,
    symbolBytes32.result,
    token,
    tokenName.loading,
    tokenName.result,
    tokenNameBytes32.result,
    tokenAddress
  ])
}

export function useBscToken(tokenAddress?: string): Token | undefined | null {
  const { chainId } = useActiveWeb3React()
  const tokens = useAllTokens()

  const address = isAddress(tokenAddress)

  const tokenContract = useTokenContract(address || undefined, false)
  const tokenContractBytes32 = useBytes32TokenContract(address || undefined, false)
  const token: Token | undefined = address ? tokens[address] : undefined

  const tokenName = useSingleCallResult(token ? undefined : tokenContract, 'name', undefined, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(
    token ? undefined : tokenContractBytes32,
    'name',
    undefined,
    NEVER_RELOAD,
  )
  const symbol = useSingleCallResult(token ? undefined : tokenContract, 'symbol', undefined, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(token ? undefined : tokenContractBytes32, 'symbol', undefined, NEVER_RELOAD)
  const decimals = useSingleCallResult(token ? undefined : tokenContract, 'decimals', undefined, NEVER_RELOAD)

  return useMemo(() => {
    if (token) return token
    if (!chainId || !address) return undefined
    if (decimals.loading || symbol.loading || tokenName.loading) return null
    if (decimals.result) {
      return new Token(
        chainId,
        address,
        decimals.result[0],
        parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
        parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token'),
      )
    }
    return undefined
  }, [
    address,
    chainId,
    decimals.loading,
    decimals.result,
    symbol.loading,
    symbol.result,
    symbolBytes32.result,
    token,
    tokenName.loading,
    tokenName.result,
    tokenNameBytes32.result,
  ])
}
export function useBinanceCurrency(currencyId: string | undefined): Currency | null | undefined {
  const isBNB = currencyId?.toUpperCase() === 'BNB'
  const isKiba = currencyId?.toLowerCase() === '0xc3afde95b6eb9ba8553cdaea6645d45fb3a7faf5'.toLowerCase()
  const token = useBscToken(isBNB || isKiba ? undefined : currencyId)
  if (!currencyId) return
  return isBNB ? binanceTokens.bnb
    : isKiba ? new Token(56, '0xc3afde95b6eb9ba8553cdaea6645d45fb3a7faf5', 9, 'KIBA', 'Kiba Inu') : token
}


/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
 export function useTokenFromActiveNetwork(tokenAddress: string | undefined): Token | null | undefined {
  const { chainId } = useWeb3React()

  const formattedAddress = isAddress(tokenAddress)
  const tokenContract = useTokenContract(formattedAddress ? formattedAddress : undefined, false)
  const tokenContractBytes32 = useBytes32TokenContract(formattedAddress ? formattedAddress : undefined, false)

  // TODO: Fix redux-multicall so that these values do not reload.
  const tokenName = useSingleCallResult(tokenContract, 'name', undefined, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(tokenContractBytes32, 'name', undefined, NEVER_RELOAD)
  const symbol = useSingleCallResult(tokenContract, 'symbol', undefined, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(tokenContractBytes32, 'symbol', undefined, NEVER_RELOAD)
  const decimals = useSingleCallResult(tokenContract, 'decimals', undefined, NEVER_RELOAD)

  const isLoading = useMemo(
    () => decimals.loading || symbol.loading || tokenName.loading,
    [decimals.loading, symbol.loading, tokenName.loading]
  )
  const parsedDecimals = useMemo(() => decimals?.result?.[0] ?? 18, [decimals.result])

  const parsedSymbol = useMemo(
    () => parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], 'UNKNOWN'),
    [symbol.result, symbolBytes32.result]
  )
  const parsedName = useMemo(
    () => parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], 'Unknown Token'),
    [tokenName.result, tokenNameBytes32.result]
  )

  return useMemo(() => {
    // If the token is on another chain, we cannot fetch it on-chain, and it is invalid.
    if (typeof tokenAddress !== 'string' || !supportedChainId(chainId || 1) || !formattedAddress) return undefined
    if (isLoading || !chainId) return null

    return new Token(chainId, formattedAddress, parsedDecimals, parsedSymbol, parsedName)
  }, [chainId, tokenAddress, formattedAddress, isLoading, parsedDecimals, parsedSymbol, parsedName])
}


type TokenMap = { [address: string]: Token }

/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
export function useTokenFromMapOrNetwork(tokens: TokenMap, tokenAddress?: string | null): Token | null | undefined {
  const address = isAddress(tokenAddress)
  const token: Token | undefined = address ? tokens[address] : undefined
  const tokenFromNetwork = useTokenFromActiveNetwork(token ? undefined : address ? address : undefined)

  return tokenFromNetwork ?? token
}

export  function useNativeCurrency(): any | Token {
  const { chainId } = useWeb3React()
  return useMemo(
    () =>
      chainId
        ? nativeOnChain(chainId)
        : // display mainnet when not connected
          nativeOnChain(1),
    [chainId]
  )
}
/**
 * Returns a Currency from the currencyId.
 * Returns null if currency is loading or null was passed.
 * Returns undefined if currencyId is invalid or token does not exist.
 */
 export function useCurrencyFromMap(tokens: TokenMap, currencyId?: string | null): Currency | null | undefined {
  const nativeCurrency = useNativeCurrency()
  const { chainId } = useWeb3React()
  const isNative = Boolean(nativeCurrency && currencyId?.toUpperCase() === 'ETH')
  const shorthandMatchAddress = useMemo(() => {
    const chain = supportedChainId(chainId || 1)
    return chain && currencyId ? (TOKEN_SHORTHANDS as any)[currencyId.toUpperCase()]?.[chain] : undefined
  }, [chainId, currencyId])

  const token = useTokenFromMapOrNetwork(tokens, isNative ? undefined : shorthandMatchAddress ?? currencyId)

  if (currencyId === null || currencyId === undefined || !supportedChainId(chainId || 1)) return null

  // this case so we use our builtin wrapped token instead of wrapped tokens on token lists
  const wrappedNative = nativeCurrency?.wrapped
  if (wrappedNative?.address?.toUpperCase() === currencyId?.toUpperCase()) return wrappedNative

  return isNative ? nativeCurrency : token
}

export function useCurrency(currencyId?: string | null): Currency | null | undefined {
  const tokens = useAllTokens()
  const {chainId} = useActiveWeb3React()
  const mapToken = useCurrencyFromMap(tokens, currencyId)
  const ethToken = useEthereumCurrency(Boolean(chainId && chainId === 1) ? currencyId ?? undefined : undefined)
  return chainId && chainId === 1 ? ethToken ?? mapToken : mapToken
}

export function useEthereumCurrency(currencyId: string | undefined): Currency | null | undefined {
  const { chainId } = useActiveWeb3React()
  const isETH = currencyId?.toUpperCase() === 'ETH'
  const token = useToken(chainId === 1 ? (isETH ? undefined : currencyId) : undefined )
  const binanceCurrency = useBinanceCurrency(chainId === 56 ? currencyId : undefined)
  const extendedEther = useMemo(() => (chainId ? ExtendedEther.onChain(chainId) : undefined), [chainId])
  
  if (chainId === 56) return binanceCurrency
  const weth = chainId ? WETH9_EXTENDED[chainId] : undefined
  if (weth?.address?.toLowerCase() === currencyId?.toLowerCase()) return weth
  return isETH ? extendedEther : token
}
