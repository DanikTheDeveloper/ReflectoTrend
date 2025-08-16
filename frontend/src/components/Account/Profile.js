import React from 'react';
import { useSelector } from "react-redux";
import PrivateHeader from "../Home/Header/PrivateHeader.js";
import { Paper, Text, Title, Group, Badge, Stack, Space, Anchor, Grid, Button, NavLink } from '@mantine/core';
import { IconCreditCard, IconExchange } from '@tabler/icons-react';
import { format } from 'date-fns';
import classes from './Account.module.css';
import { useNavigate } from "react-router-dom";
import Settings from "./Settings.js";

const Profile = () => {
    const navigate = useNavigate();
    const user = useSelector(state => state.auth)
    //const pricing_plan = useSelector(state => state.auth.pricing_plan)
    const pricing_plan = "Free tier"


    React.useLayoutEffect(() => {
        if (user.isAuthenticated === false) {
            navigate('/')
        }
    }, [user.isAuthenticated]);

    const formatDate = (dateString) => {
        return format(new Date(dateString), 'PPPpp');
    };

    return (
        <>
        <PrivateHeader />
        <Grid gutter="sm" align="stretch" justify="center" columns={14}>
            <Grid.Col span={4}>
                <div className={classes.profileContainer}>
                    <Paper shadow="xs" p="md" radius="md" withBorder>
                    <Stack spacing="xs">
                    <Title order={3}>Profile Details</Title>
                    <Text><strong>Email:</strong> {user.email}</Text>
                    <Group position="left" spacing="xs">
                        <Text><strong>Status:</strong></Text>
                        <Badge color={user.status === 'active' ? 'green' : 'red'} variant="light">
                            {user.status}
                        </Badge>
                    </Group>
                    <Space h="md" />
                    <Title order={4}>Account Access</Title>
                    <Text><strong>Created At:</strong> {formatDate(user.created_at)}</Text>
                    <Text><strong>Last Updated:</strong> {formatDate(user.updated_at)}</Text>
                    <Text><strong>Last Login:</strong> {formatDate(user.last_login)}</Text>
                    </Stack>
                    </Paper>
                    <Space h="md" />
                    <Paper shadow="xs" p="md" radius="md" withBorder>
                    <Stack spacing="xs">
                    <Title order={3}>Pricing Plan</Title>
                    <Text><strong>Plan:</strong> {pricing_plan} </Text>
                    <Text><strong>Expiration:</strong> {formatDate(user.last_login)} </Text>
                    <Text><strong>AutoRenewal:</strong> {formatDate(user.last_login)} </Text>
                    <Text><strong>Card ending in </strong> x0086 </Text>
                    <NavLink
                        href="/billing"
                        active
                        variant="subtle"
                        leftSection={<IconCreditCard size={24} stroke={1.5} />}
                        label="Update Payment Method"
                    />
                    <NavLink
                        href="/billing"
                        active
                        variant="subtle"
                        leftSection={<IconExchange size={24} stroke={1.5} />}
                        label="Change Plans"
                    />
                    </Stack>
                    </Paper>
                </div>
            </Grid.Col>
            <Grid.Col span={8}>
                <Settings />
            </Grid.Col>
        </Grid>
        </>
    )
}

export default Profile;
