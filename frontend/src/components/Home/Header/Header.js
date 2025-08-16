import React from "react";
import '@mantine/core/styles.css';
import classes from './HeaderMenu.module.css';
import cx from 'clsx';
import { useNavigate } from "react-router-dom";
import {
    Container,
    Avatar,
    UnstyledButton,
    Group,
    Text,
    Menu,
    Tabs,
    Burger,
    rem,
    Drawer,
    ScrollArea,
    NavLink,
    Divider,
    Button,
    Center,
    ActionIcon,
    Space,
    useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChartArrows,
    IconLogout,
    IconSettings,
    IconSwitchHorizontal,
    IconChevronDown,
    IconIdBadge,
    IconUserPlus,
    IconLogin2,
    IconChevronRight,
    IconUser,
    IconHome,
    IconListDetails,
    IconMoon,
    IconSun,
} from '@tabler/icons-react';
import {useDispatch} from "react-redux";

const links = [
    {
        link: 'docs',
        label: 'Learn More',
    },
    { link: '/about', label: 'About' },
    { link: '/pricing', label: 'Pricing' },
];


function Header()  {
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

    const items = links.map((link) => {
        const menuItems = link.links?.map((item) => (
            <Menu.Item key={item.link}>{item.label}</Menu.Item>
        ));

        if (menuItems) {
            return (
                <Menu key={link.label} trigger="hover" transitionProps={{ exitDuration: 0 }} withinPortal>
                    <Menu.Target>
                        <Button
                            className={classes.link}
                            onClick={(e) => handleClick(e, link) }
                        >
                            <Center>
                                <span className={classes.linkLabel}>{link.label}</span>
                                <IconChevronDown size="0.9rem" stroke={1.5} />
                            </Center>
                        </Button>
                    </Menu.Target>
                <Menu.Dropdown>{menuItems}</Menu.Dropdown>
                </Menu>
            );
        }
        return (
            <Button
                className={classes.link}
                size="md"
                onClick={(e) => handleClick(e, link) }
            >
                <span className={classes.linkLabel}>{link.label}</span>
            </Button>
        );
    });


    return (
        <header className={classes.header}>
            <div className={classes.logoLinks}>
                <div className={classes.logo}>
                    <img src="./logo.svg" alt="Reflecto Trend" onClick={(e) => navigate('/') }/>
                </div>
                <Button
                    size="md"
					ml={"10"}
                    className={classes.link}
                    onClick={(e) => handleClick(e, {link: '/signin', label: 'signin'}) }
                >
                    <span className={classes.linkLabel}>Sign In</span>
                </Button>
                <Space w="md" />
                <Button
                    size="md"
                    className={classes.link}
                    onClick={(e) => handleClick(e, {link: '/register', label: 'Register'}) }
                    rightSection={<IconChartArrows size="24px" stroke={"1.5"}/>}
                >
                    <span className={classes.linkLabel}>Get Started</span>
                </Button>
            </div>
            <div className={classes.inner}>
                <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
                <Drawer opened={opened} onClose={close}>
                    <div className={classes.drawer}>
				    <NavLink href="/docs" active variant="filled" className={classes.drawerLink} label={<span className={classes.drawerLinkLabel}>Learn More</span>} />
                    <Divider />
				    <NavLink href="/about" active variant="filled" className={classes.drawerLink} label={<span className={classes.drawerLinkLabel}>About</span>} />
                    <Divider />
				    <NavLink href="/pricing" active variant="filled" className={classes.drawerLink} label={<span className={classes.drawerLinkLabel}>Pricing</span>} />
                    </div>
                </Drawer>
                <Group gap={10} visibleFrom="sm">
                {items}
                        <ActionIcon
                            variant="outline"
                            color="gray"
                            size="xl"
                            onClick={() => toggleColorScheme()}
                        >
                            { colorScheme === "dark" ? <IconSun size="1.5rem" stroke={1.5} /> : <IconMoon size="1.5rem" stroke={1.5} /> }
                        </ActionIcon>
                </Group>
            </div>
        </header>
    );
}


export default Header;

