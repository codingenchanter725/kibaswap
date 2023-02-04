import { BarChart2, Lock } from 'react-feather'
import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { ReactNode, useCallback, useState } from 'react'
import { RowBetween, RowFixed } from '../Row'
import { StyledInternalLink, TYPE } from '../../theme'
import { darken, lighten, opacify } from 'polished'

import { AutoColumn } from 'components/Column'
import { ButtonGray } from '../Button'
import CurrencyLogo from '../CurrencyLogo'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import DoubleCurrencyLogo from '../DoubleLogo'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { FiatValue } from 'components/CurrencyInputPanel/FiatValue'
import MetaMaskLogo from '../../assets/images/metamask.png'
import { Input as NumericalInput } from '../NumericalInput'
import { Pair } from '@uniswap/v2-sdk'
import React from 'react'
import Swal from 'sweetalert2'
import Tooltip from 'components/Tooltip'
import { Trans } from '@lingui/macro'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { opacity } from 'styled-system'
import styled from 'styled-components/macro'
import { useActiveWeb3React } from '../../hooks/web3'
import useAddTokenToMetamask from 'hooks/useAddTokenToMetamask'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import useTheme from '../../hooks/useTheme'

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '5px')};
  background-color: ${({ theme, hideInput }) => (hideInput ? 'transparent' : theme.bg6)};
  z-index: 1;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
`
const StyledLogo = styled.img`
  height: 16px;
  width: 16px;
  margin-left: 6px;
`
const FixedContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.bg0};
  opacity: 0.95;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`

const Container = styled.div<{ hideInput: boolean }>`
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '5px')};
  border: 1px solid ${({ theme, hideInput }) => (hideInput ? ' transparent' : ' transparent')};
  background-color: ${({ theme }) => theme.bg6};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  :focus,
  :hover {
    border: 1px solid ${({ theme, hideInput }) => (hideInput ? ' transparent' : opacify(0.5, theme.bg2))};
  }
`

const CurrencySelect = styled(ButtonGray) <{ selected: boolean; hideInput?: boolean }>`
  align-items: center;
  font-size: 24px;
  font-weight: 500;
  background-color: '${({ selected, theme }) => (selected ? theme.bg6 : theme.bg6)}';
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.text4)};
  border-radius: 16px;
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  height: ${({ hideInput }) => (hideInput ? '2.8rem' : '2.8rem')};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  justify-content: space-between;
  margin-right: ${({ hideInput }) => (hideInput ? '0' : '12px')};
  :focus,
  :hover {
    background-color: ${({ selected, theme }) => (selected ? theme.bg6 : darken(0.00, theme.bg6))};
  }
`

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: ${({ selected }) => (selected ? ' 1rem 1rem 0.75rem 0.2rem' : '1rem 1rem 0.75rem 0.2rem')};
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0 1rem 0.5rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text1)};
  }
`

const FiatRow = styled(LabelRow)`
  justify-content: flex-end;
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const StyledDropDown = styled(DropDown) <{ selected: boolean }>`
  margin: 0 0.25rem 0 0.35rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.text1)};
    stroke-width: 1.5px;
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size:  ${({ active }) => (active ? '14px' : '14px')};
  font-family: ${({ active }) => (active ? 'Open Sans' : 'Open Sans')};
  font-weight: ${({ active }) => (active ? '700' : '500')};
`

const StyledBalanceMax = styled.button<{ disabled?: boolean }>`
  background-color: transparent;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  color: ${({ theme }) => theme.text1};
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  pointer-events: ${({ disabled }) => (!disabled ? 'initial' : 'none')};
  margin-left: 0.25rem;

  :focus {
    outline: none;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin-right: 0.5rem;
  `};
