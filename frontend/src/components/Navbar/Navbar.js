import React from "react";

import {
  createStyles,
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
  Divider
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
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
} from '@tabler/icons-react';
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Clock from "../Clock/Clock";

const useStyles = createStyles((theme) => ({
  header: {
    backgroundColor: theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background,
    borderBottom: `${rem(1)} solid ${
      theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background
    }`,
  },

  mainSection: {
    paddingBottom: theme.spacing.sm,
    margin: "0"
  },

  user: {
    color: theme.white,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.radius.sm,
    transition: 'background-color 100ms ease',

    '&:hover': {
      backgroundColor: theme.fn.lighten(
        theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background,
        0.1
      ),
    },

    [theme.fn.smallerThan('xs')]: {
      display: 'none',
    },
  },

  burger: {
    [theme.fn.largerThan('xs')]: {
      display: 'none',
    },
  },

  userActive: {
    backgroundColor: theme.fn.lighten(
      theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background,
      0.1
    ),
  },

  tabs: {
    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },

  tabsList: {
    borderBottom: '0 !important',
  },

  tab: {
    fontWeight: 500,
    height: rem(38),
    color: theme.white,
    backgroundColor: 'transparent',
    borderColor: theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background,

    '&:hover': {
      backgroundColor: theme.fn.lighten(
        theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background,
        0.1
      ),
    },

    '&[data-active]': {
      backgroundColor: theme.fn.lighten(
        theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background,
        0.1
      ),
      borderColor: theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background,
    },
  },
}));

const Header = () => {
  const { classes, theme, cx } = useStyles();
  const navigate = useNavigate();
  const [userMenuOpened, setUserMenuOpened] = React.useState(false);

  const [opened, {toggle}] = useDisclosure(false);
  const [currentTab, setCurrentTab] = React.useState('home');

  const isAuthenticated = useSelector(state => state.auth.isAuthenticated)
  const user = useSelector(state => state.auth.user)

  const changeTab = (value) => {
    setCurrentTab(value);
    navigate(value)
  }

  return (
    <div className={classes.header}>
      <Container className={classes.mainSection}>
        <Group >

          <Burger
            opened={opened}
            onClick={toggle}
            className={classes.burger}
            size="sm"
            color={theme.white}
          />

      <Drawer
        opened={opened}
        onClose={toggle}
        title="Immortal"
        overlayProps={{ opacity: 0.5, blur: 4 }}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <NavLink
          label="Home"
          variant="subtle"
          type="button" onClick={() => {navigate('/'); toggle() } }
          icon={<IconHome size="1rem" stroke={1.5} />}
        />
        <NavLink
          label="About"
          variant="subtle"
          type="button" onClick={() => {navigate('/about'); toggle() } }
          icon={<IconListDetails size="1rem" stroke={1.5} />}
        />
        <Divider padding="sm" />
        {isAuthenticated === true ?
          <>

            <NavLink
              label="Profile"
              type="button" onClick={() => {navigate('/user-details'); toggle() } }
              icon={<IconUser size="1rem" stroke={1.5} />}
            />
            <NavLink
              label="Settings"
              type="button" onClick={() => {navigate('/settings'); toggle() } }
              icon={<IconSettings size="1rem" stroke={1.5} />}
            />
            <NavLink
              label="Change Account"
              type="button" onClick={() => {navigate('/settings'); toggle() } }
              icon={<IconSwitchHorizontal size="1rem" stroke={1.5} />}
            />
            <NavLink
              label="Logout"
              type="button" onClick={() => {navigate('/logout'); toggle() } }
              icon={<IconLogout size="1rem" stroke={1.5} />}
            />
          </>
          :
          <>
            <NavLink
              label="Sign Up"
              type="button" onClick={() => {navigate('/register'); toggle() } }
              icon={<IconUserPlus size="1rem" stroke={1.5} />}
            />
            <NavLink
              label="Login"
              variant="filled"
              color={theme.colors.dark[6]}
              type="button" onClick={() => {navigate('/login'); toggle() } }
              icon={<IconLogin2 size="1rem" stroke={1.5} />}
              rightSection={<IconChevronRight size="0.8rem" stroke={1.5} />}
            />
          </>
        }
      </Drawer>

          <Menu
            width={260}
            position="bottom-end"
            transitionProps={{ transition: 'pop-top-right' }}
            onClose={() => setUserMenuOpened(false)}
            onOpen={() => setUserMenuOpened(true)}
            withinPortal
          >
            <Menu.Target>
              <UnstyledButton
                className={cx(classes.user, { [classes.userActive]: userMenuOpened })}
              >
                <Group spacing={7}>
                  <Avatar src={user.image} alt={user.username} radius="xl" size={20} />
                
            
                  <Text weight={500} size="sm" sx={{ lineHeight: 1, color: theme.white }} mr={3}>
                    {user.username}
                  </Text>
                  <IconChevronDown size={rem(12)} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            { isAuthenticated === true ?
              <Menu.Dropdown>
                <Menu.Item icon={<IconIdBadge size="0.9rem" stroke={1.5} />} onClick={() => navigate('/user-details')}> Profile </Menu.Item>
                <Menu.Label>Settings</Menu.Label>
                <Menu.Item icon={<IconSettings size="0.9rem" stroke={1.5} />} onClick={() => navigate('/settings')}> Account settings </Menu.Item>
                <Menu.Item icon={<IconSwitchHorizontal size="0.9rem" stroke={1.5} />} onClick={() => navigate('/change-account')}> Change account </Menu.Item>
                <Menu.Divider />
                <Menu.Item icon={<IconLogout size="0.9rem" stroke={1.5} />} onClick={() => navigate('/logout')}>Logout</Menu.Item>
              </Menu.Dropdown>
                :
               <Menu.Dropdown>
                <Menu.Item icon={<IconLogin2 size="0.9rem" stroke={1.5} />} onClick={() => navigate('/login')}> Login </Menu.Item>
                <Menu.Item icon={<IconUserPlus size="0.9rem" stroke={1.5} />} onClick={() => navigate('/register')}> Sign Up </Menu.Item>
                <Menu.Divider />
              </Menu.Dropdown>
            }
          </Menu>
          <Clock />
        </Group>

      </Container>
      <Container>
        <Tabs
          value={currentTab}
          onTabChange={(value) => changeTab(value)}
          variant="outline"
          classNames={{
            root: classes.tabs,
            tabsList: classes.tabsList,
            tab: classes.tab,
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="/" key="Home" >Home</Tabs.Tab>
            <Tabs.Tab value="about" key="About" >About</Tabs.Tab>
            { isAuthenticated === true ?
              <>
              <Tabs.Tab value="billing-hourly" key="Hourly" color="teal" >Hourly</Tabs.Tab>
              <Tabs.Tab value="billing-daily" key="Daily" color="teal" >Daily</Tabs.Tab>
              <Tabs.Tab value="billing-monthly" key="Monthly" color="teal" >Monthly</Tabs.Tab>
              </>
              :
              <Tabs.Tab icon={<IconLogin2 size="0.9rem" stroke={1.5} />}
              color="red" value="login" key="Login" ml="auto"
              >Login</Tabs.Tab>
            }
          </Tabs.List>
        </Tabs>
      </Container>
    </div>
  );
}

export default Header;
