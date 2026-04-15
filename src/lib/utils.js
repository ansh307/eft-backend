import { prices } from "../data/tradelocker.data.js";

export function calculatePnL(position) {
  const currentPrice = prices[position.symbol];

  const diff =
    position.side === "BUY"
      ? currentPrice - position.openPrice
      : position.openPrice - currentPrice;

  return diff * position.volume * 1000;
}