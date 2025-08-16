import React from 'react';
import { useSelector } from 'react-redux';
import { LoadingOverlay } from '@mantine/core'
import { useNavigate } from 'react-router-dom';

const PrivateRoute = (props) => {
    const auth = useSelector(state => state.auth);
    const navigate = useNavigate();

    React.useEffect(() => {
        if (auth.isAuthenticated != true) {
            console.log(auth);
            console.log("not authenticated")
            navigate("/signin")
        }
    }, [auth]);

    return (
        <>
        { auth.isLoading == true ?
            <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "lg", blur: 2}} />
        :
        auth.isAuthenticated == true ?
            <>
            {props.children}
            </>
        :
        <h2> Not found </h2>
        }
        </>
    )
};

export default PrivateRoute;
