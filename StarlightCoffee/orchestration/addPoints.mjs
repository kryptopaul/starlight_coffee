/* eslint-disable prettier/prettier, camelcase, prefer-const, no-unused-vars */
import config from "config";
import utils from "zkp-utils";
import GN from "general-number";
import fs from "fs";

import {
	getContractInstance,
	getContractAddress,
	registerKey,
} from "./common/contract.mjs";
import {
	storeCommitment,
	getCurrentWholeCommitment,
	getCommitmentsById,
	getAllCommitments,
	getInputCommitments,
	joinCommitments,
	markNullified,
	getnullifierMembershipWitness,
	getupdatedNullifierPaths,
	temporaryUpdateNullifier,
	updateNullifierTree,
} from "./common/commitment-storage.mjs";
import { generateProof } from "./common/zokrates.mjs";
import { getMembershipWitness, getRoot } from "./common/timber.mjs";
import Web3 from "./common/web3.mjs";
import {
	decompressStarlightKey,
	poseidonHash,
} from "./common/number-theory.mjs";

const { generalise } = GN;
const db = "/app/orchestration/common/db/preimage.json";
const web3 = Web3.connection();
const keyDb = "/app/orchestration/common/db/key.json";

export default async function addPoints(
	_user,
	_points,
	_balances_user_newOwnerPublicKey = 0
) {
	// Initialisation of variables:

	const instance = await getContractInstance("StarlightCoffeeShield");

	const contractAddr = await getContractAddress("StarlightCoffeeShield");

	const msgValue = 0;
	const user = generalise(_user);
	const points = generalise(_points);
	let balances_user_newOwnerPublicKey = generalise(
		_balances_user_newOwnerPublicKey
	);

	// Read dbs for keys and previous commitment values:

	if (!fs.existsSync(keyDb))
		await registerKey(utils.randomHex(31), "StarlightCoffeeShield", true);
	const keys = JSON.parse(
		fs.readFileSync(keyDb, "utf-8", (err) => {
			console.log(err);
		})
	);
	const secretKey = generalise(keys.secretKey);
	const publicKey = generalise(keys.publicKey);

	// read preimage for incremented state
	balances_user_newOwnerPublicKey =
		_balances_user_newOwnerPublicKey === 0
			? generalise(
					await instance.methods
						.zkpPublicKeys(await instance.methods.owner().call())
						.call()
			  )
			: balances_user_newOwnerPublicKey;

	let balances_user_stateVarId = 7;

	const balances_user_stateVarId_key = user;

	balances_user_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(balances_user_stateVarId).bigInt,
				balances_user_stateVarId_key.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	const balances_user_newCommitmentValue = generalise(
		parseInt(points.integer, 10)
	);

	// increment would go here but has been filtered out

	// Calculate commitment(s):

	const balances_user_newSalt = generalise(utils.randomHex(31));

	let balances_user_newCommitment = poseidonHash([
		BigInt(balances_user_stateVarId),
		BigInt(balances_user_newCommitmentValue.hex(32)),
		BigInt(balances_user_newOwnerPublicKey.hex(32)),
		BigInt(balances_user_newSalt.hex(32)),
	]);

	balances_user_newCommitment = generalise(balances_user_newCommitment.hex(32)); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		user.integer,
		points.integer,

		balances_user_newSalt.integer,
		balances_user_newCommitment.integer,
		generalise(utils.randomHex(31)).integer,
		[
			decompressStarlightKey(balances_user_newOwnerPublicKey)[0].integer,
			decompressStarlightKey(balances_user_newOwnerPublicKey)[1].integer,
		],
	].flat(Infinity);
	const res = await generateProof("addPoints", allInputs);
	const proof = generalise(Object.values(res.proof).flat(Infinity))
		.map((coeff) => coeff.integer)
		.flat(Infinity);
	const balances_user_cipherText = res.inputs
		.slice(-5, -2)
		.map((e) => generalise(e).integer);
	const balances_user_encKey = res.inputs
		.slice(-2)
		.map((e) => generalise(e).integer);

	// Send transaction to the blockchain:

	const txData = await instance.methods
		.addPoints(
			[balances_user_newCommitment.integer],
			[balances_user_cipherText],
			[balances_user_encKey],
			proof
		)
		.encodeABI();

	let txParams = {
		from: config.web3.options.defaultAccount,
		to: contractAddr,
		gas: config.web3.options.defaultGas,
		gasPrice: config.web3.options.defaultGasPrice,
		data: txData,
		chainId: await web3.eth.net.getId(),
	};

	const key = config.web3.key;

	const signed = await web3.eth.accounts.signTransaction(txParams, key);

	const sendTxn = await web3.eth.sendSignedTransaction(signed.rawTransaction);

	let tx = await instance.getPastEvents("NewLeaves");

	tx = tx[0];

	if (!tx) {
		throw new Error(
			"Tx failed - the commitment was not accepted on-chain, or the contract is not deployed."
		);
	}

	let encEvent = "";

	try {
		encEvent = await instance.getPastEvents("EncryptedData");
	} catch (err) {
		console.log("No encrypted event");
	}

	// Write new commitment preimage to db:

	await storeCommitment({
		hash: balances_user_newCommitment,
		name: "balances",
		mappingKey: balances_user_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(balances_user_stateVarId),
			value: balances_user_newCommitmentValue,
			salt: balances_user_newSalt,
			publicKey: balances_user_newOwnerPublicKey,
		},
		secretKey:
			balances_user_newOwnerPublicKey.integer === publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	});

	return { tx, encEvent };
}
