import React from "react";
import '@mantine/core/styles.css';
import classes from './PrivateHeader.module.css';
import { useNavigate } from "react-router-dom";
import {
    Avatar,
    UnstyledButton,
    NavLink,
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

function PrivateHeader(props = {image, selectedIndex })  {
    const userEmail = useSelector(state => state.auth.email)
    const user = {
        image: null,
    }
    const [opened, {open, close} ] = useDisclosure(false);
    const navigate = useNavigate();
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const [ index, setIndex] = React.useState(props.selectedIndex);

    const handleIndex = (value) => {
        setIndex(value);
        if (value === 1) {
            navigate("/")
        }
        else if (value === 0) {
            navigate("/dashboard")
        }
        else if (value === 2) {
            navigate("/blog")
        }
        else if (value === 3) {
            navigate("/pricingDashboard")
        }
    }


    const toggleColorScheme = () => {
        setColorScheme(colorScheme === "dark" ? "light" : "dark");
    }

    let image = colorScheme === "dark" ? "./images/reflecto.svg" : "./images/reflecto.svg";
    image = props.image !== undefined ? props.image : image;
    const toggle = () => (opened ? close() : open());

    return (
        <header className={classes.header}>
            <div className={classes.logoLinks}>
                <div className={classes.logo} >
                    <img src={image} alt="Reflecto Trend" onClick={() => navigate('/') }/>
                </div>
              <Menu>
                <Menu.Target>
                    <ActionIcon variant="gradient" aria_label="Menu" gradient={{ from: 'blue', to: 'violet', deg: 90 }} size="l">
                        <Avatar src={user.image} alt={userEmail} radius="xl" size={40} />
                    </ActionIcon>
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
                <div className={classes.navbar}>
                        <NavLink
                            label="Home"
                            active
                            variant={index === 1 ? "light" : "subtle"}
                            onClick={() => handleIndex(1)}
                        />
                        <Space w="md" />
                        <NavLink
                            label="Dashboard"
                            active
                            variant={index === 0 ? "light" : "subtle"}
                            onClick={() => handleIndex(0)}
                        />
                        <Space w="md" />
                        <NavLink
                            label="Blog"
                            active
                            variant={index === 2 ? "light" : "subtle"}
                            onClick={() => handleIndex(2)}
                        />
                        <Space w="md" />
                        <NavLink
                            label="Pricing"
                            active
                            variant={index === 3 ? "light" : "subtle"}
                            onClick={() => handleIndex(3)}
                        />
                </div>
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

