const {
  RequestNetwork,
  Types,
  Utils,
} = require("@requestnetwork/request-client.js");
const {
  EthereumPrivateKeySignatureProvider,
} = require("@requestnetwork/epk-signature");
const { config } = require("dotenv");

export default async function createRequest(amount) {
  // Load environment variables from .env file (without overriding variables already set)
  config();

  const epkSignatureProvider = new EthereumPrivateKeySignatureProvider({
    method: Types.Signature.METHOD.ECDSA,
    privateKey: process.env.PAYEE_PRIVATE_KEY, // Must include 0x prefix
  });

  const requestClient = new RequestNetwork({
    nodeConnectionConfig: {
      baseURL: "https://goerli.gateway.request.network/",
    },
    signatureProvider: epkSignatureProvider,
  });

  // In this example, the payee is also the payer and payment recipient.
  const payeeIdentity = "0x7eB023BFbAeE228de6DC5B92D0BeEB1eDb1Fd567";
  const payerIdentity = payeeIdentity;
  const paymentRecipient = payeeIdentity;
  const feeRecipient = "0xeFeECadFF1E463481aB53Ba91Ad6ac376CdC68D4";

  const requestCreateParameters = {
    requestInfo: {
      currency: {
        type: Types.RequestLogic.CURRENCY.ERC20,
        value: "0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc",
        network: "goerli",
      },
      expectedAmount: "1000000000000000000",
      payee: {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: payeeIdentity,
      },
      payer: {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: payerIdentity,
      },
      timestamp: Utils.getCurrentTimestampInSecond(),
    },
    paymentNetwork: {
      id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      parameters: {
        paymentNetworkName: "goerli",
        paymentAddress: paymentRecipient,
        feeAddress: feeRecipient,
        feeAmount: "0",
      },
    },
    contentData: {
      reason: "🍕",
      dueDate: "2023.06.16",
    },
    signer: {
      type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
      value: payeeIdentity,
    },
  };

  const request = await requestClient.createRequest(requestCreateParameters);
  const requestData = await request.waitForConfirmation();
  console.log(JSON.stringify(requestData));
}
