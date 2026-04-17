import { v4 as uuid } from "uuid";
import {
  accounts,
  accountPositions,
  accountHistory,
  prices,
  symbols,
} from "../data/tradelocker.data.js";
import { calculatePnL } from "../lib/utils.js";

// --- Helpers ---
const delay = () =>
  new Promise((r) => setTimeout(r, 100 + Math.random() * 300));

const maybeFail = () => Math.random() < 0.03;

const success = (data) => ({ success: true, data });
const error = (message) => ({ success: false, error: message });

// --- Helper: Get Account Context ---
const getContext = (accountId) => {
  const account = accounts.find((a) => a.id === accountId);

  if (!account) return null;

  if (!accountPositions[accountId]) accountPositions[accountId] = [];
  if (!accountHistory[accountId]) accountHistory[accountId] = [];

  return {
    account,
    positions: accountPositions[accountId],
    history: accountHistory[accountId],
  };
};

// --- AUTH ---
export const login = async (req, res) => {
  await delay();

  return res.json(
    success({
      token: "mock-token",
      user: { id: "user_1" },
    })
  );
};

// --- ACCOUNT ---
export const getAccount = async (req, res) => {
  await delay();

  try {
    const { accountId } = req.params;

    const ctx = getContext(accountId);
    if (!ctx) return res.status(404).json(error("Account not found"));

    const { account, positions } = ctx;

    const totalPnL = positions.reduce(
      (sum, p) => sum + calculatePnL(p),
      0
    );

    const equity = account.balance + totalPnL;

    const marginLevel =
      account.marginUsed > 0
        ? (equity / account.marginUsed) * 100
        : 0;

    return res.json(
      success({
        balance: account.balance,
        equity,
        marginUsed: account.marginUsed,
        freeMargin: equity - account.marginUsed,
        marginLevel,
      })
    );
  } catch (err) {
    return res.status(500).json(error("Failed to fetch account"));
  }
};

// --- SYMBOLS ---
export const getSymbols = (req, res) => {
  return res.json(
    success(
      symbols.map((s) => ({
        symbol: s.symbol,
        bid: prices[s.symbol].bid,
        ask: prices[s.symbol].ask,
        spread: prices[s.symbol].spread,
        leverage: s.leverage,
        minLot: s.minLot,
        maxLot: s.maxLot,
      }))
    )
  );
};

// --- PRICE ---
export const getPrice = (req, res) => {
  const { symbol } = req.query;

  if (!symbol || !prices[symbol]) {
    return res.status(400).json(error("Invalid symbol"));
  }

  return res.json(
    success({
      symbol,
      bid: prices[symbol].bid,
      ask: prices[symbol].ask,
      spread: prices[symbol].spread,
      timestamp: Date.now(),
    })
  );
};

// --- POSITIONS ---
export const getPositions = async (req, res) => {
  await delay();

  try {
    const { accountId } = req.params;

    const ctx = getContext(accountId);
    if (!ctx) return res.status(404).json(error("Account not found"));

    const { positions } = ctx;

    const updated = positions.map((p) => {
      const market = prices[p.symbol];

      const currentPrice =
        p.side === "BUY" ? market.bid : market.ask;

      return {
        ...p,
        currentPrice,
        profit: calculatePnL(p),
      };
    });

    return res.json(success(updated));
  } catch (err) {
    return res.status(500).json(error("Failed to fetch positions"));
  }
};

// --- PLACE ORDER ---
export const placeOrder = async (req, res) => {
  await delay();

  try {
    if (maybeFail()) {
      return res.status(500).json(error("Liquidity error"));
    }

    const { accountId } = req.params;
    const { symbol, volume, side, stopLoss, takeProfit } = req.body;

    const ctx = getContext(accountId);
    if (!ctx) return res.status(404).json(error("Account not found"));

    const { account, positions } = ctx;

    const symbolMeta = symbols.find((s) => s.symbol === symbol);
    if (!symbolMeta) {
      return res.status(400).json(error("Invalid symbol"));
    }

    if (!volume || volume < symbolMeta.minLot) {
      return res.status(400).json(error("Invalid volume"));
    }

    if (!["BUY", "SELL"].includes(side)) {
      return res.status(400).json(error("Invalid side"));
    }

    const market = prices[symbol];

    const basePrice =
      side === "BUY" ? market.ask : market.bid;

    const slippage = basePrice * (Math.random() * 0.0005);

    const executedPrice =
      side === "BUY"
        ? basePrice + slippage
        : basePrice - slippage;

    const marginRequired =
      (volume * symbolMeta.contractSize) /
      symbolMeta.leverage;

    const equity =
      account.balance +
      positions.reduce((sum, p) => sum + calculatePnL(p), 0);

    const freeMargin = equity - account.marginUsed;

    if (freeMargin < marginRequired) {
      return res.status(400).json(error("Insufficient margin"));
    }

    const position = {
      id: uuid(),
      symbol,
      volume,
      side,
      openPrice: executedPrice,
      stopLoss: stopLoss || null,
      takeProfit: takeProfit || null,
      margin: marginRequired,
      status: "OPEN",
      createdAt: Date.now(),
    };

    positions.push(position);

    account.marginUsed += marginRequired;

    return res.json(
      success({
        orderId: uuid(),
        status: "FILLED",
        executedPrice,
        position,
      })
    );
  } catch (err) {
    return res.status(500).json(error("Order failed"));
  }
};

