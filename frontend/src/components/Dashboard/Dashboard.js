import React from "react";
import {
    NavLink,
    Container,
    TextInput,
    Title,
    Text,
    Tabs,
    ThemeIcon,
    Skeleton,
    Burger
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconStar } from "@tabler/icons-react";
import classes from "./Dashboard.module.css";
import { useDispatch, useSelector } from "react-redux";
import Chart from "./Chart/Chart";
import SidePanel from "./SidePanel/SidePanel";

import PrivateHeader from "../Home/Header/PrivateHeader";

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
]

const Dashboard = () => {
    const dispatch = useDispatch();
    const stockList = useSelector((state) => state.stock.stockList)
    let stockData = useSelector((state) => state.stock.stockData)
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
        setSelectedTab(value)
        localStorage.setItem("selectedTab", value)
    }

    allList = stockList.map(item => ({
        startDate: item.startDate,
        label: item.name,
        value: item.code,
        type: item.type,
        icon: iconDict.find(each => each.name ===  item.name) !== undefined ? iconDict.find(each => each.name === item.name).icon : "generic.svg"
    }));
    cryptoList = allList.filter((each) => each.type === "crypto")

    React.useLayoutEffect( () => {
        setLoading(false);
        document.title="Dashboard"
        //dispatch(getStockData({stockName: selectedStock, interval: selectInterval, startDate: startDate, endDate: endDate }))
    }, [])

    React.useEffect(() => {
        //dispatch(getStockData({stockName: selectedStock, interval: "1h", startDate: startDate, endDate: endDate }))
        if ( selectedTab === "crypto") {
            cryptoList = cryptoList.filter(item => item.name === searchString)
        }
        else if (selectedTab === "all") {
            allList = allList.filter(item => item.name === searchString)
        }
        else {
            //favourites
            console.log("favourites not implemented")
        }
    }, [ searchString ])

    const setStock = (item) => {
        selectStock(item)
        console.log("stock is changed")
    }

    const searchStocks = (e) => {
        setSearchString(e.target.value)
    }

    return (
        <>
        <PrivateHeader />

        <SidePanel
            setTab={setTab}
            selectedTab={selectedTab}
            searchStocks={searchStocks}
            selectedStock={selectedStock}
            setStock={setStock}
            allList={allList}
            cryptoList={cryptoList}
            isLoading={isLoading}
        />
        <div className={classes.mainPanel} >
            <Chart
                stock={selectedStock}
            />
        </div>
        </>
    )
}

export default Dashboard;
