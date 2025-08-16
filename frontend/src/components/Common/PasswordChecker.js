import { IconCheck, IconX } from "@tabler/icons-react";
import {Box, Text} from "@mantine/core";
import React from "react";

const requirements = [
    { re: /[0-9]/, label: "Includes number" },
    { re: /[a-z]/, label: "Includes lowercase letter" },
    { re: /[A-Z]/, label: "Includes uppercase letter" },
    { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: "Includes special symbol" },
];

export const PasswordRequirement = ({ meets, label }) => {
    return (
        <Text
        color={meets ? 'teal' : 'red'}
        sx={{ display: 'flex', alignItems: 'center' }}
        mt={7}
        size="sm"
        >
        {meets ? <IconCheck size="0.9rem" /> : <IconX size="0.9rem" />} <Box ml={10}>{label}</Box>
        </Text>
    );
}
export const getStrength = (password) => {
    let multiplier = password.length > 5 ? 0 : 1;

    requirements.forEach((requirement) => {
        if (!requirement.re.test(password)) {
        multiplier += 1;
        }
    });

    return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

export const checkPassword = (password) => {
    let checksObject = requirements.map((requirement, index) => (
        <PasswordRequirement key={index} label={requirement.label} meets={requirement.re.test(password)} />
    ));
    checksObject.push( <PasswordRequirement label="Includes at least 8 characters" meets={password.length > 7} /> )
    const strength = getStrength(password);
    const color = strength === 100 ? 'teal' : strength > 50 ? 'yellow' : 'red';
    return {
        color: color,
        strength: strength,
        checks: checksObject,
    }
}
