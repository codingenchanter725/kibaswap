import { FlattenSimpleInterpolation, ThemedCssFunction } from 'styled-components/macro'

export type Color = string
export type AllColors = ThemeColors | Colors

export interface ThemeColors {
  userThemeColor: string

  backgroundBackdrop: Color
  backgroundSurface: Color
  backgroundModule: Color
  backgroundFloating: Color
  backgroundInteractive: Color
  backgroundOutline: Color
  backgroundScrim: Color

  textPrimary: Color
  textSecondary: Color
  textTertiary: Color

  accentAction: Color
  accentActive: Color
  accentSuccess: Color
  accentWarning: Color
  accentFailure: Color
  accentCritical: Color

  accentActionSoft: Color
  accentActiveSoft: Color
  accentSuccessSoft: Color
  accentWarningSoft: Color
  accentFailureSoft: Color

  accentTextDarkPrimary: Color
  accentTextDarkSecondary: Color
  accentTextDarkTertiary: Color

  accentTextLightPrimary: Color
  accentTextLightSecondary: Color
  accentTextLightTertiary: Color

  // base
  white: Color
  black: Color

  chain_1: Color
  chain_3: Color
  chain_4: Color
  chain_5: Color
  chain_10: Color
  chain_137: Color
  chain_42: Color
  chain_420: Color
  chain_42161: Color
  chain_421611: Color
  chain_80001: Color

  shallowShadow: Color
  deepShadow: Color
  hoverState: Color
  hoverDefault: Color
  stateOverlayHover: Color
  stateOverlayPressed: Color
}
export interface Colors {
  darkMode: boolean

  white: Color
  black: Color


  // text
  text1: Color
  text2: Color
  text3: Color
  text4: Color
  text5: Color
  textPrimary: Color
  textSecondary: Color

  // backgrounds / greys
  bg0: Color
  bg1: Color
  bg2: Color
  bg3: Color
  bg4: Color
  bg5: Color
  bg6: Color
  bgSwapHeader: Color
  bgmenu: Color
  //specialtycolors
  modalBG: Color
  andyBG: Color
  advancedBG: Color

  //blues
  primary1: Color
  primary2: Color
  primary3: Color
  primary4: Color
  primary5: Color

  primaryText1: Color

  // pinks
  secondary1: Color
  secondary2: Color
  secondary3: Color

  // other
  red1: Color
  red2: Color
  red3: Color
  green1: Color
  yellow1: Color
  yellow2: Color
  yellow3: Color
  blue1: Color
  blue2: Color

  blue4: Color

  error: Color
  success: Color
  warning: Color

  backgroundInteractive: Color;
}

declare module 'styled-components/macro' {
  export interface DefaultTheme extends Colors {
    grids: Grids

    // shadows
    shadow1: string
    //chart page
    chartBgDark: string
    chartBgLight: string

    chartTableBg: string
    chartSidebar: string

    // interactive
    backgroundInteractive: string
    // media queries
    mediaWidth: {
      upToExtraSmall: ThemedCssFunction<DefaultTheme>
      upToSmall: ThemedCssFunction<DefaultTheme>
      upToMedium: ThemedCssFunction<DefaultTheme>
      upToLarge: ThemedCssFunction<DefaultTheme>
    }

    // css snippets
    flexColumnNoWrap: FlattenSimpleInterpolation
    flexRowNoWrap: FlattenSimpleInterpolation
  }
}
