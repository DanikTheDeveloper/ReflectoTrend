import React from "react";
import {
    NavLink,
    Container,
    TextInput,
    Title,
    Text,
    Tabs,
    ThemeIcon,
    Skeleton,
    Burger
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconStar } from "@tabler/icons-react";
import classes from "./SidePanel.module.css";
import { useDispatch, useSelector } from "react-redux";

const SidePanel = (props = {setTab, selectedTab, searchStocks, selectedStock, setStock, allList, cryptoList, isLoading}) => {
    const [opened, {toggle}] = useDisclosure();

    return (
        <>
        <Container size="md" className={classes.sidePanel} >
            <Title order={2}> Markets </Title>
            <TextInput size="md" placeholder="search" value={props.searchString} leftSection={<IconSearch />} onChange={(e) => searchStocks(e)}/>
            <Tabs value={props.selectedTab} onChange={(e) => props.setTab(e)}>
                <Tabs.List className={classes.category}>
                    <Tabs.Tab value="all"><Text size="md"> All </Text></Tabs.Tab>
                    <Tabs.Tab value="crypto"><Text size="md"> Crypto </Text></Tabs.Tab>
                    <Tabs.Tab value="favourites"><Text size="md"> Favourites </Text></Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="all" className={classes.currencyList}>
                    { props.isLoading === true ?
                        <div>
                            <Skeleton />
                            <p>loading....</p>
                        </div>
                        :
                        props.allList.map((item) => (
                            <div key={item.value}>
                            <NavLink
                                id={item.value}
                                className={props.selectedStock.value === item.value ? classes.currencyItemActive : classes.currencyItem}
                                label={<Text size="md">{item.label}</Text>}
                                active
                                variant="subtle"
                                leftSection={<ThemeIcon className={classes.themeIcon}> <img src={"cryptoIcons/" + item.icon} alt=""/>  </ThemeIcon>}
                                rightSection={<IconStar className={classes.themeIconFav} stroke={1.5}/>}
                                onClick={() => props.setStock(item)}
                            />
                            </div>
                        ))
                    }
                </Tabs.Panel>
                <Tabs.Panel value="crypto" className={classes.currencyList}>
                    {
                        props.isLoading === true ?
                        <div>
                            <Skeleton />
                            <p>loading....</p>
                        </div>
                        :
                        props.cryptoList.map((item) => (
                            <div key={item.value}>
                            <NavLink
                            id={item.value}
                            className={props.selectedStock.value === item.value ? classes.currencyItemActive : classes.currencyItem}
                            label={<Text size="md">{item.label}</Text>}
                            active
                            variant="subtle"
                            rightSection={<IconStar className={classes.themeIconFav} stroke={1.5}/>}
                            leftSection={<ThemeIcon className={classes.themeIcon}> <img src={"cryptoIcons/" + item.icon} alt=""/>  </ThemeIcon>}
                            onClick={() => props.setStock(item)}
                            />
                            </div>
                        ))
                    }
                </Tabs.Panel>
                <Tabs.Panel value="favourites" className={classes.currencyList}>
                    {
                        <p>Not implemented yet.</p>
                    }
                </Tabs.Panel>
            </Tabs>
        </Container>
        </>
    );
}

export default SidePanel;
