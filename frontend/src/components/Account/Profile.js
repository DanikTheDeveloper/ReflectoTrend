import React from 'react';
import { useSelector } from "react-redux";
import PrivateHeader from "../Home/Header/PrivateHeader.js";
import { Paper, Text, Title, Group, Badge, Stack, Space, Grid, Button, Box } from '@mantine/core';
import { IconCreditCard, IconExchange } from '@tabler/icons-react';
import { format } from 'date-fns';
import { useNavigate } from "react-router-dom";
import Settings from "./Settings.js";

const Profile = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth);
  const pricing_plan = "Free tier";

  React.useLayoutEffect(() => {
    if (user.isAuthenticated === false) {
      navigate('/');
    }
  }, [user.isAuthenticated]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return format(new Date(dateString), 'PPPpp');
  };

  return (
    <>
      <PrivateHeader />

      <Box
        style={{
          minHeight: '100vh',
          padding: '24px',
          background: 'linear-gradient(145deg, #6f85b5 0%, #8a6bd1 45%, #6fa8dc 100%)'
        }}
      >
        <Title c="white" mb="lg" order={2}>
          Account Overview
        </Title>

        <Grid gutter="lg" align="stretch" justify="center" columns={14}>
          <Grid.Col span={{ base: 14, md: 5, lg: 4 }}>
            <Stack>
              <Paper
                shadow="md"
                p="lg"
                radius="xl"
                withBorder
                style={{
                  backdropFilter: 'blur(14px)',
                  background: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  transition: 'all 0.25s ease'
                }}
              >
                <Stack gap="xs">
                  <Title order={3}>Profile Details</Title>

                  <Text>
                    <strong>Email:</strong> {user.email}
                  </Text>

                  <Space h="sm" />

                  <Title order={4}>Account Access</Title>

                  <Text><strong>Created:</strong> {formatDate(user.created_at)}</Text>
                  <Text><strong>Updated:</strong> {formatDate(user.updated_at)}</Text>
                  <Text><strong>Last Login:</strong> {formatDate(user.last_login)}</Text>
                </Stack>
              </Paper>

              <Paper
                shadow="md"
                p="lg"
                radius="xl"
                withBorder
                style={{
                  backdropFilter: 'blur(14px)',
                  background: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  transition: 'all 0.25s ease'
                }}
              >
                <Stack gap="xs">
                  <Title order={3}>Pricing Plan</Title>

                  <Text><strong>Plan:</strong> {pricing_plan}</Text>
                  <Text><strong>Expiration:</strong> {formatDate(user.last_login)}</Text>
                  <Text><strong>Auto Renewal:</strong> Enabled</Text>
                  <Text><strong>Card:</strong> **** 0086</Text>

                  <Space h="sm" />

                  <Button
                    variant="light"
                    radius="md"
                    leftSection={<IconCreditCard size={18} />}
                    onClick={() => navigate("#")}
                  >
                    Update Payment Method
                  </Button>

                  <Button
                    variant="subtle"
                    radius="md"
                    leftSection={<IconExchange size={18} />}
                    onClick={() => navigate("/pricing")}
                  >
                    Change Plan
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 14, md: 9, lg: 8 }}>
            <Paper
              shadow="md"
              p="lg"
              radius="xl"
              withBorder
              style={{
                backdropFilter: 'blur(14px)',
                background: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.35)',
                height: '100%'
              }}
            >
              <Settings />
            </Paper>
          </Grid.Col>
        </Grid>
      </Box>
    </>
  );
};

export default Profile;

