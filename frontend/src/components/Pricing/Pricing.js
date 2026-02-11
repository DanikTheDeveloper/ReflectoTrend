//
// import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
// import { Card, Text, Button, Space } from '@mantine/core';
// import { useNavigate } from 'react-router-dom';
// import classes from './Pricing.module.css';
//
// const stripePromise = loadStripe("pk_live_51OjEDiICquYYVsYSk0I0f0dtCeSnrGolGRlE3XKCPCW82myKwnRVSx3A67acv7yQufDFpS6FwRtNRFhzmo2WavqZ00YrauDsIH");
//
// const pricingPlans = {
//   basic: { price: '$9.99/month', description: 'Basic features for personal use' },
//   pro: { price: '$29.99/month', description: 'All features for professional use' },
//   enterprise: { price: '$49.99/month', description: 'Advanced features for enterprise users' }
// };
//
// const PricingApp = () => {
//   return (
//     <Elements stripe={stripePromise}>
//       <Pricing />
//     </Elements>
//   );
// };
//
// const Pricing = () => {
//   const stripe = useStripe();
//   const elements = useElements();
//   const [userPlan, setUserPlan] = useState(null);
//   const [selectedPlan, setSelectedPlan] = useState(null);
//   const navigate = useNavigate();
//
//   useEffect(() => {
//     const fetchUserPricing = async () => {
//       const userId = localStorage.getItem('userId');
//       try {
//         const response = await fetch(`/api/getUserPricing/${userId}`);
//         const data = await response.json();
//         setUserPlan(data.currentPlan);
//       } catch (error) {
//         console.error("Error fetching user pricing:", error);
//       }
//     };
//     fetchUserPricing();
//   }, []);
//
//   const handlePlanSelect = (planKey) => {
//     navigate('/signin');
//   };
//
//   const handlePayment = async () => {
//     if (!stripe || !elements || selectedPlan === null) {
//       console.error("Stripe has not loaded or no plan has been selected");
//       return;
//     }
//
//     const cardElement = elements.getElement(CardElement);
//     if (!cardElement) {
//       console.error("Card element not found");
//       return;
//     }
//
//     const { error, token } = await stripe.createToken(cardElement);
//     if (error) {
//       console.error(`Token creation failed: ${error.message}`);
//       return;
//     }
//
//     const userId = localStorage.getItem('userId');
//     try {
//       // Create Payment Method first
//       const methodResponse = await fetch('/api/createPaymentMethod', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ token: token.id })
//       });
//
//       const methodData = await methodResponse.json();
//       if (!methodResponse.ok) {
//         throw new Error('Failed to create payment method');
//       }
//
//       // Then create Payment Intent with the new payment method ID
//       const paymentResponse = await fetch('/api/createPaymentIntent', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           userId,
//           planKey: selectedPlan,
//           paymentMethodID: methodData.paymentMethodID
//         })
//       });
//
//       const { clientSecret } = await paymentResponse.json();
//
//       // Confirm the payment with the client secret
//       const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
//         payment_method: methodData.paymentMethodID,
//       });
//
//       if (paymentError) {
//         console.error(`Payment failed: ${paymentError.message}`);
//       } else {
//         console.log(`Payment succeeded`);
//         updateUserPricing(userId, selectedPlan);
//         setSelectedPlan(null); // Reset after successful payment
//       }
//     } catch (error) {
//       console.error("Error processing the payment:", error);
//     }
//   };
//
//   const updateUserPricing = async (userId, planKey) => {
//     try {
//       const response = await fetch('/api/updateUserPricing', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ userId, planId: planKey })
//       });
//       if (!response.ok) {
//         throw new Error('Failed to update user pricing');
//       }
//       console.log('User pricing updated successfully');
//     } catch (error) {
//       console.error("Error updating user pricing:", error);
//     }
//   };
//
//   return (
//     <div className={classes.pricingPage}>
//       <div className={classes.cardsContainer}>
//         {Object.entries(pricingPlans).map(([planKey, { price, description }]) => (
//           <Card key={planKey} className={`${classes.pricingCard} ${userPlan === planKey ? classes.disabled : ''}`}>
//             <Text size="xl" className={classes.planType}>{planKey.charAt(0).toUpperCase() + planKey.slice(1)}</Text>
//             <Text className={classes.price}>{price}</Text>
//             <Text className={classes.description}>{description}</Text>
//             <Space h="md" />
//             <Button fullWidth onClick={() => handlePlanSelect(planKey)} disabled={userPlan === planKey}>
//               Choose {planKey.charAt(0).toUpperCase() + planKey.slice(1)}
//             </Button>
//             {selectedPlan === planKey && (
//               <div>
//                 <CardElement />
//                 <Button onClick={handlePayment}>Confirm Payment</Button>
//               </div>
//             )}
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// };
//
// export default PricingApp;