`

interface CurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: ReactNode
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  fiatValue?: any
  priceImpact?: Percent
  id: string
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
  showOnlyTrumpCoins?: boolean
  renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode
  locked?: boolean
}

export default function CurrencyInputPanelSmall({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  onCurrencySelect,
  currency,
  otherCurrency,
  id,
  showCommonBases,
  showCurrencyAmount,
  disableNonToken,
  renderBalance,
  fiatValue,
  priceImpact,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  locked = false,
  showOnlyTrumpCoins,
  ...rest
}: CurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const theme = useTheme()

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const { addToken, success } = useAddTokenToMetamask(currency as Currency | undefined)
  const [showMetaTip, setShowMetaTip] = React.useState(false)
  return (
    <InputPanel id={id} hideInput={hideInput} {...rest}>
      {locked && (
        <FixedContainer>
          <AutoColumn gap="sm" justify="center">
            <Lock />
            <TYPE.label fontSize="14px" textAlign="center" padding="0 14px">
              <Trans>The market price is outside your specified price range. Single-asset deposit only.</Trans>
            </TYPE.label>
          </AutoColumn>
        </FixedContainer>
      )}

      <Container hideInput={hideInput}>
        <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={!onCurrencySelect}>
          <CurrencySelect
            selected={!!currency}
            hideInput={hideInput}
            className="open-currency-select-button"
            onClick={() => {
              if (onCurrencySelect) {
                setModalOpen(true)
              }
            }}
          >
            <Aligner>
              <RowFixed>
                {pair ? (
                  <span style={{ marginRight: '0.5rem' }}>
                    <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
                  </span>
                ) : currency ? (
                  <CurrencyLogo style={{ marginRight: '0.5rem' }} currency={currency} size={'30px'} />
                ) : null}
                {pair ? (
                  <StyledTokenName className="pair-name-container" >
                    {pair?.token0.symbol}:{pair?.token1.symbol}
                  </StyledTokenName>
                ) : (
                  <StyledTokenName className="token-symbol-container" active={Boolean(currency && currency.symbol)}>
                    {(currency && currency.symbol && currency.symbol.length > 20
                      ? currency.symbol.slice(0, 4) +
                      '...' +
                      currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                      : currency?.symbol) || <Trans>Select a token</Trans>}
                  </StyledTokenName>
                )}
              </RowFixed>
              {onCurrencySelect && <StyledDropDown selected={!!currency} />}

            </Aligner>
            {!!currency && !currency.isNative && <StyledInternalLink style={{ marginLeft: 5, cursor: 'pointer' }} title={`View ${currency?.name} (${currency.symbol} Chart)`} to={`/selective-charts/${currency?.wrapped?.address}/${currency?.symbol}/${currency?.name}/${currency?.decimals}`}> <BarChart2 /> </StyledInternalLink>}
          </CurrencySelect>
          {currency && <RowFixed style={{
            marginRight: 15
          }}>

          </RowFixed>}
          {!hideInput && (
            <>
              <NumericalInput
                className="token-amount-input"
                style={{ backgroundColor: theme.bg6 }}
                value={value}
                onUserInput={(val) => {
                  onUserInput(val)
                }}
              />
            </>
          )}
        </InputRow>
        {!hideInput && !hideBalance && (
          <FiatRow>
            <RowBetween>
              {account ? (
                <RowFixed style={{ height: '14px' }}>
                  <TYPE.body
                    onClick={onMax}
                    color={theme.text2}
                    fontWeight={400}
                    fontSize={11}
                    style={{ display: 'inline', cursor: 'pointer' }}
                  >
                    {!hideBalance && currency && selectedCurrencyBalance ? (
                      renderBalance ? (
                        renderBalance(selectedCurrencyBalance)
                      ) : (
                        <Trans>
                          Balance: {formatCurrencyAmount(selectedCurrencyBalance, 4)} {currency.symbol}
                        </Trans>
                      )
                    ) : null}
                  </TYPE.body>
                  {showMaxButton && selectedCurrencyBalance ? (
                    <StyledBalanceMax onClick={onMax}>
                      <Trans>(Max)</Trans>
                    </StyledBalanceMax>
                  ) : null}
                </RowFixed>
              ) : (
                <span />
              )}
              <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} />
            </RowBetween>
          </FiatRow>
        )}
      </Container>
      {onCurrencySelect && (
        <CurrencySearchModal
          showOnlyTrumpCoins={showOnlyTrumpCoins}
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
          showCurrencyAmount={showCurrencyAmount}
          disableNonToken={disableNonToken}
        />
      )}
    </InputPanel>
  )
}