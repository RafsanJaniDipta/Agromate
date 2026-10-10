import { Router } from "express";
import {
  createItem,
  getAdminItems,
  getHighlights,
  getHistory,
  getPrices,
  importTcb,
  reportPrice,
  setOfficialPrice,
  updateItem,
} from "./price.controller.js";
import { authenticate, optionalAuthenticate } from "../../middlewares/auth.middleware.js";
import { adminOnly, farmerOnly } from "../../middlewares/role.middleware.js";

export const priceRouter = Router();

// Public: prices are public information (the home page shows them too)
priceRouter.get("/", optionalAuthenticate, getPrices);
priceRouter.get("/highlights", getHighlights);
priceRouter.get("/items/:id/history", getHistory);

// Farmers report what they paid
priceRouter.post("/reports", authenticate, farmerOnly, reportPrice);

// Admin: the item list, official prices and a manual TCB import
priceRouter.get("/admin/items", authenticate, adminOnly, getAdminItems);
priceRouter.post("/items", authenticate, adminOnly, createItem);
priceRouter.patch("/items/:id", authenticate, adminOnly, updateItem);
priceRouter.post("/items/:id/prices", authenticate, adminOnly, setOfficialPrice);
priceRouter.post("/import/tcb", authenticate, adminOnly, importTcb);
