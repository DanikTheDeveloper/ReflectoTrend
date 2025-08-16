import React from 'react';
import { Button } from '@mantine/core';
import { useDispatch } from 'react-redux';
import { initGoogleAuth } from '../../store/AuthSlice';
import { FaGoogle } from 'react-icons/fa';
import classes from './Auth.module.css';

function GoogleSignInButton(props = {message: "Continue with"}) {
    const dispatch = useDispatch();

    const handleGoogleSignIn = async () => {
        dispatch(initGoogleAuth()).unwrap().then((data) => {
            console.log(data)
            window.open(data.url, "_self")
        }).catch((error) => {
            console.log(error)
        })
    }

  return (
        <>
        <div className={classes.socialButtonContainer}>
        <Button
              className={classes.googleButton}
              leftSection={<FaGoogle style={{ marginRight: '10px' }} />}
              onClick={handleGoogleSignIn}
              size="md"
            >
                {props.message} with Google
            </Button>
        </div>
      </>
  );
}

export default GoogleSignInButton;
