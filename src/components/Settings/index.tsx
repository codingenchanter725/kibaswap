import { RowBetween, RowFixed } from '../Row'
import { Settings, X } from 'react-feather'
import { Trans, t } from '@lingui/macro'
import styled, { ThemeContext } from 'styled-components/macro'
import { useContext, useRef, useState } from 'react'
import { useExpertModeManager, useSetAutoSlippage, useSetFrontrunProtectionEnabled, useUserDetectRenounced, useUserSingleHopOnly } from '../../state/user/hooks'
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'

import { ApplicationModal } from '../../state/application/actions'
import { AutoColumn } from '../Column'
import { ButtonError } from '../Button'
import Modal from '../Modal'
import { Percent } from '@uniswap/sdk-core'
import QuestionHelper from '../QuestionHelper'
import ReactGA from 'react-ga'
import { TYPE } from '../../theme'
import { Text } from 'rebass'
import Toggle from '../Toggle'
import TransactionSettings from '../TransactionSettings'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'

const StyledMenuIcon = styled(Settings)`
  height: 20px;
  width: 20px;

  > * {
    stroke: ${({ theme }) => theme.text2};
  }

  :hover {
    opacity: 0.7;
  }
`

const StyledCloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledMenuButton = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  border-radius: 0.5rem;
  height: 20px;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
  }
`
const EmojiWrapper = styled.div`
  position: absolute;
  bottom: -8px;
  right: 0px;
  font-size: 14px;
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuFlyout = styled.span`
  min-width: 20.125rem;
  background-color: ${({ theme }) => theme.bg1};
  border: 1px solid ${({ theme }) => theme.bg3};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 2rem;
  right: 0rem;
  z-index: 100;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-width: 18.125rem;
  `};

  user-select: none;
`

const Break = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.bg3};
`

const ModalContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 20px;
`

export default function  SettingsTab({ placeholderSlippage }: { placeholderSlippage: Percent }) {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.SETTINGS)
  const toggle = useToggleSettingsMenu()
  const { onSwitchUseChangeRecipient } = useSwapActionHandlers()
  const { useOtherAddress } = useSwapState()
  const theme = useContext(ThemeContext)

  const [expertMode, toggleExpertMode] = useExpertModeManager()

  const [singleHopOnly, setSingleHopOnly] = useUserSingleHopOnly()
  const [useAutoSlippage, setUseAutoSlippage] = useSetAutoSlippage()
  const [useFrontRunProtection, setUseFrontRunProtection] = useSetFrontrunProtectionEnabled()
  const [useDetectRenounced, setUseDetectRenounced] = useUserDetectRenounced()


  // show confirmation view before turning on
  const [showConfirmation, setShowConfirmation] = useState(false)

  useOnClickOutside(node, open ? toggle : undefined)
  const onDismissClick = () => setShowConfirmation(false);
  const toggleFunction  = expertMode
  ? () => {
      toggleExpertMode()
      setShowConfirmation(false)
    }
  : () => {
      toggle()
      setShowConfirmation(true)
    };
    const toggleSlippageFunction = () => {
      ReactGA.event({
        category: 'Routing',
        action: useAutoSlippage ? 'disable auto slippage' : 'enable auto slippage',
      })
      setUseAutoSlippage(!useAutoSlippage)
    };
    const toggleFrontRunFunction = () => {
      ReactGA.event({
        category: 'Routing',
        action: useAutoSlippage ? 'enable front run protection' : 'disable front run protection',
      })
      setUseFrontRunProtection(!useFrontRunProtection)
    };
    const toggleSingleHopFn = () => {
      ReactGA.event({
        category: 'Routing',
        action: singleHopOnly ? 'disable single hop' : 'enable single hop',
      })
      setSingleHopOnly(!singleHopOnly)
    }

    const toggleDetectRenounced = () => {
      setUseDetectRenounced(!useDetectRenounced)
    }

    const specifyReceiver = () => {
      onSwitchUseChangeRecipient(!useOtherAddress)
    };
  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <Modal isOpen={showConfirmation} onDismiss={onDismissClick} maxHeight={100}>
        <ModalContentWrapper>
          <AutoColumn gap="lg">
            <RowBetween style={{ padding: '0 2rem' }}>
              <div />
              <Text fontWeight={500} fontSize={20}>
                <Trans>Are you sure?</Trans>
              </Text>
              <StyledCloseIcon onClick={onDismissClick} />
            </RowBetween>
            <Break />
            <AutoColumn gap="lg" style={{ padding: '0 2rem' }}>
              <Text fontWeight={500} fontSize={20}>
                <Trans>
                  Expert mode turns off the confirm transaction prompt and allows high slippage trades that often result
                  in bad rates and lost funds.
                </Trans>
              </Text>
              <Text fontWeight={600} fontSize={20}>
                <Trans>ONLY USE THIS MODE IF YOU KNOW WHAT YOU ARE DOING.</Trans>
              </Text>
              <ButtonError
                error={true}
                padding={'12px'}
                onClick={() => {
                  const confirmWord = t`confirm`
                  if (window.prompt(t`Please type the word "${confirmWord}" to enable expert mode.`) === confirmWord) {
                    toggleExpertMode()
                    setShowConfirmation(false)
                  }
                }}
              >
                <Text fontSize={20} fontWeight={500} id="confirm-expert-mode">
                  <Trans>Turn On Expert Mode</Trans>
                </Text>
              </ButtonError>
            </AutoColumn>
          </AutoColumn>
        </ModalContentWrapper>
      </Modal>
      <StyledMenuButton onClick={toggle} id="open-settings-dialog-button">
        <StyledMenuIcon />
        {expertMode ? (
          <EmojiWrapper>
            <span role="img" aria-label="wizard-icon">
              🧙
            </span>
          </EmojiWrapper>
        ) : null}
      </StyledMenuButton>
      {open && (
        <MenuFlyout>
          <AutoColumn gap="md" style={{ padding: '1rem' }}>
            <Text fontWeight={600} fontSize={14}>
              <Trans>Transaction Settings</Trans>
            </Text>
            <TransactionSettings placeholderSlippage={placeholderSlippage} />
            <Text fontWeight={600} fontSize={14}>
              <Trans>Interface Settings</Trans>
            </Text>
            <RowBetween>
              <RowFixed>
                <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                  <Trans>Toggle Expert Mode</Trans>
                </TYPE.black>
                <QuestionHelper
                  text={
                    <Trans>Allow high price impact trades and skip the confirm screen. Use at your own risk.</Trans>
                  }
                />
              </RowFixed>
             
              <Toggle
                id="toggle-expert-mode-button"
                isActive={expertMode}
                toggle={
                  toggleFunction
                }
              />
            </RowBetween>
            <RowBetween>
            <RowFixed>
                <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                  <Trans>Use Auto Slippage</Trans>
                </TYPE.black>
                <QuestionHelper
                  text={
                    <Trans>Automatically calculate the lowest possible slippage on every swap you do. This is based on the token your trading and the smart contracts taxes.</Trans>
                  }
                />
              </RowFixed>
              <Toggle
                id="toggle-auto-slippage"
                isActive={useAutoSlippage}
                toggle={toggleSlippageFunction}
              />
              </RowBetween>
              {/* <RowBetween>
            <RowFixed>
                <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                  <Trans>Use Flash Bots Sandwich Protection</Trans>
                </TYPE.black>
                <QuestionHelper
                  text={
                    <Trans>Protect your self from front-runner bots that will buy and sell directly before and after your transaction. This feature is currently in BETA mode.</Trans>
                  }
                />
              </RowFixed>
              <Toggle
                id="toggle-frontrun-protection]"
                isActive={useFrontRunProtection}
                toggle={toggleFrontRunFunction}
              />
              </RowBetween>
                <RowBetween>
              <RowFixed>
                <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                  <Trans>Disable Multihops</Trans>
                </TYPE.black>
                <QuestionHelper text={<Trans>Restricts swaps to direct pairs only.</Trans>} />
              </RowFixed>
              <Toggle
                id="toggle-disable-multihop-button"
                isActive={singleHopOnly}
                toggle={toggleSingleHopFn}
              />
            </RowBetween> */}
               <RowBetween>
              <RowFixed>
                <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                  <Trans>Detect Renouce</Trans>
                </TYPE.black>
                <QuestionHelper text={<Trans>Adds an extra check to all the tokens you are swapping to determine if the contract has been renounced. Will show a visual indicator in the UI.</Trans>} />
              </RowFixed>
              <Toggle
                id="toggle-detect-renounced-button"
                isActive={useDetectRenounced}
                toggle={toggleDetectRenounced}
              />
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                  <Trans>Specify Reciever</Trans>
                </TYPE.black>
                <QuestionHelper text={<Trans>Enables the feature to allow you to specify a receiving address for your swaps.</Trans>} />
              </RowFixed>
              <Toggle
                id="toggle-disable-multihop-button"
                isActive={useOtherAddress}
                toggle={specifyReceiver}
              />
            </RowBetween>
          </AutoColumn>
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
