/* eslint-disable prettier/prettier, camelcase, prefer-const, no-unused-vars */
import config from "config";
import assert from "assert";

import spendPoints from "./spendPoints.mjs";

import addPoints from "./addPoints.mjs";

import { startEventFilter, getSiblingPath } from "./common/timber.mjs";
import fs from "fs";
import logger from "./common/logger.mjs";
import { decrypt } from "./common/number-theory.mjs";
import {
	getAllCommitments,
	getCommitmentsByState,
} from "./common/commitment-storage.mjs";
import web3 from "./common/web3.mjs";

/**
      NOTE: this is the api service file, if you need to call any function use the correct url and if Your input contract has two functions, add() and minus().
      minus() cannot be called before an initial add(). */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let leafIndex;
let encryption = {};
// eslint-disable-next-line func-names

export async function StarlightCoffeeShield() {
	try {
		await web3.connect();
	} catch (err) {
		throw new Error(err);
	}
}
// eslint-disable-next-line func-names
export async function service_addPoints(req, res, next) {
	try {
		await web3.connect();
		await new Promise((resolve) => setTimeout(() => resolve(), 3000));
	} catch (err) {
		throw new Error(err);
	}
	try {
		await startEventFilter("StarlightCoffeeShield");
		const { user } = req.body;
		const { points } = req.body;
		const balances_user_newOwnerPublicKey =
			req.body.balances_user_newOwnerPublicKey || 0;
		const { tx, encEvent } = await addPoints(
			user,
			points,
			balances_user_newOwnerPublicKey
		);
		// prints the tx
		console.log(tx);
		res.send({ tx, encEvent });
		// reassigns leafIndex to the index of the first commitment added by this function
		if (tx.event) {
			leafIndex = tx.returnValues[0];
			// prints the new leaves (commitments) added by this function call
			console.log(`Merkle tree event returnValues:`);
			console.log(tx.returnValues);
		}
		if (encEvent.event) {
			encryption.msgs = encEvent[0].returnValues[0];
			encryption.key = encEvent[0].returnValues[1];
			console.log("EncryptedMsgs:");
			console.log(encEvent[0].returnValues[0]);
		}
		await sleep(10);
	} catch (err) {
		logger.error(err);
		res.send({ errors: [err.message] });
	}
}

// eslint-disable-next-line func-names
export async function service_spendPoints(req, res, next) {
	try {
		await web3.connect();
		await new Promise((resolve) => setTimeout(() => resolve(), 3000));
	} catch (err) {
		throw new Error(err);
	}
	try {
		await startEventFilter("StarlightCoffeeShield");
		const { user } = req.body;
		const { points } = req.body;
		const balances_user_newOwnerPublicKey =
			req.body.balances_user_newOwnerPublicKey || 0;
		const { tx, encEvent } = await spendPoints(
			user,
			points,
			balances_user_newOwnerPublicKey
		);
		// prints the tx
		console.log(tx);
		res.send({ tx, encEvent });
		// reassigns leafIndex to the index of the first commitment added by this function
		if (tx.event) {
			leafIndex = tx.returnValues[0];
			// prints the new leaves (commitments) added by this function call
			console.log(`Merkle tree event returnValues:`);
			console.log(tx.returnValues);
		}
		if (encEvent.event) {
			encryption.msgs = encEvent[0].returnValues[0];
			encryption.key = encEvent[0].returnValues[1];
			console.log("EncryptedMsgs:");
			console.log(encEvent[0].returnValues[0]);
		}
		await sleep(10);
	} catch (err) {
		logger.error(err);
		res.send({ errors: [err.message] });
	}
}

export async function service_allCommitments(req, res, next) {
	try {
		const commitments = await getAllCommitments();
		res.send({ commitments });
		await sleep(10);
	} catch (err) {
		logger.error(err);
		res.send({ errors: [err.message] });
	}
}

export async function service_getCommitmentsByState(req, res, next) {
	try {
		const { name, mappingKey } = req.body;
		const commitments = await getCommitmentsByState(name, mappingKey);

		let totalPoints = 0;

		commitments.forEach((commitment) => {
			totalPoints += Number(commitment.preimage.value);
		});

		res.send({ totalPoints, commitments });
		await sleep(10);
	} catch (err) {
		logger.error(err);
		res.send({ errors: [err.message] });
	}
}
