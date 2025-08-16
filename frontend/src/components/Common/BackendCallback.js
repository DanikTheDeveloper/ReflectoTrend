import React from "react";
import { LoadingOverlay } from "@mantine/core"
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { googleAuthCallback } from "../../store/AuthSlice.js";
import {notificationActions} from '../../store/NotificationSlice';
import { useSelector } from "react-redux";

const BackendCallback = () => {
    const [ params ] = useSearchParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated)

    React.useLayoutEffect(() => {
        document.title = "Google Auth";
        if (isAuthenticated === true) {
            navigate('/dashboard')
        }
    }, [isAuthenticated]);

    React.useLayoutEffect(() => {
        dispatch(googleAuthCallback(params)).unwrap().then((resp) => {
            console.log(resp)
            dispatch(notificationActions.setStatus({type: 'success', message: 'Successfully authorized with Google.', title: 'Google Auth'}))
            navigate('/dashboard')
        }).catch((error) => {
            navigate('/register')
            console.log(error)
            dispatch(notificationActions.setStatus({type: 'error', message: 'Google Auth failed', title: 'Google Auth'}))
        });
    }, [params]);

    return (
        <>
            <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "lg", blur: 2 }}/>
        </>
    );
}

export default BackendCallback;
