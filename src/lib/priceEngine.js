import { prices } from "../data/tradelocker.data.js";

setInterval(() => {
  Object.keys(prices).forEach((symbol) => {
    const change = (Math.random() - 0.5) * (prices[symbol] * 0.001);
    prices[symbol] += change;
  });
}, 1000);