import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signOut } from "../../store/AuthSlice";
import { LoadingOverlay } from "@mantine/core";

const SignOut = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    React.useLayoutEffect(() => {
        if (localStorage.getItem('token') === null) {
            navigate('/');
        }
        else {
            dispatch(signOut({})).unwrap().then(() => {
                localStorage.clear();
                window.location.reload();
                navigate('/');
            })
            .catch(() => {
                console.log("error from signout")
            })
        }
    }, []);

    return (
        <>
            <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "lg", blur: 0.5 }}/>
        </>
    )
}

export default SignOut;
