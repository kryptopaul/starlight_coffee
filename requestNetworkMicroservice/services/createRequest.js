const {
  EthereumPrivateKeySignatureProvider,
} = require("@requestnetwork/epk-signature");
const { Types, Utils, RequestNetwork } = require("@requestnetwork/request-client.js");
const { ExtensionTypes } = require('@requestnetwork/types');
const {Web3} = require('web3');
require("dotenv").config();
const web3 = new Web3();

const payeeWallet = web3.eth.accounts.privateKeyToAccount(process.env.PAYEE_PRIVATE_KEY).address;
const payerWallet = web3.eth.accounts.privateKeyToAccount(process.env.PAYER_PRIVATE_KEY).address;

console.log(`Payer wallet: ${payerWallet}`)
console.log(`Payee wallet: ${payeeWallet}`)


const epkSignatureProvider = new EthereumPrivateKeySignatureProvider({
  method: Types.Signature.METHOD.ECDSA,
  privateKey: process.env.PAYEE_PRIVATE_KEY, // Must include 0x prefix
});


async function createRequest(coffees, sum, points, userID) {

  const payeeIdentity = payeeWallet;

  const requestClient = new RequestNetwork({
    nodeConnectionConfig: {
      baseURL: "https://goerli.gateway.request.network/",
    },
    signatureProvider: epkSignatureProvider,
  });

  const requestCreateParameters = {
    paymentNetwork: {
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
      parameters: {},
    },
    requestInfo: {

      payer : {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: payerWallet,
      },
      // The currency in which the request is denominated
      currency: {
        type: Types.RequestLogic.CURRENCY.ERC20,
        value: '0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc',
        network: 'goerli',
      },

      // The expected amount as a string, in parsed units, respecting `decimals`
      // Consider using `parseUnits()` from ethers or viem
      expectedAmount: '20', // todo add zeros later

      // The payee identity. Not necessarily the same as the payment recipient.
      payee: {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: payeeWallet,
      },

      // The request creation timestamp.
      timestamp: Utils.getCurrentTimestampInSecond(),
    },

    // The contentData can contain anything.
    // Consider using rnf_invoice format from @requestnetwork/data-format
    contentData: {
      userID: userID ? userID : 0,
      coffees: coffees ? coffees : 0,
      sum: sum ? sum : 0,
      points: points ? points : 0,
      reason: `Coffee Order`,
      dueDate: getCurrentDate(),
    },

    // The identity that signs the request, either payee or payer identity.
    signer: {
      type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
      value: payeeWallet,
    },
  };

  const request = await requestClient.createRequest(requestCreateParameters);
  await request.waitForConfirmation();
  return request;
}


// util function
function getCurrentDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Adding 1 to month because it's zero-based
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}

module.exports = {
  createRequest
}