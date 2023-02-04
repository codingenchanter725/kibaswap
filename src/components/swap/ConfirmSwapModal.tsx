import { AlertCircle, AlertTriangle, CheckSquare, Info } from 'react-feather'
import Badge, { BadgeVariant } from 'components/Badge'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { ReactNode, useCallback, useMemo } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from '../TransactionConfirmationModal'

import Loader from 'components/Loader'
import React from 'react'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'
import { Trans } from '@lingui/macro'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { getBep20Contract } from 'utils/binance.utils'
import { getMaxes } from 'pages/HoneyPotDetector'
import { isHoneyPot } from 'hooks/isHoneyPot'
import { useContract } from 'hooks/useContract'
import { useKiba } from 'pages/Vote/VotePage'
import { useWeb3React } from '@web3-react/core'

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param args either a pair of V2 trades or a pair of V3 trades
 */
function tradeMeaningfullyDiffers(
  ...args:
    | [V2Trade<Currency, Currency, TradeType>, V2Trade<Currency, Currency, TradeType>]
    | [V3Trade<Currency, Currency, TradeType>, V3Trade<Currency, Currency, TradeType>]
): boolean {
  const [tradeA, tradeB] = args
  return (
    tradeA.tradeType !== tradeB.tradeType ||
    !tradeA.inputAmount.currency.equals(tradeB.inputAmount.currency) ||
    !tradeA.inputAmount.equalTo(tradeB.inputAmount) ||
    !tradeA.outputAmount.currency.equals(tradeB.outputAmount.currency) ||
    !tradeA.outputAmount.equalTo(tradeB.outputAmount)
  )
}

export const useContractOwner = (address: string, network: ('eth' | 'bsc') | undefined = undefined) => {
  const [owner, setOwner] = React.useState('')
  const { chainId } = useWeb3React()
  const minABIToCheckRenounced = [
    // owner
    {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [{ "name": "owner", "type": "address" }],
      "type": "function"
    },
    // decimals
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [{ "name": "", "type": "uint8" }],
      "type": "function"
    }
  ];
  const contract = useContract(address, minABIToCheckRenounced)
  React.useEffect(() => {
    if (contract) {
      try {
        if (chainId === 1) {
          if (network !== 'bsc') {
            const ownerCall = contract?.owner;
            ownerCall().then(setOwner).catch(() => setOwner(`?`));
          } else if (network === 'bsc') {
            const bscContract = getBep20Contract(address)
            const ownerCall = bscContract.owner;
            ownerCall().then(setOwner).catch(() => setOwner(`?`))
          }
        }

        if (chainId === 56) {
          if (network !== 'eth') {
            const bscContract = getBep20Contract(address)
            const ownerCall = bscContract.owner;
            ownerCall().then(setOwner).catch(() => setOwner(`?`))
          } else if (network === 'eth') {
            const ownerCall = contract?.owner;
            ownerCall().then(setOwner).catch(() => setOwner(`?`));
          }
        }
      } catch (er) {
        setOwner('N/A')
      }
    }
  }, [contract, network])
  return owner;
}

export default function ConfirmSwapModal({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
}: {
  isOpen: boolean
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
  originalTrade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  allowedSlippage: Percent
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  onDismiss: () => void
}) {
  const [isBad, setIsBad] = React.useState(false)

  const { account } = useWeb3React()
  const kibaBalance = useKiba(account)
  const isHolder = React.useMemo(() => !!kibaBalance && +kibaBalance.toFixed(0) > 0, [account, kibaBalance])

  React.useEffect(() => {
    const runCheck = async () => {
      if (trade && (trade?.inputAmount?.currency as any)?.address && trade?.outputAmount?.currency?.wrapped?.address) {
        const isBadTrade = await Promise.all([getMaxes((trade?.inputAmount?.currency as any)?.address), getMaxes((trade?.outputAmount?.currency as any)?.address)]);
        setIsBad(isBadTrade?.some((maxes) => Boolean(maxes?.IsHoneypot)));
      }
    }
    runCheck()
  }, [trade])


  const onConfirmCb = () => {
    if (isBad) {
      if (confirm('Kiba Honeypot Checker has detected one or more of the tokens you are swapping to is a honeypot. Are you sure you want to continue?')) {
        onConfirm();
      }
    } else {
      onConfirm()
    }
  }
  const showAcceptChanges = useMemo(
    () =>
      Boolean(
        (trade instanceof V2Trade &&
          originalTrade instanceof V2Trade &&
          tradeMeaningfullyDiffers(trade, originalTrade)) ||
        (trade instanceof V3Trade &&
          originalTrade instanceof V3Trade &&
          tradeMeaningfullyDiffers(trade, originalTrade))
      ),
    [originalTrade, trade]
  )

  const modalHeader = useCallback(() => {
    return trade ? (
      <><SwapModalHeader
        trade={trade}
        allowedSlippage={allowedSlippage}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
      />
        {!isHolder && <p><Info /> Did you know? If you held Kiba, every swap you made would automatically be ran thru a honey pot detector to ensure your safety.  </p>}
        {isBad && isHolder && <Badge> <AlertTriangle /> &nbsp; Kiba Honeypot Checker has detected one or more of the tokens your swapping is a honeypot!</Badge>}
      </>
    ) : null
  }, [allowedSlippage, isBad, onAcceptChanges, recipient, showAcceptChanges, trade])
  const modalBottom = useCallback(() => {
    return trade ? (
      <SwapModalFooter
        onConfirm={onConfirmCb}
        trade={trade}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
      />
    ) : null
  }, [onConfirm, showAcceptChanges, swapErrorMessage, trade])

  // text to show while loading
  const pendingText = (
    <>
      <Trans>
        Swapping {trade?.inputAmount?.toSignificant(6)} {trade?.inputAmount?.currency?.symbol} for{' '}
        {trade?.outputAmount?.toSignificant(6)} {trade?.outputAmount?.currency?.symbol}
      </Trans>

    </>
  )

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title={<Trans>Confirm Swap</Trans>}
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onDismiss, modalBottom, modalHeader, swapErrorMessage]
  )

  return (
    <>
      <TransactionConfirmationModal
        isOpen={isOpen}
        onDismiss={onDismiss}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={confirmationContent}
        pendingText={pendingText}
        currencyToAdd={trade?.outputAmount.currency}
      />
      {isBad}
    </>
  )
}
