import { v4 as uuid } from "uuid";
import {
  account,
  positions,
  prices,
  symbols,
  tradeHistory,
} from "../data/tradelocker.data.js";
import { calculatePnL } from "../lib/utils.js";

// --- Helpers ---
const delay = () =>
  new Promise((r) => setTimeout(r, 100 + Math.random() * 300));

const maybeFail = () => Math.random() < 0.03;

const success = (data) => ({ success: true, data });
const error = (message) => ({ success: false, error: message });

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
      return res
        .status(500)
        .json(error("Liquidity provider error"));
    }

    const { symbol, volume, side, stopLoss, takeProfit } = req.body;

    // Validation
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

    // --- Execution price (bid/ask)
    const basePrice =
      side === "BUY" ? market.ask : market.bid;

    // --- Slippage
    const slippage = basePrice * (Math.random() * 0.0005);

    const executedPrice =
      side === "BUY"
        ? basePrice + slippage
        : basePrice - slippage;

    // --- Margin Calculation
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

    // --- Create position
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

    // --- Update account
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
    return res.status(500).json(error("Order execution failed"));
  }
};

// --- CLOSE POSITION ---
export const closePosition = async (req, res) => {
  await delay();

  try {
    const { positionId } = req.body;

    if (!positionId) {
      return res.status(400).json(error("positionId required"));
    }

    const index = positions.findIndex((p) => p.id === positionId);

    if (index === -1) {
      return res.status(404).json(error("Position not found"));
    }

    const position = positions[index];

    const market = prices[position.symbol];

    const closePrice =
      position.side === "BUY" ? market.bid : market.ask;

    const pnl = calculatePnL(position);

    // --- Update balance
    account.balance += pnl;

    // --- Release margin
    account.marginUsed -= position.margin;

    positions.splice(index, 1);

    // --- Save history
    const trade = {
      ...position,
      closePrice,
      pnl,
      closedAt: Date.now(),
    };

    tradeHistory.push(trade);

    return res.json(
      success({
        closedPositionId: positionId,
        closePrice,
        pnl,
        balance: account.balance,
      })
    );
  } catch (err) {
    return res.status(500).json(error("Failed to close position"));
  }
};

// --- HISTORY ---
export const getHistory = (req, res) => {
  return res.json(success(tradeHistory));
};