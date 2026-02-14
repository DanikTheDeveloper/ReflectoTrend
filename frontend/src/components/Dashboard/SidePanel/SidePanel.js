import React, { useState, useEffect } from "react";
import { NavLink, TextInput, Title, Text, Tabs, ThemeIcon, Stack, Box, ActionIcon } from '@mantine/core';
import { IconSearch, IconStar, IconStarFilled, IconList, IconArrowBadgeRight, IconArrowBadgeLeft } from "@tabler/icons-react";
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
        const isFavourite = favourites.some(fav => fav.value === item.value);
        let newFavourites;
        
        if (isFavourite) {
            newFavourites = favourites.filter(fav => fav.value !== item.value);
        } else {
            newFavourites = [...favourites, item];
        }
        
        setFavourites(newFavourites);
        localStorage.setItem('favouriteStocks', JSON.stringify(newFavourites));
    };

    const isFavourite = (item) => {
        return favourites.some(fav => fav.value === item.value);
    };

    return (
        <Box 
            style={{ 
                height: '100vh',
                width: props.opened ? '280px' : '60px',
                display: 'flex',
                flexDirection: 'column',
                background: '#1a2f5a',
                borderRight: '1px solid rgba(255,255,255,0.1)',
                transition: 'width 0.2s ease',
                overflow: 'hidden',
                color: '#EDE9FF',
            }}
        >
            {props.opened ? (
                <>
                    <Box p="md" style={{ flexShrink: 0 }}>
                        <Title order={3} mb="md" c="white">Stocks</Title>
                        <TextInput
                            placeholder="Search"
                            leftSection={<IconSearch size={16} />}
                            onChange={(e) => props.searchStocks(e)}
                        />
                    </Box>

                    <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <Tabs 
                            value={props.selectedTab} 
                            onChange={(e) => props.setTab(e)}
                            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                        >
                            <Tabs.List px="md" style={{ flexShrink: 0 }}>
                                <Tabs.Tab 
                                    value="all" 
                                    leftSection={<IconList size={16} />}
                                    style={{
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    All
                                </Tabs.Tab>
                                <Tabs.Tab 
                                    value="fav" 
                                    leftSection={<IconStarFilled size={16} />}
                                    style={{
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    Favourites
                                </Tabs.Tab>
                            </Tabs.List>

                            <Box style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                                <Tabs.Panel value="all" pt="xs">
                                    <Stack gap="xs" px="md" pb="md">
                                        {props.isLoading ? (
                                            <Text size="sm" c="dimmed">Loading...</Text>
                                        ) : (
                                            props.allList?.map((item) => (
                                                <NavLink
                                                    key={item.value}
                                                    label={item.label}
                                                    variant={props.selectedStock?.value === item.value ? "light" : "subtle"}
                                                    leftSection={
                                                        <ThemeIcon size="sm" variant="light" radius="xl">
                                                            <img src={"cryptoIcons/" + item.icon} alt={item.label[0]} />
                                                        </ThemeIcon>
                                                    }
                                                    onClick={() => props.setStock(item)}
                                                    rightSection={
                                                        <ActionIcon
                                                            size="sm"
                                                            variant="subtle"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleFavourite(item);
                                                            }}
                                                        >
                                                            {isFavourite(item) ? 
                                                                <IconStarFilled size={16} style={{ color: '#ffd700' }} /> : 
                                                                <IconStar size={16} />
                                                            }
                                                        </ActionIcon>
                                                    }
                                                    styles={{ root: { borderRadius: '8px' } }}
                                                />
                                            ))
                                        )}
                                    </Stack>
                                </Tabs.Panel>

                                <Tabs.Panel value="fav" pt="xs">
                                    <Stack gap="xs" px="md" pb="md">
                                        {favourites.length === 0 ? (
                                            <Text size="sm" c="dimmed">No favourites yet. Click the star icon to add stocks to your favourites.</Text>
                                        ) : (
                                            favourites.map((item) => (
                                                <NavLink
                                                    key={item.value}
                                                    label={item.label}
                                                    variant={props.selectedStock?.value === item.value ? "light" : "subtle"}
                                                    leftSection={
                                                        <ThemeIcon size="sm" variant="light" radius="xl">
                                                            <img src={"cryptoIcons/" + item.icon} alt={item.label[0]} />
                                                        </ThemeIcon>
                                                    }
                                                    onClick={() => props.setStock(item)}
                                                    rightSection={
                                                        <ActionIcon
                                                            size="sm"
                                                            variant="subtle"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleFavourite(item);
                                                            }}
                                                        >
                                                            <IconStarFilled size={16} style={{ color: '#ffd700' }} />
                                                        </ActionIcon>
                                                    }
                                                    styles={{ root: { borderRadius: '8px' } }}
                                                />
                                            ))
                                        )}
                                    </Stack>
                                </Tabs.Panel>
                            </Box>
                        </Tabs>
                    </Box>

                    <Box p="md" style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <ActionIcon 
                            variant="light" 
                            onClick={props.toggle}
                            size="lg"
                            style={{ width: '100%' }}
                        >
                            <IconArrowBadgeLeft stroke={1.5} />
                        </ActionIcon>
                    </Box>
                </>
            ) : (
                <>
                    <Box style={{ flex: 1, minHeight: 0, marginTop: '80px' }} py="xs">
                        <Stack gap="xs" px="xs">
                            {props.allList?.map((item) => (
                                <NavLink
                                    key={item.value}
                                    label=""
                                    variant={props.selectedStock?.value === item.value ? "filled" : "subtle"}
                                    leftSection={
                                        <ThemeIcon size="sm" variant="light" radius="xl">
                                            <img src={"cryptoIcons/" + item.icon} alt={item.label[0]} />
                                        </ThemeIcon>
                                    }
                                    onClick={() => props.setStock(item)}
                                    styles={{ root: { borderRadius: '8px', padding: '8px' } }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Box p="xs" style={{ flexShrink: 0 }}>
                        <ActionIcon 
                            variant="light" 
                            onClick={props.toggle}
                            size="lg"
                            style={{ width: '100%' }}
                        >
                            <IconArrowBadgeRight stroke={1.5} />
                        </ActionIcon>
                    </Box>
                </>
            )}
        </Box>
    );
}

export default SidePanel;
