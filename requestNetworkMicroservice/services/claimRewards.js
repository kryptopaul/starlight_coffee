const {
    EthereumPrivateKeySignatureProvider,
} = require("@requestnetwork/epk-signature");
const { Types, Utils, RequestNetwork } = require("@requestnetwork/request-client.js");
const { ExtensionTypes } = require('@requestnetwork/types');
const axios = require('axios');
const { Web3 } = require('web3');
require("dotenv").config();
const web3 = new Web3();
const payeeWallet = web3.eth.accounts.privateKeyToAccount(process.env.PAYEE_PRIVATE_KEY).address;

async function claimRewards(id) {
    try {

    const payeeSignatureProvider = new EthereumPrivateKeySignatureProvider({
        method: Types.Signature.METHOD.ECDSA,
        privateKey: process.env.PAYEE_PRIVATE_KEY, // Must include 0x prefix
    });

    const payeeRequestClient = new RequestNetwork({
        nodeConnectionConfig: {
            baseURL: "https://goerli.gateway.request.network/",
        },
        signatureProvider: payeeSignatureProvider,
    });

    const payeeRequest = await payeeRequestClient.fromRequestId(
        id,
    );

    const payeeRequestData = payeeRequest.getData();

    const user = payeeRequestData.contentData.userID;
    const points = payeeRequestData.contentData.points;
    console.log(`Adding ${points} points to user ${user}`);
    // Call Starlight here
    await axios.post('http://zapp:3000/addPoints', {
        user,
        points
    })
    console.log(`Claimed rewards for request ${id}`)
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    claimRewards
}