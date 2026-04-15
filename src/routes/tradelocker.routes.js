import express from "express";
import * as ctrl from "../controllers/tradelocker.controller.js";

const router = express.Router();

router.post("/auth/login", ctrl.login);

router.get("/accounts/:accountId", ctrl.getAccount);

router.get("/symbols", ctrl.getSymbols);
router.get("/price", ctrl.getPrice);

router.get("/accounts/:accountId/positions", ctrl.getPositions);
router.post("/accounts/:accountId/orders", ctrl.placeOrder);
router.post("/accounts/:accountId/positions/close", ctrl.closePosition);
router.get("/accounts/:accountId/history", ctrl.getHistory);

export default router;