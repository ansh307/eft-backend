import { v4 as uuid } from "uuid";

// --- ACCOUNTS ---
export let accounts = [
  {
    id: "acc_1",
    userId: "user_1",
    currency: "USD",

    balance: 10000,
    equity: 10000,

    leverage: 100,
    marginUsed: 0,
    freeMargin: 10000,
    marginLevel: 0,

    createdAt: Date.now(),
  },
];

// --- POSITIONS (PER ACCOUNT) ---
export let accountPositions = {
  acc_1: [
    {
      id: "pos_1",
      symbol: "EURUSD",
      side: "BUY",
      volume: 1.0,

      openPrice: 1.1000,
      currentPrice: 1.1012,

      stopLoss: 1.0950,
      takeProfit: 1.1100,

      profit: 12.0,
      margin: 100,

      status: "OPEN",
      createdAt: Date.now(),
    },
  ],
};

// --- TRADE HISTORY (PER ACCOUNT) ---
export let accountHistory = {
  acc_1: [
    {
      id: "trade_1",
      symbol: "EURUSD",
      side: "BUY",
      volume: 1,

      openPrice: 1.1,
      closePrice: 1.105,

      pnl: 50,

      openedAt: 123456789,
      closedAt: 123456999,
    },
  ],
};

// --- MARKET PRICES (WITH BID/ASK) ---
export let prices = {
  EURUSD: {
    bid: 1.1000,
    ask: 1.1002,
    spread: 0.0002,
  },
  BTCUSD: {
    bid: 60000,
    ask: 60010,
    spread: 10,
  },
};

// --- SYMBOL METADATA ---
export const symbols = [
  {
    symbol: "EURUSD",
    base: "EUR",
    quote: "USD",

    contractSize: 100000,
    minLot: 0.01,
    maxLot: 100,

    pipSize: 0.0001,
    tickValue: 10,

    leverage: 100,
  },
  {
    symbol: "BTCUSD",
    base: "BTC",
    quote: "USD",

    contractSize: 1,
    minLot: 0.01,
    maxLot: 10,

    pipSize: 1,
    tickValue: 1,

    leverage: 10,
  },
];