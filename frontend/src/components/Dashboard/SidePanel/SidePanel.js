import React, { useState, useEffect } from "react";
import { NavLink, TextInput, Text, Tabs, ThemeIcon, Stack, Box, ActionIcon, Tooltip } from '@mantine/core';
import { IconSearch, IconStar, IconStarFilled, IconLayoutGrid, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import clsx from "clsx";
import classes from "./SidePanel.module.css";

const SidePanel = (props) => {
    const [favourites, setFavourites] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('favouriteStocks');
        if (saved) {
            try {
                setFavourites(JSON.parse(saved));
            } catch (e) {
                setFavourites([]);
            }
        }
    }, []);

    const toggleFavourite = (item) => {
        const isFav = favourites.some(fav => fav.value === item.value);
        const newFavourites = isFav
            ? favourites.filter(fav => fav.value !== item.value)
            : [...favourites, item];

        setFavourites(newFavourites);
        localStorage.setItem('favouriteStocks', JSON.stringify(newFavourites));
    };

    const isFavourite = (item) => favourites.some(fav => fav.value === item.value);

    const renderNavItem = (item, collapsed = false) => {
        const active = props.selectedStock?.value === item.value;
        const link = (
            <NavLink
                key={item.value}
                label={collapsed ? undefined : item.label}
                active={active}
                variant="filled"
                color="violet"
                className={clsx(classes.navItem, collapsed && classes.navItemCollapsed)}
                classNames={{ label: classes.navLabel }}
                leftSection={
                    <ThemeIcon size="sm" variant="light" radius="xl" className={classes.navIcon}>
                        <img src={"cryptoIcons/" + item.icon} alt={item.label[0]} />
                    </ThemeIcon>
                }
                onClick={() => props.setStock(item)}
                rightSection={!collapsed && (
                    <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavourite(item);
                        }}
                    >
                        {isFavourite(item) ?
                            <IconStarFilled size={14} className={classes.starActive} /> :
                            <IconStar size={14} className={classes.starIdle} />
                        }
                    </ActionIcon>
                )}
            />
        );

        return collapsed ? (
            <Tooltip key={item.value} label={item.label} position="right" withArrow>
                {link}
            </Tooltip>
        ) : link;
    };

    return (
        <Box className={classes.sidebar} style={{ width: props.opened ? '272px' : '64px' }}>
            <div className={clsx(classes.header, !props.opened && classes.headerCollapsed)}>
                {props.opened ? (
                    <>
                        <TextInput
                            placeholder="Search markets"
                            leftSection={<IconSearch size={14} />}
                            onChange={(e) => props.searchStocks(e)}
                            size="xs"
                            radius="md"
                            classNames={{ input: classes.searchInput }}
                            className={classes.searchWrap}
                        />
                        <Tooltip label="Collapse" position="bottom" withArrow>
                            <ActionIcon
                                variant="subtle"
                                radius="md"
                                size="md"
                                className={classes.toggleBtn}
                                onClick={props.toggle}
                            >
                                <IconChevronsLeft size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </>
                ) : (
                    <Tooltip label="Expand" position="right" withArrow>
                        <ActionIcon
                            variant="subtle"
                            radius="md"
                            size="md"
                            className={classes.toggleBtn}
                            onClick={props.toggle}
                        >
                            <IconChevronsRight size={16} />
                        </ActionIcon>
                    </Tooltip>
                )}
            </div>

            {props.opened && (
                <Tabs
                    value={props.selectedTab}
                    onChange={(e) => props.setTab(e)}
                    variant="pills"
                    classNames={{ list: classes.tabsList, tab: classes.tab }}
                >
                    <Tabs.List>
                        <Tabs.Tab value="all" leftSection={<IconLayoutGrid size={14} />}>All</Tabs.Tab>
                        <Tabs.Tab value="fav" leftSection={<IconStarFilled size={14} />}>Favourites</Tabs.Tab>
                    </Tabs.List>
                </Tabs>
            )}

            <div className={classes.listContainer}>
                {props.opened ? (
                    props.selectedTab === "fav" ? (
                        favourites.length === 0 ? (
                            <Text className={classes.emptyText}>
                                No favourites yet. Tap the star to pin a market here.
                            </Text>
                        ) : (
                            <Stack gap={2}>{favourites.map((item) => renderNavItem(item))}</Stack>
                        )
                    ) : props.isLoading ? (
                        <Text className={classes.emptyText}>Loading...</Text>
                    ) : (
                        <Stack gap={2}>{props.allList?.map((item) => renderNavItem(item))}</Stack>
                    )
                ) : (
                    <Stack gap={6} align="center">
                        {props.allList?.map((item) => renderNavItem(item, true))}
                    </Stack>
                )}
            </div>
        </Box>
    );
}

export default SidePanel;
