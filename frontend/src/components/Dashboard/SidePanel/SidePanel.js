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
	ScrollArea,
    ActionIcon
} from '@mantine/core';
import { IconSearch, IconStar, IconList,  IconArrowBadgeRight, IconArrowBadgeLeft } from "@tabler/icons-react";
import classes from "./SidePanel.module.css";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";

const SidePanel = (props = { opened, toggle, setTab, selectedTab, searchStocks, selectedStock, setStock, allList, cryptoList, isLoading}) => {

    console.log(props.selectedStock)

    return (
        <>
        <nav className={props.opened ? classes.navbar: classes.navbarClosed} >
        { props.opened ?
            <>
            <div className={classes.header}>
            <Title order={2}> Markets </Title>
            <TextInput size="md" placeholder="search" value={props.searchString} leftSection={<IconSearch />} onChange={(e) => searchStocks(e)} />
            </div>
            <div className={classes.navbarMain}>
                    <Tabs value={props.selectedTab} onChange={(e) => props.setTab(e)}>
                        <Tabs.List className={classes.category}>
                            <Tabs.Tab value="all"><Text size="md"> All </Text></Tabs.Tab>
                            <Tabs.Tab value="crypto"><Text size="md"> Crypto </Text></Tabs.Tab>
                            <Tabs.Tab value="favourites"><Text size="md"> Favourites </Text></Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="all" className={classes.currencyList}>
                            {props.isLoading === true ?
                                <div>
                                    <Skeleton />
                                    <p>loading....</p>
                                </div>
                                :
                                props.allList.map((item) => (
                                    <div key={item.value}>
                                        <NavLink
                                            id={item.value}
                                            label={ props.opened && <Text size="md">{item.label }</Text>}
                                            active
                                            variant={props.selectedStock !== null && props.selectedStock.value === item.value ? "light" : "subtle"}
                                            leftSection={<ThemeIcon className={classes.themeIcon}> <img src={"cryptoIcons/" + item.icon} alt="" />  </ThemeIcon>}
                                            rightSection={ props.opened && <IconStar className={classes.themeIconFav} stroke={1.5} />}
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
                                                label={<Text size="md">{props.opened ? item.label : ""}</Text>}
                                                active
                                                variant={props.selectedStock !== null && props.selectedStock.value === item.value ? "light" : "subtle"}
                                                leftSection={<ThemeIcon className={classes.themeIcon}> <img src={"cryptoIcons/" + item.icon} alt="" />  </ThemeIcon>}
                                                rightSection={ props.opened && <IconStar className={classes.themeIconFav} stroke={1.5} />}
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
        </div>
            </>
            :
            <>
            <div className={classes.header}>
            </div>
            <div className={classes.navbarMain}>
            { props.selectedTab == "all" ? props.allList.map((item) => (
                        <NavLink
                            id={item.value}
                            className={props.selectedStock !== null && props.selectedStock.value === item.value ? classes.currencyItemActive : classes.currencyItem}
                            label={ props.opened && <Text size="md">{item.label }</Text>}
                            active
                            variant={props.selectedStock !== null && props.selectedStock.value === item.value ? "filled" : "subtle"}
                            leftSection={<ThemeIcon autoContrast> <img src={"cryptoIcons/" + item.icon} alt="" />  </ThemeIcon>}
                            rightSection={ props.opened && <IconStar className={classes.themeIconFav} stroke={1.5} />}
                            onClick={() => props.setStock(item)}
                        />
                ))
            : props.selectedTab == "crypto" ?
                    props.cryptoList.map((item) => (
                    <div key={item.value}>
                        <NavLink
                            id={item.value}
                            className={props.selectedStock !== null && props.selectedStock.value === item.value ? classes.currencyItemActive : classes.currencyItem}
                            label={<Text size="md">{props.opened ? item.label : ""}</Text>}
                            active
                            variant={props.selectedStock !== null && props.selectedStock.value === item.value ? "filled" : "subtle"}
                            leftSection={<ThemeIcon className={classes.iconButton} autoContrast> <img src={"cryptoIcons/" + item.icon} alt="" />  </ThemeIcon>}
                            rightSection={ props.opened && <IconStar className={classes.themeIconFav} stroke={1.5} />}
                            onClick={() => props.setStock(item)}
                        />
                    </div>
                ))
            :
            <>
            </>
        }
            </div>
            </>
        }
          <div className={classes.footer}>
            { props.opened ?
                    <IconArrowBadgeLeft className={classes.iconButton} onClick={() => {props.toggle()}} stroke={1.5}/>
                :
                    <IconArrowBadgeRight className={classes.iconButton} onClick={() => {props.toggle()}} stroke={1.5}/>
            }
      </div>
    </nav>
        </>
    );
}

export default SidePanel;
