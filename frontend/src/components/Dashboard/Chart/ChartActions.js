import React from "react";
import { ActionIcon, Group, Space, Tooltip } from "@mantine/core";
import { IconBrush, IconHandGrab, IconZoomInArea, IconBackslash, IconPointer, IconArrowsHorizontal} from "@tabler/icons-react";

const ChartActions = (props = { mouseMoveEvent, panEvent, zoomEvent, brush, handleAction}) => {

    return (
        <div>
        <ActionIcon.Group borderWidth={1} orientation="vertical">
            <Tooltip label="Mouse Move" position="right" withArrow>
            <ActionIcon variant="filled" aria-label="mouseMoveEvent" onClick={() => {props.handleAction("mouseMoveEvent")}} >
                { props.mouseMoveEvent === false ?
                    <IconPointer  size="1.5rem" stroke={1.5} style={{ position: 'absolute' }} />
                    :
                    <>
                    <Group position="center" style={{ position: 'relative', width: 'fit-content' }}  >
                        <IconPointer  size="1.5rem" stroke={1.5} style={{ position: 'absolute' }} />
                        <IconBackslash  size="2rem" stroke={2.5} style={{ position: 'relative', right: 0, bottom: 0 }} />
                    </Group>
                    </>
                }
            </ActionIcon>
            </Tooltip>
            <Space h="xs" />
            <Tooltip label="Horizontal Scroll" position="right" withArrow>
            <ActionIcon variant="filled" aria-label="panEvent" id="panEvent" onClick={() => {props.handleAction("panEvent")}} >
                { props.panEvent === false ?
                    <IconHandGrab  size="1.5rem" stroke={1.5} style={{ position: 'absolute' }} />
                    :
                    <>
                    <Group position="center" style={{ position: 'relative', width: 'fit-content' }}  >
                        <IconHandGrab  size="1.5rem" stroke={1.5} style={{ position: 'absolute' }} />
                        <IconBackslash  size="2rem" stroke={2.5} style={{ position: 'relative', right: 0, bottom: 0 }} />
                    </Group>
                    </>
                }
            </ActionIcon>
            </Tooltip>
            <Space h="xs" />
            <Tooltip label="Zoom" position="right" withArrow>
            <ActionIcon variant="filled" aria-label="zoomEvent" onClick={() => {props.handleAction("zoomEvent")}} >
                { props.zoomEvent === false ?
                    <IconZoomInArea  size="1.5rem" stroke={1.5} />
                    :
                    <>
                    <Group position="center" style={{ position: 'relative', width: 'fit-content' }}  >
                        <IconZoomInArea  size="1.5rem" stroke={1.5} style={{ position: 'absolute' }} />
                        <IconBackslash  size="2rem" stroke={2.5} style={{ position: 'relative', right: 0, bottom: 0 }} />
                    </Group>
                    </>
                }
            </ActionIcon>
            </Tooltip>
            <Space h="xs" />
            <Tooltip label="brush" position="right" withArrow>
            <ActionIcon variant="filled" aria-label="brush" onClick={() => {props.handleAction("brush")}} >
                { props.brush === false ?
                    <IconBrush  size="1.5rem" stroke={1.5} />
                    :
                    <>
                    <Group position="center" style={{ position: 'relative', width: 'fit-content' }}  >
                        <IconBrush  size="1.5rem" stroke={1.5} style={{ position: 'absolute' }} />
                        <IconBackslash  size="2rem" stroke={2.5} style={{ position: 'relative', right: 0, bottom: 0 }} />
                    </Group>
                    </>
                }
            </ActionIcon>
            </Tooltip>
        </ActionIcon.Group>
        </div>
    );
}

export default ChartActions;
