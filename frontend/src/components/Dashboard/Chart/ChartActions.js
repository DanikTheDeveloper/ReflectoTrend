import React from "react";
import { ActionIcon, Group, Space, Tooltip } from "@mantine/core";
import { IconBrush, IconRefresh, IconZoomInArea, IconBackslash, IconChartHistogram, IconArrowsHorizontal} from "@tabler/icons-react";

const ChartActions = (props = { zoomEvent, brush, macd, handleAction }) => {
    return (
        <div>
                <Space h="xs" />
                <Tooltip label="Reset View" position="right" withArrow>
                    <ActionIcon variant="filled" aria-label="reset" onClick={() => { props.handleAction("resetView") }} >
                        <IconRefresh size="1.5rem" stroke={1.5} />
                    </ActionIcon>
                </Tooltip>
                <Space h="xs" />
                <Tooltip label="Brush" position="right" withArrow>
                    <ActionIcon variant="filled" aria-label="brush" onClick={() => { props.handleAction("brush") }} >
                        {props.brush === false ?
                            <IconBrush size="1.5rem" stroke={1.5} />
                            :
                            <>
                                <Group position="center" style={{ position: 'relative', width: 'fit-content' }}  >
                                    <IconBrush size="1.5rem" stroke={1.5} style={{ position: 'absolute' }} />
                                    <IconBackslash size="2rem" stroke={2.5} style={{ position: 'relative', right: 0, bottom: 0 }} />
                                </Group>
                            </>
                        }
                    </ActionIcon>
                </Tooltip>
                <Space h="sm" />
                <Tooltip label="Zoom" position="right" withArrow>
                    <ActionIcon variant="filled" aria-label="zoomEvent" onClick={() => { props.handleAction("zoomEvent") }} >
                        {props.zoomEvent === false ?
                            <IconZoomInArea size="1.5rem" stroke={1.5} />
                            :
                            <>
                                <Group position="center" style={{ position: 'relative', width: 'fit-content' }}  >
                                    <IconZoomInArea size="1.5rem" stroke={1.5} style={{ position: 'absolute' }} />
                                    <IconBackslash size="2rem" stroke={2.5} style={{ position: 'relative', right: 0, bottom: 0 }} />
                                </Group>
                            </>
                        }
                    </ActionIcon>
                </Tooltip>
                <Space h="xs" />
                <Tooltip label="MACD Series" position="right" withArrow>
                    <ActionIcon variant="filled" aria-label="macd" onClick={() => { props.handleAction("macd") }} >
                        {props.macd === false ?
                            <IconChartHistogram size="1.5rem" stroke={1.5} />
                            :
                            <>
                                <Group position="center" style={{ position: 'relative', width: 'fit-content' }}  >
                                    <IconChartHistogram size="1.5rem" stroke={1.5} style={{ position: 'absolute' }} />
                                    <IconBackslash size="2rem" stroke={2.5} style={{ position: 'relative', right: 0, bottom: 0 }} />
                                </Group>
                            </>
                        }
                    </ActionIcon>
                </Tooltip>
        </div>
    );
}

export default ChartActions;
