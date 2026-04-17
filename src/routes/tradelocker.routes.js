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

router.get("/accounts/:accountId/positions/:positionId", ctrl.getPositionById);

router.post("/accounts/:accountId/positions/modify", ctrl.modifyPosition);

router.post("/accounts/:accountId/positions/partial-close", ctrl.partialClose);

router.get("/accounts/:accountId/orders", ctrl.getOrders);
router.delete("/accounts/:accountId/orders/:orderId", ctrl.cancelOrder);

// testing routes
router.post("/accounts/:accountId/test/reset", ctrl.resetAccount);
router.post("/test/move-price", ctrl.movePrice);

export default router;