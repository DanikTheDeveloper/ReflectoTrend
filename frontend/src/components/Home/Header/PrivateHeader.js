import React from "react";
import '@mantine/core/styles.css';
import classes from './PrivateHeader.module.css';
import cx from 'clsx';
import { useNavigate } from "react-router-dom";
import {
    Avatar,
    UnstyledButton,
    Group,
    Text,
    Menu,
    Burger,
    Drawer,
    ActionIcon,
    Space,
    useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconFileDollar,
    IconLogout,
    IconSettings,
    IconIdBadge,
    IconMoon,
    IconSun,
} from '@tabler/icons-react';
import {useSelector} from "react-redux";
import {useDispatch} from "react-redux";

function PrivateHeader()  {
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated)
    const userId = useSelector(state => state.auth.id)
    const userEmail = useSelector(state => state.auth.email)
    const user = {
        image: null,
    }
    const [opened, {open, close} ] = useDisclosure(false);
    const [userMenuOpened, setUserMenuOpened ] = useDisclosure(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { colorScheme, setColorScheme } = useMantineColorScheme();

    const toggleColorScheme = () => {
        setColorScheme(colorScheme === "dark" ? "light" : "dark");
    }

    const handleClick = (e, link) => {
        e.preventDefault();
        navigate(link.link);
    }
    const toggle = () => (opened ? close() : open());

    return (
        <header className={classes.header}>
            <div className={classes.logoLinks}>
                <div className={classes.logo} >
                    <img src="./logo.svg" alt="Reflecto Trend" onClick={(e) => navigate('/') } />
                </div>
              <Menu>
                <Menu.Target>
                    <UnstyledButton
                        className={cx(classes.user, { [classes.userActive]: userMenuOpened })}
                    >
                        <Avatar src={user.image} alt={userEmail} radius="xl" size={40} />
                    </UnstyledButton>
                </Menu.Target>
                    <>
                        <Menu.Dropdown>
                        <Menu.Item color="var(--cyan-color)" leftSection={<IconSettings size="1.5rem" stroke={1.5} />} onClick={() => navigate('/user-details')}>
                        <Text size="lg" > Profile Settings </Text>
                        { userEmail !== null &&
                        <Text weight={500} size="sm" ml={3}>
                            {userEmail}
                        </Text>
                        }
                        </Menu.Item>
                        <Menu.Item color="var(--cyan-color)" leftSection={<IconFileDollar size="1.5rem" stroke={1} />} onClick={() => navigate('/billing')}> <Text size="md"> Billing </Text> </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item color="var(--warning-color)" leftSection={<IconLogout size="1.5rem" stroke={1.5} />} onClick={() => navigate('/signout')}><Text size="lg" > Logout </Text> </Menu.Item>
                        </Menu.Dropdown>
                    </>
                </Menu>
            </div>
            <div className={classes.inner}>
                <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
                <Drawer opened={opened} onClose={close}>
                    <div className={classes.drawer}>
                        <UnstyledButton className={classes.drawerButton} leftSection={<IconIdBadge size="1.5rem" stroke={1.5} />} onClick={() => navigate('/user-details')}> <Text size="lg"> Profile </Text> </UnstyledButton>
                        <UnstyledButton className={classes.drawerButton} leftSection={<IconSettings size="1.5rem" stroke={1.5} />} onClick={() => navigate('/settings')}> <Text size="lg"> Settings </Text> </UnstyledButton>
                        <Space h="md" className={classes.line} />
                        <UnstyledButton className={classes.drawerLogoutButton} onClick={() => navigate('/signout')}>
                            <Text size="lg" > Logout </Text>
                            <Space w="xs" />
                            <IconLogout size="1.5rem" stroke={1.5} />
                        </UnstyledButton>
                        <Space h="md" className={classes.line} />
                                <UnstyledButton
                                    variant="outline"
                                    color="gray"
                                    size="md"
                                    className={classes.drawerToggleButton}
                                    onClick={() => toggleColorScheme()}
                                >
                                    { colorScheme === "dark" ?
                                        <>
                                            <Text size="lg" > Light Mode {" "}</Text>
                                            <Space w="xs" />
                                            <IconSun size="1.5rem" stroke={1.5} />
                                        </>
                                        :
                                        <>
                                            <Text size="lg" > Dark Mode </Text>
                                            <Space w="xs" />
                                            <IconMoon size="1.5rem" stroke={1.5} />
                                        </>
                                    }
                                </UnstyledButton>
                    </div>
                </Drawer>
                <Group gap={10} visibleFrom="sm">
                {
                    colorScheme === "dark" ?
                        <ActionIcon
                            variant="outline"
                            color="gray"
                            size="md"
                            onClick={() => toggleColorScheme()}
                        >
                            <IconSun size="1.5rem" stroke={1.5} />
                        </ActionIcon>
                        :
                        <ActionIcon
                            variant="outline"
                            color="gray"
                            size="md"
                            onClick={() => toggleColorScheme()}
                        >
                            <IconMoon size="1.5rem" stroke={1.5} />
                        </ActionIcon>
                }
                </Group>
            </div>
        </header>
    );
}


export default PrivateHeader;

