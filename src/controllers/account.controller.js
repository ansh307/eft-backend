import { v4 as uuid } from "uuid";
import {
  accounts,
  accountPositions,
  accountHistory,
} from "../data/tradelocker.data.js";

const success = (data) => ({ success: true, data });
const error = (msg) => ({ success: false, error: msg });

// --- CREATE ACCOUNT ---
export const createAccount = (req, res) => {
  try {
    const { balance = 10000, leverage = 100 } = req.body;

    const newAccount = {
      id: uuid(),
      userId: "user_1",
      currency: "USD",

      balance,
      equity: balance,

      leverage,
      marginUsed: 0,
      freeMargin: balance,
      marginLevel: 0,

      createdAt: Date.now(),
    };

    accounts.push(newAccount);

    // initialize maps
    accountPositions[newAccount.id] = [];
    accountHistory[newAccount.id] = [];

    return res.json(success(newAccount));
  } catch (err) {
    return res.status(500).json(error("Failed to create account"));
  }
};

// --- GET ALL ACCOUNTS ---
export const getAccounts = (req, res) => {
  return res.json(success(accounts));
};

// --- GET SINGLE ACCOUNT ---
export const getAccountById = (req, res) => {
  const { accountId } = req.params;

  const account = accounts.find((a) => a.id === accountId);

  if (!account) {
    return res.status(404).json(error("Account not found"));
  }

  return res.json(success(account));
};

// --- DELETE ACCOUNT ---
export const deleteAccount = (req, res) => {
  const { accountId } = req.params;

  const index = accounts.findIndex((a) => a.id === accountId);

  if (index === -1) {
    return res.status(404).json(error("Account not found"));
  }

  const acc = accounts[index];

  // cleanup maps
  delete accountPositions[accountId];
  delete accountHistory[accountId];

  accounts.splice(index, 1);

  return res.json(success({ deletedAccountId: acc.id }));
};