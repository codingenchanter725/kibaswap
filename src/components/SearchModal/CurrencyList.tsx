import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import React, { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { RowBetween, RowFixed } from '../Row'

import Column from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import { FixedSizeList } from 'react-window'
import ImportRow from './ImportRow'
import { LightGreyCard } from 'components/Card'
import Loader from '../Loader'
import { MenuItem } from './styleds'
import { MouseoverTooltip } from '../Tooltip'
import QuestionHelper from 'components/QuestionHelper'
import { TYPE } from '../../theme'
import { Text } from 'rebass'
import TokenListLogo from '../../assets/svg/tokenlist.svg'
import { Trans } from '@lingui/macro'
import { WrappedTokenInfo } from '../../state/lists/wrappedTokenInfo'
import _ from 'lodash'
import { isTokenOnList } from '../../utils'
import styled from 'styled-components/macro'
import { useActiveWeb3React } from '../../hooks/web3'
import { useCombinedActiveList } from '../../state/lists/hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { useIsUserAddedToken } from '../../hooks/Tokens'
import useTheme from 'hooks/useTheme'

function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ETHER'
}

const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
  color:${props => props.theme.text1};
`

const Tag = styled.div`
  background-color: ${({ theme }) => theme.bg3};
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  border-radius: 4px;
  padding: 0.25rem 0.3rem 0.25rem 0.3rem;
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-self: flex-end;
  margin-right: 4px;
`

const FixedContentRow = styled.div`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-gap: 16px;
  align-items: center;
`

function Balance({ balance }: { balance: CurrencyAmount<Currency> }) {
  return <StyledBalanceText title={balance.toExact()}>{balance.toSignificant(4)}</StyledBalanceText>
}

const TagContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`

const TokenListLogoWrapper = styled.img`
  height: 20px;
`

function TokenTags({ currency }: { currency: Currency }) {
  if (!(currency instanceof WrappedTokenInfo)) {
    return <span />
  }

  const tags = currency.tags
  if (!tags || tags.length === 0) return <span />

  const tag = tags[0]

  return (
    <TagContainer>
      <MouseoverTooltip text={tag.description}>
        <Tag key={tag.id}>{tag.name}</Tag>
      </MouseoverTooltip>
      {tags.length > 1 ? (
        <MouseoverTooltip
          text={tags
            .slice(1)
            .map(({ name, description }) => `${name}: ${description}`)
            .join('; \n')}
        >
          <Tag>...</Tag>
        </MouseoverTooltip>
      ) : null}
    </TagContainer>
  )
}

const CurrencyRow = React.memo((props: {
  currency: Currency
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
  showCurrencyAmount?: boolean
}) =>  {
  const {  currency,
    onSelect,
    isSelected,
    otherSelected,
    style,
    showCurrencyAmount} = props;
  const { account } = useActiveWeb3React()
  const key = currencyKey(currency)
  const selectedTokenList = useCombinedActiveList()
  const isOnSelectedList = isTokenOnList(selectedTokenList, currency.isToken ? currency : undefined)
  const customAdded = useIsUserAddedToken(currency)
  const balance = useCurrencyBalance(account ?? undefined, currency)
  const currencyItemClick =() => (isSelected ? null : onSelect());
  // only show add or remove buttons if not on selected list
  return (
    <MenuItem
      style={style}
      className={`token-item-${key}`}
      onClick={currencyItemClick}
      disabled={isSelected}
      selected={otherSelected}
    >
      <CurrencyLogo currency={currency} size={'24px'} />
      <Column>
        <Text title={currency.name} fontWeight={500}>
          {currency.symbol}
        </Text>
        <TYPE.darkGray ml="0px" fontSize={'12px'} fontWeight={300}>
          {!currency.isNative && !isOnSelectedList && customAdded ? (
            <Trans>{currency.name} • Added by user</Trans>
          ) : (
            currency.name
          )}
        </TYPE.darkGray>
      </Column>
      <TokenTags currency={currency} />
      {showCurrencyAmount && (
        <RowFixed style={{ justifySelf: 'flex-end' }}>
          {balance ? <Balance balance={balance} /> : account ? <Loader /> : null}
        </RowFixed>
      )}
    </MenuItem>
  )
})

