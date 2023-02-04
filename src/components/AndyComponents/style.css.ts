import { style } from '@vanilla-extract/css'

import { sprinkles, vars } from 'theme/spinkles.css'


export const subhead = sprinkles({ fontWeight: 'medium', fontSize: '16', lineHeight: '24' })

export const nav = style([
    sprinkles({
        paddingX: '20',
        paddingY: '12',
        width: 'full',
        height: '72',
        zIndex: '2',
        background: 'backgroundFloating',
    }),
    {
        backdropFilter: 'blur(24px)',
    },
])
export const logoContainer = style([
    sprinkles({
        display: 'flex',
        marginRight: { sm: '12', xxl: '20' },
        alignItems: 'center',
    }),
])



export const logoSpr = style([
    sprinkles({
        display: 'block',
        color: 'textPrimary',
    }),
])

export const baseContainer = style([
    sprinkles({
        alignItems: 'center',
    }),
])

export const baseSideContainer = style([
    baseContainer,
    sprinkles({
        display: 'flex',
        width: 'full',
        flex: '1',
        flexShrink: '2',
    }),
])

export const leftSideContainer = style([
    baseSideContainer,
    sprinkles({
        justifyContent: 'flex-start',
    }),
])

export const middleContainer = style([
    baseContainer,
    sprinkles({
        flex: '1',
        flexShrink: '1',
        justifyContent: 'center',
        display: { sm: 'none', xl: 'flex' },
    }),
])

export const rightSideContainer = style([
    baseSideContainer,
    sprinkles({
        justifyContent: 'flex-end',
    }),
])

const baseMenuItem = style([
    subhead,
    sprinkles({
        paddingY: '16',
        paddingX: '16',
        marginY: '4',
        borderRadius: '12',
        transition: '250',
        height: 'min',
        width: 'full',
        textAlign: 'center',
    }),
    {
        lineHeight: '24px',
        textDecoration: 'none',
        ':hover': {
        },
    },
])

export const menuItem = style([
    baseMenuItem,
    sprinkles({
        color: 'textSecondary',
    }),
])

export const activeMenuItem = style([
    baseMenuItem,
    sprinkles({
        color: 'textPrimary',
        background: 'backgroundFloating',
    }),
])

export const mobileBottomBar = style([
    sprinkles({
        position: 'fixed',
        display: { sm: 'flex', lg: 'none' },
        bottom: '0',
        right: '0',
        left: '0',
        justifyContent: 'space-between',
        paddingY: '4',
        paddingX: '8',
        height: '60',
        background: 'backgroundSurface',
        alignItems: 'center',

    }),
])

export const MobileMenuIconContainer = style([
    sprinkles({
        display: 'flex',
        alignItems: 'center',
    }),
])

export const MobileNavIcon = style([
    sprinkles({
        display: 'block',
        color: 'textPrimary',
    }),
])

