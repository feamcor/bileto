import React, { Component } from "react";
import NavBar from "./NavBar";
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
        const { methods } = this.props.drizzle.contracts.Bileto;
        const results = this.props.drizzleState.contracts.Bileto;

        return (
            <React.Fragment>
                <NavBar address={address} />
                <div className="container">
                    <div className="row mt-3">
                        <div className="col-8">
                            <AccountInfo
                                account={account}
                                accountBalance={this.fromWeiToEther(accountBalance)}
                                methods={methods}
                                results={results}
                            />
                        </div>
                        <div className="col-4">
                            <OpenStore
                                openStore={methods.openStore}
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
                                        suspendStore={methods.suspendStore}
                                        getTxStatus={this.getTxStatus}
                                    />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col">
                                    <CloseStore
                                        closeStore={methods.closeStore}
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
                                        startTicketSales={methods.startTicketSales}
                                        getTxStatus={this.getTxStatus}
                                        eventId={this.state.eventId}
                                    />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col">
                                    <SuspendTicketSales
                                        suspendTicketSales={methods.suspendTicketSales}
                                        getTxStatus={this.getTxStatus}
                                        eventId={this.state.eventId}
                                    />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col">
                                    <EndTicketSales
                                        endTicketSales={methods.endTicketSales}
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
                                completeEvent={methods.completeEvent}
                                getTxStatus={this.getTxStatus}
                                eventId={this.state.eventId}
                            />
                        </div>
                        <div className="col-4">
                            <SettleEvent
                                settleEvent={methods.settleEvent}
                                getTxStatus={this.getTxStatus}
                                eventId={this.state.eventId}
                            />
                        </div>
                        <div className="col-4">
                            <CancelEvent
                                cancelEvent={methods.cancelEvent}
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
                                        cancelPurchase={methods.cancelPurchase}
                                        getTxStatus={this.getTxStatus}
                                        purchaseId={this.state.purchaseId}
                                    />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col">
                                    <RefundPurchase
                                        refundPurchase={methods.refundPurchase}
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
                                checkIn={methods.checkIn}
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
