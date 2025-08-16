import { createTheme, rem } from '@mantine/core';

export const myTheme = createTheme({
    defaultRadius: 'md',

    colors: {
        primaryColor: ['#613DE4'],
        accentColor: ['#FCE073'],
        secondaryColor: ['#4E31B6'],
        backgroundColor: ['#566FAE'],
        dangerColor: ['#C13737'],
        successColor: ['#3BB266'],
        infoColor: ['#F731BC'],
        warningColor: ['#F26969'],
        importantColor: ['#428bca', '#bd8c35'],
        amberColor: ['#FFC107'],
        cyanColor: ['#17A2B8']
    },

    defaultGradient: {
        from: '#428bca',
        to: '#bd8c35',
        deg: 45,
    },

    heroHeight : rem(400)
});

export const resolver = (theme) => ({
    variables: {
		'--hover-color': theme.colors.secondaryColor,
		'--background-color': theme.colors.backgroundColor,
        '--mantine-hero-height': theme.heroHeight,
        '--primary-color': theme.colors.primaryColor,
        '--secondary-color': theme.colors.secondaryColor,
        '--accent-color': theme.colors.accentColor,
        '--danger-color': theme.colors.dangerColor,
        '--success-color': theme.colors.successColor,
        '--info-color': theme.colors.infoColor,
        '--warning-color': theme.colors.warningColor,
        '--important-color': theme.colors.importantColor[0],
        '--amber-color': theme.colors.amberColor,
        '--cyan-color': theme.colors.cyanColor,
    },
});

