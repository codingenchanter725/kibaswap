import { ArrowDownCircle, ChevronDown, ToggleLeft } from 'react-feather'
import { CHAIN_INFO, L2_CHAIN_IDS, SupportedChainId, SupportedL2ChainId } from '../../constants/chains'
import { ExternalLink, TYPE } from 'theme'
import styled, { css } from 'styled-components/macro'
import { useEffect, useRef, useState } from 'react'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

import { ApplicationModal } from 'state/application/actions'
import { Trans } from '@lingui/macro'
import { YellowCard } from 'components/Card'
import { switchToNetwork } from 'utils/switchToNetwork'
import { useActiveWeb3React } from 'hooks/web3'
import { useOnClickOutside } from 'hooks/useOnClickOutside'

const BaseWrapper = css`
  position: relative;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    justify-self: end;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0 0.5rem 0 0;
    width: initial;
    text-overflow: ellipsis;
    flex-shrink: 1;
  `};
`
const L2Wrapper = styled.div`
  ${BaseWrapper}
`
const BaseMenuItem = css`
  align-items: center;
  background-color: transparent;
  border-radius: 12px;
  color: ${({ theme }) => theme.text2};
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: row;
  font-family: 'Poppins';
  font-size: 16px;
  font-weight: 600;
  justify-content: space-between;
  :hover {
    color: ${({ theme }) => theme.text1};
    text-decoration: none;
  }
`
const DisabledMenuItem = styled.div`
  ${BaseMenuItem}
  align-items: center;
  background-color: ${({ theme }) => theme.bg2};
  cursor: auto;
  display: flex;
  font-size: 10px;
  font-style: italic;
  justify-content: center;
  :hover,
  :active,
  :focus {
    color: ${({ theme }) => theme.text2};
  }
`
const FallbackWrapper = styled(YellowCard)`
  ${BaseWrapper}
  width: auto;
  border-radius: 12px;
  padding: 8px 12px;
  width: 100%;
`
const Icon = styled.img`
  width: 16px;
  margin-right: 2px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
  margin-right: 4px;

  `};
`

const MenuFlyout = styled.span`
  background-color: ${({ theme }) => theme.bg0};
  border: 1px solid ${({ theme }) => theme.bg1};

  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;ß
  left: 0rem;
  top: 3rem;
  z-index: 100;
  width: 237px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
   
    bottom: unset;
    top: 4.5em
    right: 0;

  `};
  > {
    padding: 12px;
  }
  > :not(:first-child) {
    margin-top: 8px;
  }
  > :not(:last-child) {
    margin-bottom: 8px;
  }
`
const LinkOutCircle = styled(ArrowDownCircle)`
  transform: rotate(230deg);
  width: 16px;
  height: 16px;
  opacity: 0.6;
`
const MenuItem = styled(ExternalLink)`
  ${BaseMenuItem}
`
const ButtonMenuItem = styled.button`
  ${BaseMenuItem}
  border: none;
  box-shadow: none;
  color: ${({ theme }) => theme.text2};
  outline: none;
  padding: 0;
`
export const NetworkInfo = styled.button<{ chainId: SupportedChainId }>`
  align-items: center;
  background: transparent;
  border-radius: 12px;
  border: transparent;
  color: ${({ theme }) => theme.text1};
  display: flex;
  flex-direction: row;
  font-family: 'Poppins';
  font-weight: 600;
  height: 100%;
  margin: 0;
  height: 38px;
  padding: 0.25rem;

  :hover{
    background-color: ${({ theme }) => theme.andyBG};
    },
  :focus {
    cursor: pointer;
    outline: none;
    border: transparent;
  }
`
export const BurntPoll = styled.button<{ chainId: SupportedChainId }>`
  align-items: center;
  background: transparent;
  border-radius: 12px;
  border: transparent;
  color: ${({ theme }) => theme.text1};
  display: flex;
  flex-direction: row;
  height: 100%;
  margin: 0;
  height: 38px;
  font-family: inherit;
  font-weight: 500;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    
  }
`
const NetworkName = styled.div<{ chainId: SupportedChainId }>`
  border-radius: 6px;
  padding: 0 2px 0.5px 4px;
  margin: 0 2px;
  white-space: pre;
  ${({ theme }) => theme.mediaWidth.upToSmall`
   display: none;
  `};
`

export default function NetworkCard() {
  const { chainId, library } = useActiveWeb3React()
  const node = useRef<HTMLDivElement>(null)
  const open = useModalOpen(ApplicationModal.ARBITRUM_OPTIONS)
  const toggle = useToggleModal(ApplicationModal.ARBITRUM_OPTIONS)
  useOnClickOutside(node, open ? toggle : undefined)
  const info = CHAIN_INFO[chainId as SupportedL2ChainId]


  if (!chainId || !info || !library) {
    return null
  }

    const isBINANCE = [SupportedChainId.MAINNET, SupportedChainId.BINANCE].includes(chainId)
    return (
      <L2Wrapper ref={node}>
        <NetworkInfo onClick={toggle} chainId={chainId}>
          <Icon src={info.logoUrl} />
          <NetworkName chainId={chainId}>{info.label}</NetworkName>
          <ChevronDown size={12} style={{ marginTop: '2px' }} strokeWidth={2.5} />
        </NetworkInfo>
        {open && (
          <MenuFlyout>
            { (
           
            <TYPE.main fontSize={12}>
              <Trans>
              The Networks you are using is controlled by your wallet. If your wallet lets you change network on the fly (MetaMask does) then you can change at any time. If your wallet does not then disconnect and re-connect to switch networks. You must select the network you want to use when you re-connect.{' '}
                <ExternalLink style={{color:"#F8D9C8"}} href="https://kibainu.org/networkhelp/">Click here for help.</ExternalLink> 
              </Trans>
            </TYPE.main>
          
            )}
          </MenuFlyout>
        )}
      </L2Wrapper>
    )

  return <FallbackWrapper title={info.label}>{info.label}</FallbackWrapper>
}
