import React from "react";
import { Notification, Text } from "@mantine/core";
import { IconX, IconCheck } from "@tabler/icons-react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../store/NotificationSlice";
import classes from "./Notification.module.css";

const NotificationBar = () => {
    const dispatch = useDispatch();
    const notif = useSelector((state) => state.notification);
    console.log(notif);

    React.useEffect(() => {
        if (notif.type !== null) {
            setTimeout(() => {
                dispatch(notificationActions.clearStatus());
            }, 3000);
        }
    }, [notif]);

    return (
        <>
            { notif.type !== null &&
                <div className={classes.notifPopup} >
                    <Notification
                        className={classes.notif}
                        onClose={() => dispatch(notificationActions.clearStatus())}
                        icon={
                            notif.type === "success" ?  <IconCheck /> :
                            notif.type === "error" ? <IconX /> :
                            notif.type === "warning" ? <IconX /> : null
                        }
                        color={
                            notif.type === "success" ? "var(--success-color)" :
                            notif.type === "error" ? "var(--danger-color)" :
                            notif.type === "warning" ? "var(--warning-color)" :
                            "var(--info-color)"
                        }
                        title={<Text size="xl"> {notif.title} </Text>}
                    >
                        <Text size="lg">
                            {notif.message}
                        </Text>
                    </Notification>
                </div>
			}
        </>
    )
}

export default NotificationBar;
