import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";
import { getCropReport, getYearReport } from "./farmReport.service.js";

// Farm reports (mounted at /api/farm-reports)
export const farmReportRouter = Router();

farmReportRouter.use(authenticate, farmerOnly);

// GET /api/farm-reports/years/2026 → every crop planted that year, with totals
farmReportRouter.get(
  "/years/:year",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, 200, "Year report ready", await getYearReport(req.user!.id, Number(req.params.year)));
  }),
);

// GET /api/farm-reports/crops/:cropCycleId → one crop season, line by line
farmReportRouter.get(
  "/crops/:id",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, 200, "Crop report ready", await getCropReport(req.user!.id, String(req.params.id ?? "")));
  }),
);
