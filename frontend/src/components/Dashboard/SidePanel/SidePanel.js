import React from "react";
import { NavLink, TextInput, Title, Text, Tabs, ThemeIcon, Stack, Box, ActionIcon } from '@mantine/core';
import { IconSearch, IconStar, IconList, IconArrowBadgeRight, IconArrowBadgeLeft } from "@tabler/icons-react";
import classes from "./SidePanel.module.css";

const SidePanel = (props) => {
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
                                <Tabs.Tab value="all" leftSection={<IconList size={16} />}>All</Tabs.Tab>
                                <Tabs.Tab value="crypto" leftSection={<IconList size={16} />}>Favourites</Tabs.Tab>
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
                                                            {item.label[0]}
                                                        </ThemeIcon>
                                                    }
                                                    rightSection={<IconArrowBadgeRight size={16} />}
                                                    onClick={() => props.setStock(item)}
                                                    styles={{ root: { borderRadius: '8px' } }}
                                                />
                                            ))
                                        )}
                                    </Stack>
                                </Tabs.Panel>

                                <Tabs.Panel value="crypto" pt="xs">
                                    <Stack gap="xs" px="md" pb="md">
                                        {props.isLoading ? (
                                            <Text size="sm" c="dimmed">Loading...</Text>
                                        ) : (
                                            props.cryptoList?.map((item) => (
                                                <NavLink
                                                    key={item.value}
                                                    label={item.label}
                                                    variant={props.selectedStock?.value === item.value ? "light" : "subtle"}
                                                    leftSection={
                                                        <ThemeIcon size="sm" variant="light" radius="xl">
                                                            {item.label[0]}
                                                        </ThemeIcon>
                                                    }
                                                    rightSection={<IconArrowBadgeRight size={16} />}
                                                    onClick={() => props.setStock(item)}
                                                    styles={{ root: { borderRadius: '8px' } }}
                                                />
                                            ))
                                        )}
                                    </Stack>
                                </Tabs.Panel>

                                <Tabs.Panel value="fav" pt="xs">
                                    <Box px="md">
                                        <Text size="sm" c="dimmed">Not implemented yet.</Text>
                                    </Box>
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
                    <Box style={{ flex: 1, minHeight: 0, overflow: 'auto' }} py="xs">
                        <Stack gap="xs" px="xs">
                            {(props.selectedTab === "all" ? props.allList : props.cryptoList)?.map((item) => (
                                <NavLink
                                    key={item.value}
                                    label=""
                                    variant={props.selectedStock?.value === item.value ? "filled" : "subtle"}
                                    leftSection={
                                        <ThemeIcon size="sm" variant="light" radius="xl">
                                            {item.label[0]}
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
