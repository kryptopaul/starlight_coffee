const express = require('express')
const cors = require('cors');
const createRequest = require('./services/createRequest');
const payRequest = require('./services/payRequest');
const claimRewards = require('./services/claimRewards');
const port = 3101
const app = express();
app.use(express.json());
app.use(cors());

const menu = {
    filteredCoffee: 5
}

const sampleOrder = {
    filteredCoffee: 2
}


app.post('/orderIntent', async (req, res) => {
    console.log('Received a request to recieve order')
    // const order = req.body.order;
    const order = req.body.order
    const userID = req.body.userID
    let sum = 0;
    let coffees = 0;

    Object.keys(order).forEach(key => {
        sum += order[key] * menu[key]
        coffees += order[key]
    })
    const points = sum; // 1 $ = 1 point
    console.log("Submitting:")
    console.log(`Sum: ${sum}`);
    console.log(`Coffees: ${coffees}`);
    console.log(`Points: ${points}`);
    console.log(`User ID: ${userID}`);
    const paymentRequest = await createRequest.createRequest(coffees, sum, points, userID) //1 $ = 1 point so we can reuse sum
    const { contentData, requestId } = paymentRequest

    console.log(`Request ID: ${requestId}`);
    console.log(`Content Data:`);
    console.log({ contentData });
    res.send({ requestId })

});

app.post('/payRequest', async (req, res) => {
    const requestId = req.body.requestId
    await payRequest.payRequest(requestId)
    res.send(`Paid and settled request ${requestId}`)
});

app.post('/claimRewards', async (req, res) => {
    const requestId = req.body.requestId
    await claimRewards.claimRewards(requestId)
    res.send(`Claimed rewards for request ${requestId}`)
});

app.get('/', (req, res) => {
    res.send('Hello! :)')
})

app.listen(port, () => {
    console.log('☕ StarlightCoffee Running: ' + port)
})