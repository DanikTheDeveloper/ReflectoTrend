import React from 'react';
import { TextInput, Textarea, Button, Container, Title, Group } from '@mantine/core';
import classes from "./Contact.module.css";

const ContactUs = () => {

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(e.target)
    }

    return (
        <Container className={classes.contact_container}>
            <Title order={2} className={classes.contact_title}>Contact Page</Title>
            <form onSubmit={(e) => handleSubmit(e)}>
                <TextInput
                    required
                    label="Name"
                    placeholder="Your name"
                    className={classes.contact_input}
                />
                <TextInput
                    required
                    label="Email"
                    placeholder="Your email"
                    className={classes.contact_input}
                />
                <Textarea
                    required
                    label="Message"
                    placeholder="Your message (max 200 words)"
                    maxLength={200}
                    autosize
                    minRows={4}
                    className={classes.contact_textarea}
                />
                <Group position="right" mt="md">
                    <Button type="submit">Send Message</Button>
                </Group>
            </form>
        </Container>
    );
}

export default ContactUs;

