import React from "react";
import '@mantine/core/styles.css';
import { useNavigate } from "react-router-dom";
import { Button } from '@mantine/core';
import {useSelector} from "react-redux";
import AppShell from "../../General/AppShell";
import classes from "./Landing.module.css";

import {useDispatch} from "react-redux";

const Home = () => {
    const navigate = useNavigate();

    return (
			<AppShell
				component={<>
						<div className={classes.home}>
								<h1>Home</h1>
								<Button
										onClick={() => navigate('/dashboard') }
										color="blue"
										variant="outline"
										radius="md"
										size="md"
								>
								Dashboard
								</Button>
						</div>
						</>
					}
					selectedIndex={1}
			/>
    );
}

export default Home;
