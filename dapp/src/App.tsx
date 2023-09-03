import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Container, Image, Title, Text } from '@mantine/core';
import { useState } from 'react';
import { Stepper, Button, Group } from '@mantine/core';
import { HeaderResponsive } from './HeaderResponsive';
import axios from 'axios';


function App() {

  const [active, setActive] = useState(0);
  const [requestId, setRequestId] = useState('' as string);

  const [orderCoffeeLoading, setOrderCoffeeLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  const nextStep = () => setActive((current) => (current < 3 ? current + 1 : current));
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));


  async function orderCoffee() {
    setOrderCoffeeLoading(true);
    const resp = await axios.post('http://localhost:3101/orderIntent', {
      "userID": 1337,
      "order": {
        "filteredCoffee": 1
      }
    });
    setOrderCoffeeLoading(false);
    setRequestId(resp.data.requestId)
    nextStep();
  }

  async function pay() {
    setPayLoading(true);
    await axios.post('http://localhost:3101/payRequest', {
      "requestId": requestId,
  });
    setPayLoading(false);
    nextStep();
  }

  async function claimPoints() {
    setClaimLoading(true);
    await axios.post('http://localhost:3101/claimRewards', {
      requestId
    });
    setClaimLoading(false);
    alert('Points claimed!');
  }

  return (
    <>
      <HeaderResponsive links={[
        { label: 'Home', link: '/' },
      ]} />
      <Container>
        <div style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          display: 'flex',
          textAlign: 'center'
        }}>
          <Image src={'./sc.png'} maw={250} />
          <Title>Starlight Coffee</Title>
          <br />
          <Title order={2}>Logged in as: 1337</Title>
          <br />
          <Stepper active={active} onStepClick={setActive} breakpoint="sm">
            <Stepper.Step label="First step" description="Order the coffee">
              <br />
              <Text>This will generate a Payment Request</Text>
              <br />
              <Button onClick={orderCoffee} loading={orderCoffeeLoading}>Order 1 Coffee</Button>
            </Stepper.Step>
            <Stepper.Step label="Second step" description="Pay">
              <br/>
              <Text>{`Request ID: ${requestId}`}</Text>
              <br/>
              <Button onClick={pay} loading={payLoading}>Pay the Request ($5)</Button>

            </Stepper.Step>
            <Stepper.Step label="Final step" description="Receive points">
              <br/>
              <Text>You can claim 5 points for this purchase</Text>
              <br/>
              <Button onClick={claimPoints} loading={claimLoading}>Claim 5 Points</Button>

            </Stepper.Step>
            <Stepper.Completed>
              Completed, click back button to get to previous step
            </Stepper.Completed>
          </Stepper>
        </div>

      </Container>
    </>
  );
}

export default App;
