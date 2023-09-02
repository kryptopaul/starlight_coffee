const express = require('express')
const cors = require('cors');
const e = require('express');

const port = 3000
const app = express();
app.use(express.json());
app.use(cors());

const menu = {
    filteredCoffee: 5
}

const sampleOrder = {
    filteredCoffee: 2
}


app.post('/orderintent', (req, res) => {
    console.log('Received a request to recieve order')
    // const order = req.body.order;
    const order = req.body.order;
    let sum = 0;

    Object.keys(order).forEach(key => {
        console.log({key})
        console.log(order[key]) // Requested amount
        console.log(key) // name
        console.log(menu[key]) // price per 1

        sum += order[key] * menu[key]
    })
    console.log(`Sum: ${sum}`);
    res.send("Received")

  });

  app.post('/checkorderinfo', (req, res) => {
    console.log('Received a request to get skins')
    const password = req.body.password
    loginAndFetch(login, password).then(dailyShop => {
        console.log('Express side seems done: ' + dailyShop)
        res.send(dailyShop)
    })

  });

app.get('/', (req, res) => {
    res.send('Hello! :)')
})

app.listen(port, () => {
    console.log('Daily Store API by isu running on port: ' + port)
})