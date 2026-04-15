import { Router } from "express";
import tradelockerRoutes from "./tradelocker.routes.js";
import accountRoutes from "./account.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ status: "API running" });
});
router.use("/tradelocker", tradelockerRoutes);
router.use("/accounts", accountRoutes);

export default router;