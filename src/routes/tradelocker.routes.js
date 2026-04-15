import express from "express";
import * as ctrl from "../controllers/tradelocker.controller.js";

const router = express.Router();

router.post("/auth/login", ctrl.login);

router.get("/account", ctrl.getAccount);

router.get("/symbols", ctrl.getSymbols);
router.get("/price", ctrl.getPrice);

router.get("/positions", ctrl.getPositions);

router.post("/orders", ctrl.placeOrder);
router.post("/positions/close", ctrl.closePosition);

router.get("/history/trades", ctrl.getHistory);

export default router;