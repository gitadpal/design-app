export type OnboardingTheme = 'dark' | 'light';

export interface OnboardingTokens {
  bg: string;
  text: string;
  textMuted: string;
  textDim: string;
  textFaint: string;
  bottomScrim: string;
  cardBg: string;
  cardBorder: string;
  divider: string;
  progressTrack: string;
  einkScreen: string;
}

const DARK: OnboardingTokens = {
  bg: '#0A0A0A',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  textDim: 'rgba(255,255,255,0.45)',
  textFaint: 'rgba(255,255,255,0.40)',
  bottomScrim:
    'linear-gradient(to bottom, transparent 0%, rgba(10,10,10,0.55) 38%, rgba(10,10,10,0.92) 72%, #0A0A0A 100%)',
  cardBg: '#1C1C1E',
  cardBorder: 'rgba(255,255,255,0.08)',
  divider: 'rgba(255,255,255,0.06)',
  progressTrack: 'rgba(255,255,255,0.18)',
  einkScreen: '#EDE9DC',
};

const LIGHT: OnboardingTokens = {
  bg: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: 'rgba(26,26,26,0.62)',
  textDim: 'rgba(26,26,26,0.48)',
  textFaint: 'rgba(26,26,26,0.38)',
  bottomScrim:
    'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.55) 38%, rgba(255,255,255,0.92) 72%, #FFFFFF 100%)',
  cardBg: '#F4F4F5',
  cardBorder: 'rgba(0,0,0,0.08)',
  divider: 'rgba(0,0,0,0.06)',
  progressTrack: 'rgba(26,26,26,0.16)',
  einkScreen: '#EDE9DC',
};

export function getOnboardingTokens(theme: OnboardingTheme): OnboardingTokens {
  return theme === 'dark' ? DARK : LIGHT;
}
