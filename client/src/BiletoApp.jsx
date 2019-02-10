import React, { Component } from "react";
import AccountInfo from "./AccountInfo";
import StoreInfo from "./StoreInfo";
import OpenStore from "./OpenStore";
import SuspendStore from "./SuspendStore";
import CloseStore from "./CloseStore";
import CreateEvent from "./CreateEvent";
import StartTicketSales from "./StartTicketSales";
import SuspendTicketSales from "./SuspendTicketSales";
import EndTicketSales from "./EndTicketSales";
import CompleteEvent from "./CompleteEvent";
import SettleEvent from "./SettleEvent";
import CancelEvent from "./CancelEvent";
import EventInfo from "./EventInfo";
import PurchaseTickets from "./PurchaseTickets";
import CancelPurchase from "./CancelPurchase";
import RefundPurchase from "./RefundPurchase";
import CheckIn from "./CheckIn";
import PurchaseInfo from "./PurchaseInfo";

import logo from "./tickets.svg";

class BiletoApp extends Component {
    state = {
        tracking: false,
        eventId: "",
        purchaseId: ""
    };

    handleOnChange = (event) => {
        this.setState({ [event.target.name]: event.target.value });
    };

    getTxStatus = (txStackId) => {
        const { transactions, transactionStack } = this.props.drizzleState;
        const txHash = transactionStack[txStackId];
        if (!txHash || !transactions[txHash]) return "...";
        return transactions[txHash].status;
    };

    trackContractEvent = (event) => {
        console.log(event);
    };

    fromWeiToEther = (amount) => {
        const wei =
            typeof amount === "number" || typeof amount === "object" ? amount.toString() : amount;
        const { fromWei } = this.props.drizzle.web3.utils;
        const output = `${!wei ? "???" : fromWei(wei, "ether")} ether`;
        return output;
    };

