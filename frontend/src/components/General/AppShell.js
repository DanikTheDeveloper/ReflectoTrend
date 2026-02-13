import React  from "react"
import { AppShell, Burger, Group, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './AppShell.module.css';
import PrivateHeader from "../Home/Header/PrivateHeader";

const MyAppShell = (props={component, selectedIndex}) => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true, mobile: !opened } }}
    >
      <AppShell.Header >
          <PrivateHeader selectedIndex={props.selectedIndex}/>
      </AppShell.Header >


      <AppShell.Main>
        {props.component}
      </AppShell.Main>
    </AppShell>
  );
}

export default MyAppShell
