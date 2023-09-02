import { service_addPoints } from "./api_services.mjs";

import { service_spendPoints } from "./api_services.mjs";

import {
	service_allCommitments,
	service_getCommitmentsByState,
} from "./api_services.mjs";

import express from "express";

const router = express.Router();

// eslint-disable-next-line func-names
router.post("/addPoints", service_addPoints);

// eslint-disable-next-line func-names
router.post("/spendPoints", service_spendPoints);

// commitment getter routes
router.get("/getAllCommitments", service_allCommitments);
router.get("/getCommitmentsByVariableName", service_getCommitmentsByState);

export default router;
