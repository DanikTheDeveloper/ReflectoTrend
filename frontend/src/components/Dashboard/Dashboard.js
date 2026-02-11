import React from "react";
import classes from "./Dashboard.module.css";
import { useDispatch, useSelector } from "react-redux";
import Chart from "./Chart/Chart";
import SidePanel from "./SidePanel/SidePanel";
import AppShell from "../General/AppShell";
import { Grid, Button } from "@mantine/core";
import { Link } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';

const iconDict = [
    {
        name: "Ethereum",
        icon: "eth.svg"
    },
    {
        name: "Bitcoin",
        icon: "btc.svg"
    },
    {
        name: "Litecoin",
        icon: "ltc.svg"
    }
];

const Dashboard = () => {
    const dispatch = useDispatch();
    const stockList = useSelector((state) => state.stock.stockList);
    let stockData = useSelector((state) => state.stock.stockData);
    const [opened, {toggle}] = useDisclosure(true);
    let cryptoList = [];
    let allList = [];

    let today = new Date();
    let lastYear  = new Date(new Date().setFullYear(today.getFullYear() - 1));

    const [selectedStock, selectStock] = React.useState({
        startDate: lastYear,
        label: "Bitcoin",
        value: "BTC-USD",
        type: "crypto",
        icon: "btc.svg"
    });
    const [isLoading, setLoading] = React.useState(true);
    const [selectedTab, setSelectedTab] = React.useState(localStorage.getItem('selectedTab') !== null ? localStorage.getItem('selectedTab') : "crypto");
    const [searchString, setSearchString] = React.useState('');

    const setTab = (value) => {
        setSelectedTab(value);
        localStorage.setItem("selectedTab", value);
    };

    allList = stockList.map(item => ({
        startDate: item.startDate,
        label: item.name,
        value: item.code,
        type: item.type,
        icon: iconDict.find(each => each.name ===  item.name) !== undefined ? iconDict.find(each => each.name === item.name).icon : "generic.svg"
    }));
    cryptoList = allList.filter((each) => each.type === "crypto");

    React.useLayoutEffect( () => {
        setLoading(false);
        document.title = "Dashboard";
    }, []);

    React.useEffect(() => {
        if ( selectedTab === "crypto") {
            cryptoList = cryptoList.filter(item => item.name === searchString);
        } else if (selectedTab === "all") {
            allList = allList.filter(item => item.name === searchString);
        } else {
            console.log("favourites not implemented");
        }
    }, [ searchString ]);

    const setStock = (item) => {
        selectStock(item);
    };

    const searchStocks = (e) => {
        setSearchString(e.target.value);
    };

    return (
        <AppShell
            selectedIndex={0}
            component={
                <Grid gutter="xs" overflow="hidden">
                    <Grid.Col span={opened ? "content" : 1}>
                        <SidePanel
                            opened={opened}
                            toggle={toggle}
                            setTab={setTab}
                            selectedTab={selectedTab}
                            searchStocks={searchStocks}
                            selectedStock={selectedStock}
                            setStock={setStock}
                            allList={allList}
                            cryptoList={cryptoList}
                            isLoading={isLoading}
                        />
                    </Grid.Col>
                    <Grid.Col span={opened ? 9 : 11}>
                        <div className={classes.mainPanel}>
                            <Chart stock={selectedStock} />
                        </div>
                    </Grid.Col>
                </Grid>
            }
        />
    );
};

export default Dashboard;