    componentDidMount() {
        const { drizzle, drizzleState } = this.props;
        const { events } = drizzle.contracts.Bileto;
        const { Bileto } = drizzle.options.events;
        this.unsubscribe = drizzle.store.subscribe(() => {
            if (drizzleState.drizzleStatus.initialized) {
                if (!this.state.tracking) {
                    for (const eventName of Bileto) {
                        events[eventName]().on("data", (event) => {
                            this.trackContractEvent(event);
                        });
                    }
                }
                this.setState({ tracking: true });
            }
        });
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    render() {
        const { address } = this.props.drizzle.contracts.Bileto;
        const account = this.props.drizzleState.accounts[0];
        const accountBalance = this.props.drizzleState.accountBalances[account];

        return (
            <React.Fragment>
                <nav className="navbar sticky-top navbar-dark text-white bg-dark">
                    <img
                        className="navbar-brand d-inline-block align-middle"
                        src={logo}
                        width="64px"
                        height="64px"
                        alt="bileto-logo"
                    />
                    <h4 className="nav-text">
                        <strong>BILETO</strong> a decentralized ticket store for Ethereum
                    </h4>
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <a
                                href={`https://etherscan.io/address/${address}`}
                                className="nav-link"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                {address}
                            </a>
                        </li>
                    </ul>
                </nav>
                <div className="container">
                    <div className="row mt-3">
                        <div className="col-8">
                            <AccountInfo
                                account={account}
                                accountBalance={this.fromWeiToEther(accountBalance)}
                                methods={this.props.drizzle.contracts.Bileto.methods}
                                results={this.props.drizzleState.contracts.Bileto}
                            />
                        </div>
                        <div className="col-4">
                            <OpenStore
                                openStore={this.props.drizzle.contracts.Bileto.methods.openStore}
                                getTxStatus={this.getTxStatus}
                            />
                        </div>
                    </div>
                    <div className="row mt-3">
                        <div className="col-8">
                            <StoreInfo
                                drizzle={this.props.drizzle}
                                drizzleState={this.props.drizzleState}
                                fromWeiToEther={this.fromWeiToEther}
                            />
                        </div>
                        <div className="col-4">
                            <div className="row">
                                <div className="col">
                                    <SuspendStore
                                        drizzle={this.props.drizzle}
                                        drizzleState={this.props.drizzleState}
                                        getTxStatus={this.getTxStatus}
                                    />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col">
                                    <CloseStore
                                        drizzle={this.props.drizzle}
                                        drizzleState={this.props.drizzleState}
                                        getTxStatus={this.getTxStatus}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row mt-3">
                        <div className="col-4">
                            <div className="row">
                                <div className="col">
                                    <StartTicketSales
                                        drizzle={this.props.drizzle}
                                        drizzleState={this.props.drizzleState}
                                        getTxStatus={this.getTxStatus}
                                        eventId={this.state.eventId}
                                    />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col">
                                    <SuspendTicketSales
                                        drizzle={this.props.drizzle}
                                        drizzleState={this.props.drizzleState}
                                        getTxStatus={this.getTxStatus}
                                        eventId={this.state.eventId}
                                    />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col">
                                    <EndTicketSales
                                        drizzle={this.props.drizzle}
                                        drizzleState={this.props.drizzleState}
                                        getTxStatus={this.getTxStatus}
                                        eventId={this.state.eventId}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-8">
                            <CreateEvent
                                drizzle={this.props.drizzle}
                                drizzleState={this.props.drizzleState}
                            />
                        </div>
                    </div>
                    <div className="row mt-3">
                        <div className="col-4">
                            <CompleteEvent
                                drizzle={this.props.drizzle}
                                drizzleState={this.props.drizzleState}
                                getTxStatus={this.getTxStatus}
                                eventId={this.state.eventId}
                            />
                        </div>
                        <div className="col-4">
                            <SettleEvent
                                drizzle={this.props.drizzle}
                                drizzleState={this.props.drizzleState}
                                getTxStatus={this.getTxStatus}
                                eventId={this.state.eventId}
                            />
                        </div>
                        <div className="col-4">
                            <CancelEvent
                                drizzle={this.props.drizzle}
                                drizzleState={this.props.drizzleState}
                                getTxStatus={this.getTxStatus}
                                eventId={this.state.eventId}
                            />
                        </div>
                    </div>
                    <div className="row mt-3">
                        <div className="col">
                            <EventInfo
                                drizzle={this.props.drizzle}
                                drizzleState={this.props.drizzleState}
                                fromWeiToEther={this.fromWeiToEther}
                                eventId={this.state.eventId}
                            />
                        </div>
                    </div>
                    <div className="row mt-3">
                        <div className="col">
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <span className="input-group-text" id="labelEventId">
                                        #
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    key="eventId"
                                    name="eventId"
                                    value={this.state.eventId}
                                    onChange={this.handleOnChange}
                                    min="1"
                                    className="form-control"
                                    placeholder="Event ID"
                                    aria-label="Event ID"
                                    aria-describedby="labelEventId"
                                    required
                                />
                            </div>
                        </div>
                        <div className="col">
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <span className="input-group-text" id="labelPurchaseId">
                                        #
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    key="purchaseId"
                                    name="purchaseId"
                                    value={this.state.purchaseId}
                                    onChange={this.handleOnChange}
                                    min="1"
                                    className="form-control"
                                    placeholder="Purchase ID"
                                    aria-label="Purchase ID"
                                    aria-describedby="labelPurchaseId"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <div className="row mt-3">
                        <div className="col-8">
                            <PurchaseInfo
                                drizzle={this.props.drizzle}
                                drizzleState={this.props.drizzleState}
                                fromWeiToEther={this.fromWeiToEther}
                                purchaseId={this.state.purchaseId}
                            />
                        </div>
                        <div className="col-4">
                            <div className="row">
                                <div className="col">
                                    <CancelPurchase
                                        drizzle={this.props.drizzle}
                                        drizzleState={this.props.drizzleState}
                                        getTxStatus={this.getTxStatus}
                                        purchaseId={this.state.purchaseId}
                                    />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col">
                                    <RefundPurchase
                                        drizzle={this.props.drizzle}
                                        drizzleState={this.props.drizzleState}
                                        getTxStatus={this.getTxStatus}
                                        eventId={this.state.eventId}
                                        purchaseId={this.state.purchaseId}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row mt-3">
                        <div className="col-8">
                            <PurchaseTickets
                                drizzle={this.props.drizzle}
                                drizzleState={this.props.drizzleState}
                                eventId={this.state.eventId}
                            />
                        </div>
                        <div className="col-4">
                            <CheckIn
                                drizzle={this.props.drizzle}
                                drizzleState={this.props.drizzleState}
                                getTxStatus={this.getTxStatus}
                                purchaseId={this.state.purchaseId}
                            />
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default BiletoApp;