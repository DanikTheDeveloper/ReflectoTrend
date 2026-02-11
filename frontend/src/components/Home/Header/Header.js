import React from "react";
import '@mantine/core/styles.css';
import classes from './HeaderMenu.module.css';
import { useNavigate } from "react-router-dom";
import {
    Group,
    Menu,
    Burger,
    Drawer,
    NavLink,
    Divider,
    Button,
    Center,
    ActionIcon,
    Space,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChartArrows,
    IconLock,
    IconChevronDown,
    IconMoon,
    IconSun,
} from '@tabler/icons-react';

const links = [
    { link: '/about', label: 'ABOUT' },
    { link: '/pricing', label: 'PRICING' },
];


function Header(props = {image})  {
    const [opened, {open, close} ] = useDisclosure(false);
    const [userMenuOpened, setUserMenuOpened ] = useDisclosure(false);
    const navigate = useNavigate();

    let image = "./images/reflecto.svg";
    image = props.image !== undefined ? props.image : image;

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
                    <img src={image} alt="Reflecto Trend" onClick={(e) => navigate('/') }/>
                </div>
                <Button
                    size="md"
					ml={"10"}
                    className={classes.link}
                    onClick={(e) => handleClick(e, {link: '/signin', label: 'signin'}) }
                    leftSection={<IconLock size="24px" stroke={"1.5"} className={classes.linkLabel}/>}
                >
                    <span className={classes.linkLabel}>Sign In</span>
                </Button>
                <Space w="md" />
                <Button
                    size="md"
                    className={classes.link}
                    onClick={(e) => handleClick(e, {link: '/register', label: 'Register'}) }
                    rightSection={<IconChartArrows size="24px" stroke={"1.5"} className={classes.linkLabel} />}
                >
                    <span className={classes.linkLabel}>Get Started</span>
                </Button>
            </div>
            <div className={classes.inner}>
                <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" className={classes.burger}/>
                <Drawer opened={opened} onClose={close}>
                    <div className={classes.drawer}>
				    <NavLink href="/docs" active variant="filled" className={classes.drawerLink} label={<span className={classes.drawerLinkLabel}>Learn More</span>} />
                    <Divider />
				    <NavLink href="/about" active variant="filled" className={classes.drawerLink} label={<span className={classes.drawerLinkLabel}>About</span>} />
                    <Divider />
				    <NavLink href="/pricingDashboard" active variant="filled" className={classes.drawerLink} label={<span className={classes.drawerLinkLabel}>Pricing</span>} />
                    </div>
                </Drawer>
                <Group gap={10} visibleFrom="sm">
                {items}
                </Group>
            </div>
        </header>
    );
}


export default Header;