const BREAK_LINE = 'BREAK'
type BreakLine = typeof BREAK_LINE
function isBreakLine(x: unknown): x is BreakLine {
  return x === BREAK_LINE
}

function BreakLineComponent({ style }: { style: CSSProperties }) {
  const theme = useTheme()
  return (
    <FixedContentRow style={style}>
      <LightGreyCard padding="8px 12px" $borderRadius="8px">
        <RowBetween>
          <RowFixed>
            <TokenListLogoWrapper src={TokenListLogo} />
            <TYPE.main ml="6px" fontSize="12px" color={theme.text1}>
              <Trans>Expanded results from inactive Token Lists</Trans>
            </TYPE.main>
          </RowFixed>
          <QuestionHelper
            text={
              <Trans>
                Tokens from inactive lists. Import specific tokens below or click Manage to activate more lists.
              </Trans>
            }
          />
        </RowBetween>
      </LightGreyCard>
    </FixedContentRow>
  )
}
type CurrrencyListProps = {
  height: number
  currencies: Currency[]
  otherListTokens?: WrappedTokenInfo[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showImportView: () => void
  setImportToken: (token: Token) => void
  showCurrencyAmount?: boolean
};
  
export const CurrencyList = React.memo((props: CurrrencyListProps) => {
  const {height,currencies,otherListTokens,selectedCurrency,onCurrencySelect,fixedListRef,showImportView,setImportToken,otherCurrency,showCurrencyAmount} = props;
  const itemData: (Currency | BreakLine)[] = useMemo(() => {
    if (otherListTokens && otherListTokens?.length > 0) {
      return [...currencies, BREAK_LINE, ...otherListTokens]
    }
    return currencies
  }, [currencies, otherListTokens])

  const Row = useMemo(
  () =>  function TokenRow({ data, index, style }: any) {
      const row: Currency | BreakLine = data[index]

      if (isBreakLine(row)) {
        return <BreakLineComponent style={style} />
      }

      const currency = row

      const isSelected = Boolean(currency && selectedCurrency && (selectedCurrency as any)?.address?.toLowerCase() === (currency as any)?.address?.toLowerCase())
      const otherSelected = Boolean(currency && otherCurrency && (otherCurrency as any)?.address?.toLowerCase() === (currency as any)?.address?.toLowerCase())
      const handleSelect = () => currency && onCurrencySelect(currency)

      const token = currency?.wrapped

      const showImport = index >= currencies.length 

      if (showImport && token) {
        return (
          <ImportRow style={style} token={token} showImportView={showImportView} setImportToken={setImportToken} dim />
        )
      } else if (currency) {
        return (
          <CurrencyRow
            style={style}
            currency={currency}
            isSelected={isSelected}
            onSelect={handleSelect}
            otherSelected={otherSelected}
            showCurrencyAmount={showCurrencyAmount}
          />
        )
      } else {
        return null
      }
    },
    [
      currencies.length,
      onCurrencySelect,
      otherCurrency,
      selectedCurrency,
      setImportToken,
      showImportView,
      showCurrencyAmount,
    ]
  )

  const itemKey = (index: number, data: typeof itemData) => {
    const currency = data[index]
    if (isBreakLine(currency)) return BREAK_LINE
    return currencyKey(currency)
  }

  return (
    <FixedSizeList
      height={height}
      ref={fixedListRef as any}
      width="100%"
      itemData={itemData}
      itemCount={itemData.length}
      itemSize={56}
      itemKey={itemKey}
    >
      {Row}
    </FixedSizeList>
  )
}, (prevProps, newProps) => _.isEqual(prevProps, newProps))
CurrencyList.displayName = 'clist';
  CurrencyRow.displayName = 'crow';
export default CurrencyList ;
