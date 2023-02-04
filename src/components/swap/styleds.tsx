import styled, { css } from 'styled-components/macro'

import { AlertTriangle } from 'react-feather'
import { AutoColumn } from '../Column'
import { ReactNode } from 'react'
import { Text } from 'rebass'
import { transparentize } from 'polished'

export const Wrapper = styled.div`
  position: relative;
  padding: 40px;
  overflow: hidden;

  > [aria-modal="true"] {
    background: #222;
  }
  .dFigrI[data-reach-dialog-content] {
    background:#222;
  }
`

export const ArrowWrapper = styled.div<{ clickable: boolean }>`
  padding: 4px;
  border-radius: 12px;
  height: 32px;
  width: 32px;
  position: relative;
  margin-top: 5px;
  margin-bottom: 5px;
  left: calc(50% - 16px);
  display:flex;
  justify-content:center;
  align-items:center;
  /* transform: rotate(90deg); */
  background: 'transparent';
  svg g g path { fill: ${props => props.theme.text1}; }
  border: 4px solid transparent;
  z-index: 2;
  ${({ clickable }) =>
    clickable
      ? css`
          :hover {
            cursor: pointer;
            color:yellow !important;
          }
        `
      : null}
`
export const MajgicWrapper = styled.div<{ clickable: boolean }>`
  padding: 10px;
  height: 40px;
  width: 40px;
  position: relative;
  margin-top: -5px;
  margin-bottom: -5px;
  left: calc(50% - 16px);
  display:flex;
  justify-content:center;
  align-items:center;
  /* transform: rotate(90deg); */
  background: ${({ theme }) => theme.bg6};
  z-index: 2;
  ${({ clickable }) =>
    clickable
      ? css`
          :hover {
            cursor: pointer;
            color:yellow !important;
          }
        `
      : null}
`

export const SectionBreak = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${({ theme }) => theme.bg3};
`

export const ErrorText = styled(Text) <{ severity?: 0 | 1 | 2 | 3 | 4 }>`
  color: ${({ theme, severity }) =>
    severity === 3 || severity === 4
      ? theme.red1
      : severity === 2
        ? theme.yellow2
        : severity === 1
          ? theme.text1
          : theme.text2};
`

export const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  max-width: 220px;
  overflow: hidden;
  text-align: right;
`

// styles
export const Dots = styled.span`
  &::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: '.';
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
`

const SwapCallbackErrorInner = styled.div`
  background-color: #fff;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  font-size: 0.825rem;
  width: 100%;
  padding: 3rem 1.25rem 1rem 1rem;
  margin-top: -2rem;
  color: ${({ theme }) => theme.red1};
  z-index: -1;
  p {
    padding: 0;
    margin: 0;
    font-weight: 500;
  }
`

const SwapCallbackErrorInnerAlertTriangle = styled.div`
  background-color: ${({ theme }) => transparentize(0.9, theme.red1)};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  border-radius: 12px;
  min-width: 48px;
  height: 48px;
`

export function SwapCallbackError({ error }: { error: ReactNode }) {
  return (
    <SwapCallbackErrorInner>
      <SwapCallbackErrorInnerAlertTriangle>
        <AlertTriangle size={24} />
      </SwapCallbackErrorInnerAlertTriangle>
      <p style={{ wordBreak: 'break-word' }}>{error}</p>
    </SwapCallbackErrorInner>
  )
}

export const SwapShowAcceptChanges = styled(AutoColumn)`
  background-color: ${({ theme }) => transparentize(0.95, theme.primary3)};
  color: ${({ theme }) => theme.primaryText1};
  padding: 0.5rem;
  border-radius: 12px;
  margin-top: 8px;
`