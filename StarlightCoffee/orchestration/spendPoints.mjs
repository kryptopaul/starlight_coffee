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

export default async function spendPoints(
	_user,
	_points,
	_balances_user_newOwnerPublicKey = 0,
	_balances_user_0_oldCommitment = 0,
	_balances_user_1_oldCommitment = 0
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

	// Initialise commitment preimage of whole state:

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

	let balances_user_commitmentExists = true;
	let balances_user_witnessRequired = true;

	const balances_user_commitment = await getCurrentWholeCommitment(
		balances_user_stateVarId
	);

	let balances_user_preimage = {
		value: 0,
		salt: 0,
		commitment: 0,
	};
	if (!balances_user_commitment) {
		balances_user_commitmentExists = false;
		balances_user_witnessRequired = false;
	} else {
		balances_user_preimage = balances_user_commitment.preimage;
	}

	// read preimage for whole state
	balances_user_newOwnerPublicKey =
		_balances_user_newOwnerPublicKey === 0
			? generalise(
					await instance.methods
						.zkpPublicKeys(await instance.methods.owner().call())
						.call()
			  )
			: balances_user_newOwnerPublicKey;

	const balances_user_currentCommitment = balances_user_commitmentExists
		? generalise(balances_user_commitment._id)
		: generalise(0);
	const balances_user_prev = generalise(balances_user_preimage.value);
	const balances_user_prevSalt = generalise(balances_user_preimage.salt);

	// Extract set membership witness:

	// generate witness for whole state
	const balances_user_emptyPath = new Array(32).fill(0);
	const balances_user_witness = balances_user_witnessRequired
		? await getMembershipWitness(
				"StarlightCoffeeShield",
				balances_user_currentCommitment.integer
		  )
		: {
				index: 0,
				path: balances_user_emptyPath,
				root: (await getRoot("StarlightCoffeeShield")) || 0,
		  };
	const balances_user_index = generalise(balances_user_witness.index);
	const balances_user_root = generalise(balances_user_witness.root);
	const balances_user_path = generalise(balances_user_witness.path).all;

	let balances_user = generalise(balances_user_preimage.value);
	balances_user =
		parseInt(balances_user.integer, 10) - parseInt(points.integer, 10);

	balances_user = generalise(balances_user);

	// Calculate nullifier(s):

	let balances_user_nullifier = balances_user_commitmentExists
		? poseidonHash([
				BigInt(balances_user_stateVarId),
				BigInt(secretKey.hex(32)),
				BigInt(balances_user_prevSalt.hex(32)),
		  ])
		: poseidonHash([
				BigInt(balances_user_stateVarId),
				BigInt(generalise(0).hex(32)),
				BigInt(balances_user_prevSalt.hex(32)),
		  ]);

	balances_user_nullifier = generalise(balances_user_nullifier.hex(32)); // truncate

	// Non-membership witness for Nullifier
	const balances_user_nullifier_NonMembership_witness = getnullifierMembershipWitness(
		balances_user_nullifier
	);

	const balances_user_nullifierRoot = generalise(
		balances_user_nullifier_NonMembership_witness.root
	);
	const balances_user_nullifier_path = generalise(
		balances_user_nullifier_NonMembership_witness.path
	).all;

	await temporaryUpdateNullifier(balances_user_nullifier);

	// Get the new updated nullifier Paths
	const balances_user_updated_nullifier_NonMembership_witness = getupdatedNullifierPaths(
		balances_user_nullifier
	);
	const balances_user_nullifier_updatedpath = generalise(
		balances_user_updated_nullifier_NonMembership_witness.path
	).all;
	const balances_user_newNullifierRoot = generalise(
		balances_user_updated_nullifier_NonMembership_witness.root
	);

	// Calculate commitment(s):

	const balances_user_newSalt = generalise(utils.randomHex(31));

	let balances_user_newCommitment = poseidonHash([
		BigInt(balances_user_stateVarId),
		BigInt(balances_user.hex(32)),
		BigInt(balances_user_newOwnerPublicKey.hex(32)),
		BigInt(balances_user_newSalt.hex(32)),
	]);

	balances_user_newCommitment = generalise(balances_user_newCommitment.hex(32)); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		user.integer,
		points.integer,
		balances_user_commitmentExists ? secretKey.integer : generalise(0).integer,
		balances_user_nullifierRoot.integer,
		balances_user_newNullifierRoot.integer,
		balances_user_nullifier.integer,
		balances_user_nullifier_path.integer,
		balances_user_nullifier_updatedpath.integer,
		balances_user_prev.integer,
		balances_user_prevSalt.integer,
		balances_user_commitmentExists ? 0 : 1,
		balances_user_root.integer,
		balances_user_index.integer,
		balances_user_path.integer,
		balances_user_newOwnerPublicKey.integer,
		balances_user_newSalt.integer,
		balances_user_newCommitment.integer,
	].flat(Infinity);
	const res = await generateProof("spendPoints", allInputs);
	const proof = generalise(Object.values(res.proof).flat(Infinity))
		.map((coeff) => coeff.integer)
		.flat(Infinity);

	// Send transaction to the blockchain:

	const txData = await instance.methods
		.spendPoints(
			balances_user_nullifierRoot.integer,
			balances_user_newNullifierRoot.integer,
			[balances_user_nullifier.integer],
			balances_user_root.integer,
			[balances_user_newCommitment.integer],
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

	if (balances_user_commitmentExists)
		await markNullified(balances_user_currentCommitment, secretKey.hex(32));
	else await updateNullifierTree(); // Else we always update it in markNullified

	await storeCommitment({
		hash: balances_user_newCommitment,
		name: "balances",
		mappingKey: balances_user_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(balances_user_stateVarId),
			value: balances_user,
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