// --- CLOSE POSITION ---
export const closePosition = async (req, res) => {
  await delay();

  try {
    const { accountId } = req.params;
    const { positionId } = req.body;

    const ctx = getContext(accountId);
    if (!ctx) return res.status(404).json(error("Account not found"));

    const { account, positions, history } = ctx;

    const index = positions.findIndex((p) => p.id === positionId);

    if (index === -1) {
      return res.status(404).json(error("Position not found"));
    }

    const position = positions[index];

    const market = prices[position.symbol];

    const closePrice =
      position.side === "BUY" ? market.bid : market.ask;

    const pnl = calculatePnL(position);

    account.balance += pnl;
    account.marginUsed -= position.margin;

    positions.splice(index, 1);

    const trade = {
      ...position,
      closePrice,
      pnl,
      closedAt: Date.now(),
    };

    history.push(trade);

    return res.json(
      success({
        closedPositionId: positionId,
        closePrice,
        pnl,
        balance: account.balance,
      })
    );
  } catch (err) {
    return res.status(500).json(error("Close failed"));
  }
};

// --- HISTORY ---
export const getHistory = (req, res) => {
  const { accountId } = req.params;

  const ctx = getContext(accountId);
  if (!ctx) return res.status(404).json(error("Account not found"));

  return res.json(success(ctx.history));
};

// --- GET SINGLE POSITION ---
export const getPositionById = (req, res) => {
  const { accountId, positionId } = req.params;

  const ctx = getContext(accountId);
  if (!ctx) return res.status(404).json(error("Account not found"));

  const pos = ctx.positions.find((p) => p.id === positionId);

  if (!pos) {
    return res.status(404).json(error("Position not found"));
  }

  return res.json(success(pos));
};

// MODIFY POSITION (SL / TP)
export const modifyPosition = (req, res) => {
  const { accountId } = req.params;
  const { positionId, stopLoss, takeProfit } = req.body;

  const ctx = getContext(accountId);
  if (!ctx) return res.status(404).json(error("Account not found"));

  const pos = ctx.positions.find((p) => p.id === positionId);

  if (!pos) {
    return res.status(404).json(error("Position not found"));
  }

  pos.stopLoss = stopLoss ?? pos.stopLoss;
  pos.takeProfit = takeProfit ?? pos.takeProfit;

  return res.json(success(pos));
};

// PARTIAL CLOSE
export const partialClose = (req, res) => {
  const { accountId } = req.params;
  const { positionId, volume } = req.body;

  const ctx = getContext(accountId);
  if (!ctx) return res.status(404).json(error("Account not found"));

  const pos = ctx.positions.find((p) => p.id === positionId);

  if (!pos) {
    return res.status(404).json(error("Position not found"));
  }

  if (!volume || volume <= 0 || volume >= pos.volume) {
    return res.status(400).json(error("Invalid volume"));
  }

  const pnl = calculatePnL(pos) * (volume / pos.volume);

  pos.volume -= volume;
  ctx.account.balance += pnl;

  return res.json(
    success({
      remainingVolume: pos.volume,
      closedVolume: volume,
      pnl,
    })
  );
};

// GET ORDERS
export const getOrders = (req, res) => {
  return res.json(
    success([
      {
        id: "ord_1",
        symbol: "EURUSD",
        type: "LIMIT",
        price: 1.095,
        status: "PENDING",
      },
    ])
  );
};

// CANCEL ORDER
export const cancelOrder = (req, res) => {
  const { orderId } = req.params;

  return res.json(
    success({
      cancelledOrderId: orderId,
    })
  );
};

// 🔥 FORCE PRICE MOVE
export const movePrice = (req, res) => {
  const { symbol, bid, ask } = req.body;

  if (!prices[symbol]) {
    return res.status(400).json(error("Invalid symbol"));
  }

  prices[symbol].bid = bid;
  prices[symbol].ask = ask;
  prices[symbol].spread = ask - bid;

  return res.json(success(prices[symbol]));
};

// RESET ACCOUNT
export const resetAccount = (req, res) => {
  const { accountId } = req.params;

  const ctx = getContext(accountId);
  if (!ctx) return res.status(404).json(error("Account not found"));

  ctx.positions.length = 0;
  ctx.history.length = 0;

  ctx.account.balance = 10000;
  ctx.account.marginUsed = 0;

  return res.json(success("Account reset"));
};
