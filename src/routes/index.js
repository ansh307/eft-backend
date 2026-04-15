import { Router } from "express";
import tradelockerRoutes from "./tradelocker.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ status: "API running" });
});
router.use("/tradelocker", tradelockerRoutes);

export default router;