const { RequestNetwork, Types } = require("@requestnetwork/request-client.js");
const {
    EthereumPrivateKeySignatureProvider,
} = require("@requestnetwork/epk-signature");
const { IdentityTypes } = require('@requestnetwork/types');

require("dotenv").config();
const {Web3} = require('web3');
const web3 = new Web3();

const payeeWallet = web3.eth.accounts.privateKeyToAccount(process.env.PAYEE_PRIVATE_KEY).address;
const payerWallet = web3.eth.accounts.privateKeyToAccount(process.env.PAYER_PRIVATE_KEY).address;

console.log(`Payer wallet: ${payerWallet}`)
console.log(`Payee wallet: ${payeeWallet}`)

const payerSignatureProvider = new EthereumPrivateKeySignatureProvider({
    method: Types.Signature.METHOD.ECDSA,
    privateKey: process.env.PAYER_PRIVATE_KEY, // Must include 0x prefix
});

const payeeSignatureProvider = new EthereumPrivateKeySignatureProvider({
    method: Types.Signature.METHOD.ECDSA,
    privateKey: process.env.PAYEE_PRIVATE_KEY, // Must include 0x prefix
});

async function payRequest(id) {
    const payerRequestClient = new RequestNetwork({
        nodeConnectionConfig: {
            baseURL: "https://goerli.gateway.request.network/",
        },
        signatureProvider: payerSignatureProvider,
    });

    const payerRequest = await payerRequestClient.fromRequestId(
        id,
    );
    const payerRequestData = payerRequest.getData();
    const price = payerRequestData.contentData.sum;
    // In real world scenario, this would be replaced with a more appropriate contract price.
    await payerRequest.declareSentPayment(
        price,
        "Payment for coffee",
        {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: payerWallet,
        }

    );

    const payeeRequestClient = new RequestNetwork({
        nodeConnectionConfig: {
            baseURL: "https://goerli.gateway.request.network/",
        },
        signatureProvider: payeeSignatureProvider,
    });

    const payeeRequest = await payeeRequestClient.fromRequestId(
        id,
    );


    await payeeRequest.declareReceivedPayment(
        price,
        "Payment for coffee",
        {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: payeeWallet,
        }

    );

    console.log(`Paid and settled request ${id}`)
    return "Payment settled";

}

// Helper function
const waitForConfirmation = async (
    dataOrPromise
) => {
    const data = await dataOrPromise;
    return new Promise((resolve, reject) => {
        data.on('confirmed', resolve);
        data.on('error', reject);
    });
};

module.exports = {
    payRequest
}