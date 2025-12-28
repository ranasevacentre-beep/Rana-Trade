
import { BetColor, BigSmall } from './types';

export const MULTIPLIERS = {
  GREEN: 2.0,
  RED: 2.0,
  VIOLET: 4.5,
  NUMBER: 9.0,
  BIG: 2.0,
  SMALL: 2.0,
};

export const COLOR_MAP: Record<number, BetColor[]> = {
  0: ['RED', 'VIOLET'],
  1: ['GREEN'],
  2: ['RED'],
  3: ['GREEN'],
  4: ['RED'],
  5: ['GREEN', 'VIOLET'],
  6: ['RED'],
  7: ['GREEN'],
  8: ['RED'],
  9: ['GREEN'],
};

export const BIG_SMALL_MAP: Record<number, BigSmall> = {
  0: 'SMALL', 1: 'SMALL', 2: 'SMALL', 3: 'SMALL', 4: 'SMALL',
  5: 'BIG', 6: 'BIG', 7: 'BIG', 8: 'BIG', 9: 'BIG'
};

export const INITIAL_CONFIG = {
  minRecharge: 0, 
  minWithdraw: 500,
  houseEdge: 0.05,
  autoResult: true,
  emergencyStop: false,
  rechargeUpi: 'rana.trade@upi',
  adminPassword: 'admin@123',
  recoveryPin: '20042003',
  platformProfit: 0,
  // FIX: Added 'aviator' property to satisfy Record<GameMode, number | null> requirement in AppConfig
  nextResultOverrides: {
    '30s': null,
    '1m': null,
    '3m': null,
    '5m': null,
    'aviator': null
  },
};
