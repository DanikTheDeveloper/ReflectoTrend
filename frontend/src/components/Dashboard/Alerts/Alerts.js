import React from "react";
import {
  Container, Title, Text, Button, Table, Badge, Group, Modal, Select, NumberInput, Switch,
  Stack, ActionIcon, Tooltip, Loader, Center, Paper,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash, IconBellRinging, IconBellOff } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAlerts, createAlert, deleteAlert, updateAlert } from "../../../store/AlertsSlice";
import AppShell from "../../General/AppShell";
import classes from "./Alerts.module.css";

const Alerts = () => {
  const dispatch = useDispatch();
  const alerts = useSelector((state) => state.alerts?.alerts || []);
  const isLoading = useSelector((state) => state.alerts?.isLoading || false);
  const stockList = useSelector((state) => state.stock.stockList || []);
  const userEmail = useSelector((state) => state.auth.email);

  const [opened, { open, close }] = useDisclosure(false);
  const [newAlert, setNewAlert] = React.useState({
    symbol: "",
    condition: "above",
    target_value: 0,
    repeat: false,
  });

  React.useEffect(() => {
    dispatch(fetchAlerts());
  }, [dispatch]);

  const handleCreate = async () => {
    if (!newAlert.symbol || newAlert.target_value <= 0) return;
    await dispatch(createAlert(newAlert));
    setNewAlert({ symbol: "", condition: "above", target_value: 0, repeat: false });
    close();
  };

  const handleDelete = (id) => {
    dispatch(deleteAlert(id));
  };

  const handleToggleStatus = (alert) => {
    const newStatus = alert.status === "active" ? "disabled" : "active";
    dispatch(updateAlert({ id: alert.id, status: newStatus }));
  };

  const statusMeta = {
    active: { color: "green", dot: "#3BB266" },
    triggered: { color: "orange", dot: "#F59F00" },
    disabled: { color: "gray", dot: "#868e96" },
  };

  const statusBadge = (status) => {
    const meta = statusMeta[status] || statusMeta.disabled;
    return (
      <Badge color={meta.color} variant="light" radius="sm">
        <span className={classes.statusDot} style={{ backgroundColor: meta.dot }} />
        {status}
      </Badge>
    );
  };

  const conditionLabel = (c) => {
    const labels = {
      above: "Price Above",
      below: "Price Below",
      pct_change: "% Change",
    };
    return labels[c] || c;
  };

  const rows = alerts.map((a) => (
    <Table.Tr key={a.id} className={classes.tableRow}>
      <Table.Td className={classes.tableCell}>
        <div className={classes.symbolCell}>
          <span className={classes.symbolDot} />
          <Text fw={600}>{a.symbol}</Text>
        </div>
      </Table.Td>
      <Table.Td className={classes.tableCell}>{conditionLabel(a.condition)}</Table.Td>
      <Table.Td className={classes.tableCell}>
        {a.condition === "pct_change" ? `${a.target_value}%` : `$${a.target_value.toFixed(2)}`}
      </Table.Td>
      <Table.Td className={classes.tableCell}>{statusBadge(a.status)}</Table.Td>
      <Table.Td className={classes.tableCell}>
        <Switch
          checked={a.status === "active"}
          onChange={() => handleToggleStatus(a)}
          color="violet"
          size="sm"
        />
      </Table.Td>
      <Table.Td className={classes.tableCell}>
        <Tooltip label="Delete" withArrow>
          <ActionIcon
            color="red"
            variant="subtle"
            radius="md"
            className={classes.deleteBtn}
            onClick={() => handleDelete(a.id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <AppShell
      selectedIndex={4}
      component={
        <div className={classes.pageWrapper}>
          <Container size="md">
            <Paper className={classes.card}>
              <div className={classes.headerRow}>
                <div className={classes.iconBadge}>
                  <IconBellRinging size={22} />
                </div>
                <div>
                  <Title order={3} className={classes.title}>Price Alerts</Title>
                </div>
                <Button
                  ml="auto"
                  radius="md"
                  variant="gradient"
                  gradient={{ from: "#613DE4", to: "#4E31B6", deg: 135 }}
                  leftSection={<IconBellRinging size={18} />}
                  onClick={open}
                >
                  New Alert
                </Button>
              </div>

              <Text size="sm" c="dimmed" className={classes.subtitle}>
                Notifications will be sent to <Text component="span" fw={600}>{userEmail}</Text>
                <Text component="span" size="xs" c="violet" className={classes.telegramTag}>
                  Telegram — coming soon
                </Text>
              </Text>

              {isLoading ? (
                <Center py="xl">
                  <Loader color="violet" />
                </Center>
              ) : alerts.length === 0 ? (
                <div className={classes.emptyState}>
                  <div className={classes.emptyIcon}>
                    <IconBellOff size={28} />
                  </div>
                  <Text fw={600}>No alerts yet</Text>
                  <Text c="dimmed" size="sm" maw={320}>
                    Create one to get notified the moment your price targets are hit.
                  </Text>
                </div>
              ) : (
                <div className={classes.tableWrapper}>
                  <Table verticalSpacing={0} horizontalSpacing={0}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th className={classes.tableHeadCell}>Symbol</Table.Th>
                        <Table.Th className={classes.tableHeadCell}>Condition</Table.Th>
                        <Table.Th className={classes.tableHeadCell}>Target</Table.Th>
                        <Table.Th className={classes.tableHeadCell}>Status</Table.Th>
                        <Table.Th className={classes.tableHeadCell}>Active</Table.Th>
                        <Table.Th className={classes.tableHeadCell}></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                  </Table>
                </div>
              )}
            </Paper>
          </Container>

          <Modal
            opened={opened}
            onClose={close}
            radius="lg"
            title={
              <Group gap={10}>
                <div className={classes.modalIconBadge}>
                  <IconBellRinging size={18} />
                </div>
                <Text fw={700}>Create Alert</Text>
              </Group>
            }
            size="md"
          >
            <Stack gap="md" pt="xs">
              <Select
                label="Symbol"
                placeholder="Select a symbol"
                data={stockList.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))}
                value={newAlert.symbol}
                onChange={(v) => setNewAlert({ ...newAlert, symbol: v || "" })}
                searchable
                required
              />
              <Select
                label="Condition"
                data={[
                  { value: "above", label: "Price Above" },
                  { value: "below", label: "Price Below" },
                  { value: "pct_change", label: "Percent Change" },
                ]}
                value={newAlert.condition}
                onChange={(v) => setNewAlert({ ...newAlert, condition: v || "above" })}
                required
              />
              {newAlert.condition === "pct_change" ? (
                <NumberInput
                  label="Change %"
                  placeholder="Enter percentage"
                  value={newAlert.target_value}
                  onChange={(v) => setNewAlert({ ...newAlert, target_value: Number(v) || 0 })}
                  min={0.01}
                  step={0.1}
                  suffix="%"
                  required
                />
              ) : (
                <NumberInput
                  label="Target Price ($)"
                  placeholder="Enter target price"
                  value={newAlert.target_value}
                  onChange={(v) => setNewAlert({ ...newAlert, target_value: Number(v) || 0 })}
                  min={0.01}
                  step={0.01}
                  required
                />
              )}
              <Switch
                label="Repeat (re-arm after trigger)"
                checked={newAlert.repeat || false}
                onChange={(e) => setNewAlert({ ...newAlert, repeat: e.currentTarget.checked })}
                color="violet"
              />
              <Button
                fullWidth
                variant="gradient"
                gradient={{ from: "#613DE4", to: "#4E31B6", deg: 135 }}
                onClick={handleCreate}
                disabled={!newAlert.symbol || newAlert.target_value <= 0}
              >
                Create Alert
              </Button>
            </Stack>
          </Modal>
        </div>
      }
    />
  );
};

export default Alerts;
