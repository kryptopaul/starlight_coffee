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

	// read preimage for decremented state

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

	let balances_user_preimage = await getCommitmentsById(
		balances_user_stateVarId
	);

	const balances_user_newCommitmentValue = generalise(
		parseInt(points.integer, 10)
	);
	// First check if required commitments exist or not

	let [
		balances_user_commitmentFlag,
		balances_user_0_oldCommitment,
		balances_user_1_oldCommitment,
	] = getInputCommitments(
		publicKey.hex(32),
		balances_user_newCommitmentValue.integer,
		balances_user_preimage
	);

	let balances_user_witness_0;

	let balances_user_witness_1;

	while (balances_user_commitmentFlag === false) {
		balances_user_witness_0 = await getMembershipWitness(
			"StarlightCoffeeShield",
			generalise(balances_user_0_oldCommitment._id).integer
		);

		balances_user_witness_1 = await getMembershipWitness(
			"StarlightCoffeeShield",
			generalise(balances_user_1_oldCommitment._id).integer
		);

		const tx = await joinCommitments(
			"StarlightCoffeeShield",
			"balances",
			secretKey,
			publicKey,
			[7, balances_user_stateVarId_key],
			[balances_user_0_oldCommitment, balances_user_1_oldCommitment],
			[balances_user_witness_0, balances_user_witness_1],
			instance,
			contractAddr,
			web3
		);

		balances_user_preimage = await getCommitmentsById(balances_user_stateVarId);

		[
			balances_user_commitmentFlag,
			balances_user_0_oldCommitment,
			balances_user_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			balances_user_newCommitmentValue.integer,
			balances_user_preimage
		);
	}
	const balances_user_0_prevSalt = generalise(
		balances_user_0_oldCommitment.preimage.salt
	);
	const balances_user_1_prevSalt = generalise(
		balances_user_1_oldCommitment.preimage.salt
	);
	const balances_user_0_prev = generalise(
		balances_user_0_oldCommitment.preimage.value
	);
	const balances_user_1_prev = generalise(
		balances_user_1_oldCommitment.preimage.value
	);

	// Extract set membership witness:

	// generate witness for partitioned state
	balances_user_witness_0 = await getMembershipWitness(
		"StarlightCoffeeShield",
		generalise(balances_user_0_oldCommitment._id).integer
	);
	balances_user_witness_1 = await getMembershipWitness(
		"StarlightCoffeeShield",
		generalise(balances_user_1_oldCommitment._id).integer
	);
	const balances_user_0_index = generalise(balances_user_witness_0.index);
	const balances_user_1_index = generalise(balances_user_witness_1.index);
	const balances_user_root = generalise(balances_user_witness_0.root);
	const balances_user_0_path = generalise(balances_user_witness_0.path).all;
	const balances_user_1_path = generalise(balances_user_witness_1.path).all;

	// increment would go here but has been filtered out

	// Calculate nullifier(s):

	let balances_user_0_nullifier = poseidonHash([
		BigInt(balances_user_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(balances_user_0_prevSalt.hex(32)),
	]);
	let balances_user_1_nullifier = poseidonHash([
		BigInt(balances_user_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(balances_user_1_prevSalt.hex(32)),
	]);
	balances_user_0_nullifier = generalise(balances_user_0_nullifier.hex(32)); // truncate
	balances_user_1_nullifier = generalise(balances_user_1_nullifier.hex(32)); // truncate
	// Non-membership witness for Nullifier
	const balances_user_0_nullifier_NonMembership_witness = getnullifierMembershipWitness(
		balances_user_0_nullifier
	);
	const balances_user_1_nullifier_NonMembership_witness = getnullifierMembershipWitness(
		balances_user_1_nullifier
	);

	const balances_user_nullifierRoot = generalise(
		balances_user_0_nullifier_NonMembership_witness.root
	);
	const balances_user_0_nullifier_path = generalise(
		balances_user_0_nullifier_NonMembership_witness.path
	).all;
	const balances_user_1_nullifier_path = generalise(
		balances_user_1_nullifier_NonMembership_witness.path
	).all;

	await temporaryUpdateNullifier(balances_user_0_nullifier);
	await temporaryUpdateNullifier(balances_user_1_nullifier);

	// Get the new updated nullifier Paths
	const balances_user_0_updated_nullifier_NonMembership_witness = getupdatedNullifierPaths(
		balances_user_0_nullifier
	);
	const balances_user_1_updated_nullifier_NonMembership_witness = getupdatedNullifierPaths(
		balances_user_1_nullifier
	);

	const balances_user_newNullifierRoot = generalise(
		balances_user_0_updated_nullifier_NonMembership_witness.root
	);
	const balances_user_0_nullifier_updatedpath = generalise(
		balances_user_0_updated_nullifier_NonMembership_witness.path
	).all;
	const balances_user_1_nullifier_updatedpath = generalise(
		balances_user_1_updated_nullifier_NonMembership_witness.path
	).all;

	// Calculate commitment(s):

	const balances_user_2_newSalt = generalise(utils.randomHex(31));

	let balances_user_change =
		parseInt(balances_user_0_prev.integer, 10) +
		parseInt(balances_user_1_prev.integer, 10) -
		parseInt(balances_user_newCommitmentValue.integer, 10);

	balances_user_change = generalise(balances_user_change);

	let balances_user_2_newCommitment = poseidonHash([
		BigInt(balances_user_stateVarId),
		BigInt(balances_user_change.hex(32)),
		BigInt(publicKey.hex(32)),
		BigInt(balances_user_2_newSalt.hex(32)),
	]);

	balances_user_2_newCommitment = generalise(
		balances_user_2_newCommitment.hex(32)
	); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		user.integer,
		points.integer,
		secretKey.integer,
		secretKey.integer,
		balances_user_nullifierRoot.integer,
		balances_user_newNullifierRoot.integer,
		balances_user_0_nullifier.integer,
		balances_user_0_nullifier_path.integer,
		balances_user_0_nullifier_updatedpath.integer,
		balances_user_1_nullifier.integer,
		balances_user_1_nullifier_path.integer,
		balances_user_1_nullifier_updatedpath.integer,
		balances_user_0_prev.integer,
		balances_user_0_prevSalt.integer,
		balances_user_1_prev.integer,
		balances_user_1_prevSalt.integer,
		balances_user_root.integer,
		balances_user_0_index.integer,
		balances_user_0_path.integer,
		balances_user_1_index.integer,
		balances_user_1_path.integer,
		balances_user_newOwnerPublicKey.integer,
		balances_user_2_newSalt.integer,
		balances_user_2_newCommitment.integer,
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
			[balances_user_0_nullifier.integer, balances_user_1_nullifier.integer],
			balances_user_root.integer,
			[balances_user_2_newCommitment.integer],
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

	await markNullified(
		generalise(balances_user_0_oldCommitment._id),
		secretKey.hex(32)
	);

	await markNullified(
		generalise(balances_user_1_oldCommitment._id),
		secretKey.hex(32)
	);

	await storeCommitment({
		hash: balances_user_2_newCommitment,
		name: "balances",
		mappingKey: balances_user_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(balances_user_stateVarId),
			value: balances_user_change,
			salt: balances_user_2_newSalt,
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
