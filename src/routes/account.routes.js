import express from "express";
import * as ctrl from "../controllers/account.controller.js";

const router = express.Router();

router.get("/", ctrl.getAccounts);
router.post("/create", ctrl.createAccount);

router.get("/:accountId", ctrl.getAccountById);
router.delete("/:accountId", ctrl.deleteAccount);

export default router;