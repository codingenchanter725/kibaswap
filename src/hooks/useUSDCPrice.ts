import { Currency, CurrencyAmount, Price, Token, TradeType } from '@uniswap/sdk-core'
import { DAI_OPTIMISM, USDC, USDC_ARBITRUM } from '../constants/tokens'

import { SupportedChainId } from '../constants/chains'
import { Version } from './useToggledVersion'
import { useActiveWeb3React } from './web3'
import { useBestV3TradeExactOut } from './useBestV3Trade'
import { useClientSideV3Trade } from './useBestV3ClientTrade'
import { useMemo } from 'react'
import { useV2TradeExactOut } from './useV2Trade'

// Stablecoin amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
const STABLECOIN_AMOUNT_OUT: { [chainId: number]: CurrencyAmount<Token> } = {
  [SupportedChainId.MAINNET]: CurrencyAmount.fromRawAmount(USDC, 100_000e6),
  [SupportedChainId.ARBITRUM_ONE]: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, 10_000e6),
  [SupportedChainId.OPTIMISM]: CurrencyAmount.fromRawAmount(DAI_OPTIMISM, 10_000e18),
}

export  function useUSDCPriceWithV3(currency?: Currency): Price<Currency, Token> | undefined {
  const chainId = currency?.chainId

  const amountOut = chainId ? STABLECOIN_AMOUNT_OUT[chainId] : undefined
  const stablecoin = amountOut?.currency

  // TODO(#2808): remove dependency on useBestV2Trade
  const v2USDCTrade = useV2TradeExactOut( currency,amountOut, {
    maxHops: 2,
  })
  const v3USDCTrade = useClientSideV3Trade(TradeType.EXACT_OUTPUT,  amountOut, currency)

  return useMemo(() => {
    if (!currency || !stablecoin) {
      return undefined
    }

    // handle usdc
    if (currency?.wrapped.equals(stablecoin)) {
      return new Price(stablecoin, stablecoin, '1', '1')
    }

    // use v2 price if available, v3 as fallback
    if (v2USDCTrade) {
      const { numerator, denominator } = v2USDCTrade.route.midPrice
      return new Price(currency, stablecoin, denominator, numerator)
    } else if (v3USDCTrade.trade) {
      const { numerator, denominator } = v3USDCTrade.trade.swaps[0].route.midPrice;
      return new Price(currency, stablecoin, denominator, numerator)
    }

    return undefined
  }, [currency, stablecoin, v2USDCTrade, v3USDCTrade.trade])
}


/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price<Currency, Token> | undefined {
  const chainId = currency?.chainId

  const amountOut = chainId ? STABLECOIN_AMOUNT_OUT[chainId] : undefined
  const stablecoin = amountOut?.currency

  // TODO(#2808): remove dependency on useBestV2Trade
  const v2USDCTrade = useV2TradeExactOut( currency,amountOut, {
    maxHops: 2,
  })

  return useMemo(() => {
    if (!currency || !stablecoin) {
      return undefined
    }

    // handle usdc
    if (currency?.wrapped.equals(stablecoin)) {
      return new Price(stablecoin, stablecoin, '1', '1')
    }

    // use v2 price if available, v3 as fallback
      const { numerator, denominator } = v2USDCTrade?.route?.midPrice || { numerator: null, denominator: null}
      if (numerator && denominator) return new Price(currency, stablecoin, denominator, numerator)
 

    return undefined
  }, [currency, stablecoin, v2USDCTrade])
}

export function useUSDCValue(currencyAmount: CurrencyAmount<Currency> | undefined | null) {
  const price = useUSDCPrice(currencyAmount?.currency)
  return useMemo(() => {
    if (!price || !currencyAmount) return null
    try {
      return price.quote(currencyAmount)
    } catch (error) {
      return null
    }
  }, [currencyAmount, price])
}
export function useUSDCValueV2AndV3(currencyAmount: CurrencyAmount<Currency> | undefined | null) {
  const price = useUSDCPriceWithV3(currencyAmount?.currency)

  return useMemo(() => {
    if (!price || !currencyAmount) return null
    try {
      return price.quote(currencyAmount)
    } catch (error) {
      return null
    }
  }, [currencyAmount, price])
}