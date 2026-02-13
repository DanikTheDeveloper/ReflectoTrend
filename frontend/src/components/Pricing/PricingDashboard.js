import React from 'react';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, Text, Button, Space, Stack, Group, Box, Title, Badge } from '@mantine/core';
import AppShell from "../General/AppShell";
import axiosInstance from "../../store/axios.js";

const stripePromise = loadStripe("pk_live_51OjEDiICquYYVsYSk0I0f0dtCeSnrGolGRlE3XKCPCW82myKwnRVSx3A67acv7yQufDFpS6FwRtNRFhzmo2WavqZ00YrauDsIH");

const pricingPlans = {
  basic: { price: '$9.99/month', description: 'Basic features for personal use' },
  pro: { price: '$29.99/month', description: 'All features for professional use' },
  enterprise: { price: '$49.99/month', description: 'Advanced features for enterprise users' }
};

const PricingApp = () => {
  return (
    <Elements stripe={stripePromise}>
      <PricingDashboard />
    </Elements>
  );
};

const PricingDashboard = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [userPlan, setUserPlan] = React.useState(null);
  const [selectedPlan, setSelectedPlan] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchUserPricing = async () => {
      const userId = localStorage.getItem('userId');
      try {
        const response = await axiosInstance.get(`/api/getUserPricing/${userId}`);
        setUserPlan(response.data.currentPlan);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUserPricing();
  }, []);

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
  };

  const handlePayment = async () => {
    if (!stripe || !elements || selectedPlan === null) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setLoading(true);

    const { error, token } = await stripe.createToken(cardElement);
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const userId = localStorage.getItem('userId');

    try {
      const methodResponse = await axiosInstance.post('/api/createPaymentMethod', { token: token.id });
      const paymentMethodID = methodResponse.data.paymentMethodID;

      const paymentResponse = await axiosInstance.post('/api/createPaymentIntent', {
        userId,
        planKey: selectedPlan,
        paymentMethodID
      });

      const { clientSecret } = paymentResponse.data;

      const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodID,
      });

      if (!paymentError) {
        await updateUserPricing(userId, selectedPlan);
        setSelectedPlan(null);
      } else {
        console.error(paymentError);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const updateUserPricing = async (userId, planKey) => {
    try {
      await axiosInstance.post('/api/updateUserPricing', { userId, planId: planKey });
      setUserPlan(planKey);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AppShell
      selectedIndex={3}
      component={
        <Box
          style={{
            minHeight: '100vh',
            padding: '32px',
            background: 'linear-gradient(145deg, #6f85b5 0%, #8a6bd1 45%, #6fa8dc 100%)',
            marginTop: '40px',
          }}
        >
          <Title c="white" mb="xl" order={2}>
            Pricing Plans
          </Title>

          <Group align="stretch" justify="center" gap="xl" wrap="wrap">
            {Object.entries(pricingPlans).map(([planKey, { price, description }]) => {
              const isCurrent = userPlan === planKey;
              const isSelected = selectedPlan === planKey;

              return (
                <Card
                  key={planKey}
                  shadow="md"
                  radius="xl"
                  p="lg"
                  withBorder
                  style={{
                    width: 300,
                    backdropFilter: 'blur(14px)',
                    background: 'rgba(255,255,255,0.85)',
                    border: isSelected ? '2px solid #5c7cfa' : '1px solid rgba(255,255,255,0.4)',
                    transform: isSelected ? 'translateY(-6px)' : 'none',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text fw={600} size="lg">
                        {planKey.charAt(0).toUpperCase() + planKey.slice(1)}
                      </Text>
                      {isCurrent && <Badge color="green">Current</Badge>}
                    </Group>

                    <Text size="xl" fw={700}>
                      {price}
                    </Text>

                    <Text c="dimmed" size="sm">
                      {description}
                    </Text>

                    <Space h="xs" />

                    <Button
                      fullWidth
                      variant={isCurrent ? "light" : "filled"}
                      disabled={isCurrent}
                      onClick={() => handlePlanSelect(planKey)}
                    >
                      {isCurrent ? "Current Plan" : "Choose Plan"}
                    </Button>

                    {isSelected && !isCurrent && (
                      <Stack gap="xs" mt="sm">
                        <Box
                          style={{
                            padding: '10px',
                            borderRadius: '10px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: 'white'
                          }}
                        >
                          <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
                        </Box>

                        <Button
                          fullWidth
                          loading={loading}
                          onClick={handlePayment}
                        >
                          Confirm Payment
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </Card>
              );
            })}
          </Group>
        </Box>
      }
    />
  );
};

export default PricingApp;

