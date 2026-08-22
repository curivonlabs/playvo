import { Router } from "express";
import upload from "../middleware/upload.js";
import { createFile, getAllApps } from "../controllers/file.controller.js";

const router = Router();

router.post("/create", upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "app", maxCount: 1 }
  ]), createFile);

router.get("/apps", getAllApps);

export default router;