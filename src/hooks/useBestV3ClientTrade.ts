import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Route, SwapQuoter, Route as V3Route } from '@uniswap/v3-sdk'
import useToggledVersion, { Version } from '../hooks/useToggledVersion'

import JSBI from 'jsbi'
import { SupportedChainId } from 'constants/chains'
import { Trade } from '@uniswap/router-sdk'
import { V3TradeState as TradeState } from './useBestV3Trade'
import { Route as V2Route } from '@uniswap/v2-sdk'
import { useActiveWeb3React } from './web3'
import { useAllV3Routes } from './useAllV3Routes'
import { useMemo } from 'react'
import { useSingleContractWithCallData } from 'state/multicall/hooks'
import { useV3Quoter } from './useContract'

const QUOTE_GAS_OVERRIDES: { [chainId: number]: number } = {
  [SupportedChainId.ARBITRUM_ONE]: 25_000_000,
  [SupportedChainId.ARBITRUM_RINKEBY]: 25_000_000,
}

const DEFAULT_GAS_QUOTE = 2_000_000

export class InterfaceTrade<
  TInput extends Currency,
  TOutput extends Currency,
  TTradeType extends TradeType
> extends Trade<TInput, TOutput, TTradeType> {
  gasUseEstimateUSD: CurrencyAmount<Token> | null | undefined

  constructor({
    gasUseEstimateUSD,
    ...routes
  }: {
    gasUseEstimateUSD?: CurrencyAmount<Token> | undefined | null
    v2Routes: {
      routev2: V2Route<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    v3Routes: {
      routev3: V3Route<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    tradeType: TTradeType
  }) {
    super(routes as any)
    this.gasUseEstimateUSD = gasUseEstimateUSD
  }
}
/**
 * Returns the best v3 trade for a desired swap
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useClientSideV3Trade<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): { state: TradeState; trade: InterfaceTrade<Currency, Currency, TTradeType> | undefined } {
  
  const toggledVersion = useToggledVersion()
  
  const [currencyIn, currencyOut] = useMemo(
    () => toggledVersion ==  Version.v2 ? [] :
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [tradeType, amountSpecified, otherCurrency]
  )
  const { routes, loading: routesLoading } = useAllV3Routes(currencyIn, currencyOut)

  const quoter = useV3Quoter()
  const { chainId } = useActiveWeb3React()
  const quotesResults = useSingleContractWithCallData(
    quoter,
    amountSpecified
      ? routes.map((route) => SwapQuoter.quoteCallParameters(route, amountSpecified, tradeType).calldata)
      : [],
    {
      gasRequired: chainId ? QUOTE_GAS_OVERRIDES[chainId] ?? DEFAULT_GAS_QUOTE : undefined,
    }
  )
  if (toggledVersion == Version.v2) 
  return { 
    state: TradeState.INVALID,
    trade: undefined
  };
    if (
      !amountSpecified ||
      !currencyIn ||
      !currencyOut ||
      quotesResults.some(({ valid }:{valid:boolean}) => !valid) ||
      // skip when tokens are the same
      (tradeType === TradeType.EXACT_INPUT
        ? amountSpecified.currency.equals(currencyOut)
        : amountSpecified.currency.equals(currencyIn))
    ) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
      }
    }

    if (routesLoading || quotesResults.some(({ loading }:{loading:boolean}) => loading)) {
      return {
        state: TradeState.LOADING,
        trade: undefined,
      }
    }

    const { bestRoute, amountIn, amountOut } = quotesResults.reduce(
      (
        currentBest: {
          bestRoute: Route<Currency, Currency> | null
          amountIn: CurrencyAmount<Currency> | null
          amountOut: CurrencyAmount<Currency> | null
        },
        { result },
        i
      ) => {
        if (!result) return currentBest

        // overwrite the current best if it's not defined or if this route is better
        if (tradeType === TradeType.EXACT_INPUT) {
          const amountOut = CurrencyAmount.fromRawAmount(currencyOut, result.amountOut.toString())
          if (currentBest.amountOut === null || JSBI.lessThan(currentBest.amountOut.quotient, amountOut.quotient)) {
            return {
              bestRoute: routes[i],
              amountIn: amountSpecified,
              amountOut,
            }
          }
        } else {
          const amountIn = CurrencyAmount.fromRawAmount(currencyIn, result.amountIn.toString())
          if (currentBest.amountIn === null || JSBI.greaterThan(currentBest.amountIn.quotient, amountIn.quotient)) {
            return {
              bestRoute: routes[i],
              amountIn,
              amountOut: amountSpecified,
            }
          }
        }

        return currentBest
      },
      {
        bestRoute: null,
        amountIn: null,
        amountOut: null,
      }
    )

    if (!bestRoute || !amountIn || !amountOut) {
      return {
        state: TradeState.NO_ROUTE_FOUND,
        trade: undefined,
      }
    }

    return {
      state: TradeState.VALID,
      trade: new InterfaceTrade({
        v2Routes: [],
        v3Routes: [
          {
            routev3: bestRoute,
            inputAmount: amountIn,
            outputAmount: amountOut,
          },
        ],
        tradeType,
      }),
    }
}