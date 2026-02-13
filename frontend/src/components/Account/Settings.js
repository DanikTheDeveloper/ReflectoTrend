import React from 'react';
import { Accordion, Stack, Popover, Space, Paper, TextInput, PasswordInput, Button, Title, Text, Progress, Box } from "@mantine/core";
import { useForm } from '@mantine/form';
import { checkPassword } from "../Common/PasswordChecker.js";
import { IconLogin2, IconKey, IconMail, IconDeviceMobile } from "@tabler/icons-react";

const Settings = () => {
  const [popoverOpened, setPopoverOpened] = React.useState(false);
  const [passwordCheck, setPasswordCheck] = React.useState({
    color: "red",
    strength: 0,
    checks: null,
    meetsRequirements: false,
  });

  const passwordForm = useForm({
    validateOnInputChange: true,
    initialValues: {
      password: '',
      newPassword: '',
      newPassword2: '',
      meetsRequirements: false,
    },
    validate: {
      newPassword2: (value, values) => (value !== values.newPassword && value !== '') ? 'Passwords did not match' : null,
      newPassword: (value) => (value !== '') ? null : 'Invalid password',
      meetsRequirements: (value) => value !== true ? 'Password does not meet requirements' : null,
    }
  });

  React.useEffect(() => {
    const result = checkPassword(passwordForm.values.newPassword);
    setPasswordCheck(result);
    passwordForm.setFieldValue("meetsRequirements", result.meetsRequirements);
  }, [passwordForm.values.newPassword]);

  const handlePasswordChange = (values) => {
    console.log(values);
  };

  const emailForm = useForm({
    validateOnInputChange: true,
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    }
  });

  const handleEmailChange = (values) => {
    console.log(values);
  };

  return (
      <Stack gap="md">
        <Title order={3}>Settings</Title>

        <Accordion
          variant="separated"
          radius="lg"
          styles={{
            item: {
              border: '1px solid rgba(0,0,0,0.06)',
              background: 'rgba(255,255,255,0.7)',
              transition: 'all 0.2s ease'
            },
            control: {
              borderRadius: '12px',
              padding: '14px',
              fontWeight: 500
            },
            controlLabel: {
              fontSize: '14px'
            },
            itemOpened: {
              background: 'rgba(255,255,255,0.95)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
            },
            chevron: {
              transition: 'transform 0.2s ease'
            }
          }}
        >
          <Accordion.Item value="change_password">
            <Accordion.Control icon={<IconKey size={20} color="#5c7cfa" />}>
              Change Password
            </Accordion.Control>
            <Accordion.Panel>
              <form onSubmit={passwordForm.onSubmit(handlePasswordChange)}>
                <PasswordInput
                  size="md"
                  mt="md"
                  label="Current Password"
                  placeholder="Enter current password"
                  required
                  {...passwordForm.getInputProps('password')}
                />

                <Popover
                  opened={popoverOpened}
                  position="bottom"
                  width="target"
                  transitionProps={{ transition: "pop" }}
                >
                  <Popover.Target>
                    <Box
                      onFocusCapture={() => setPopoverOpened(true)}
                      onBlurCapture={() => setPopoverOpened(false)}
                    >
                      <PasswordInput
                        size="md"
                        required
                        label="New Password"
                        placeholder="Enter new password"
                        mt="md"
                        {...passwordForm.getInputProps('newPassword')}
                      />
                    </Box>
                  </Popover.Target>

                  <Popover.Dropdown>
                    <Progress color={passwordCheck.color} value={passwordCheck.strength} size={5} mb="xs" />
                    {passwordCheck.checks}
                  </Popover.Dropdown>
                </Popover>

                <PasswordInput
                  size="md"
                  placeholder="Confirm new password"
                  label="Confirm Password"
                  required
                  mt="md"
                  {...passwordForm.getInputProps('newPassword2')}
                />

                <Button
                  rightSection={<IconLogin2 size={18} />}
                  disabled={!passwordForm.isValid()}
                  fullWidth
                  type="submit"
                  radius="md"
                  mt="md"
                  size="md"
                >
                  Change Password
                </Button>
              </form>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="change_email">
            <Accordion.Control icon={<IconMail size={20} color="#5c7cfa" />}>
              Change Email
            </Accordion.Control>
            <Accordion.Panel>
              <form onSubmit={emailForm.onSubmit(handleEmailChange)}>
                <TextInput
                  size="md"
                  mt="md"
                  label="New Email"
                  placeholder="test@example.com"
                  required
                  {...emailForm.getInputProps('email')}
                />

                <Button
                  rightSection={<IconLogin2 size={18} />}
                  disabled={!emailForm.isValid()}
                  fullWidth
                  type="submit"
                  radius="md"
                  mt="md"
                  size="md"
                >
                  Change Email
                </Button>
              </form>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="add_2fa">
            <Accordion.Control icon={<IconDeviceMobile size={20} color="#5c7cfa" />}>
              Change 2FA
            </Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed">Work in progress</Text>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
  );
};

export default Settings;

