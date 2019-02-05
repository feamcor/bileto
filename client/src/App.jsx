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

import logo from "./tickets.png";

class App extends Component {
  state = {
    loading: true,
    drizzleState: null,
    tracking: false,
    eventId: "",
    purchaseId: ""
  };

  handleOnChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  constructor(props) {
    super(props);
    this.handleOnChange = this.handleOnChange.bind(this);
  }

  componentDidMount() {
    const { drizzle } = this.props;
    this.unsubscribe = drizzle.store.subscribe(() => {
      const drizzleState = drizzle.store.getState();
      if (drizzleState.drizzleStatus.initialized) {
        if (this.state.tracking === false) {
          const { events } = drizzle.contracts.Bileto;
          const { Bileto } = drizzle.options.events;
          for (let i = 0; i < Bileto.length; i++) {
            // console.log(`tracking event: ${Bileto[i]}`);
            events[Bileto[i]]().on("data", event => {
              this.track(event);
            });
          }
        }
        this.setState({ loading: false, drizzleState, tracking: true });
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  track(event) {
    console.log(event);
  }

  render() {
    if (this.state.loading) return "Loading...";
    return (
      <React.Fragment>
        <nav className="navbar sticky-top navbar-dark bg-dark">
          <span className="navbar-brand">
            <img
              src={logo}
              width="64"
              height="64"
              className="d-inline-block align-middle"
              alt="bileto-logo"
            />
            <strong> Bileto </strong>a simple ticket store on Ethereum
            <div className="navbar-text text-muted">
              <small>
                &nbsp;&nbsp;&nbsp;
                {this.props.drizzle.contracts.Bileto.address}
              </small>
            </div>
          </span>
        </nav>
        <div className="container">
          <div className="row mt-3">
            <div className="col-8">
              <AccountInfo
                drizzle={this.props.drizzle}
                drizzleState={this.state.drizzleState}
              />
            </div>
            <div className="col-4">
              <OpenStore
                drizzle={this.props.drizzle}
                drizzleState={this.state.drizzleState}
              />
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-8">
              <StoreInfo
                drizzle={this.props.drizzle}
                drizzleState={this.state.drizzleState}
              />
            </div>
            <div className="col-4">
              <div className="row">
                <div className="col">
                  <SuspendStore
                    drizzle={this.props.drizzle}
                    drizzleState={this.state.drizzleState}
                  />
                </div>
              </div>
              <div className="row mt-3">
                <div className="col">
                  <CloseStore
                    drizzle={this.props.drizzle}
                    drizzleState={this.state.drizzleState}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-4">
              <div className="row">
                <div className="col">
                  <StartTicketSales
                    drizzle={this.props.drizzle}
                    drizzleState={this.state.drizzleState}
                    eventId={this.state.eventId}
                  />
                </div>
              </div>
              <div className="row mt-5">
                <div className="col">
                  <SuspendTicketSales
                    drizzle={this.props.drizzle}
                    drizzleState={this.state.drizzleState}
                    eventId={this.state.eventId}
                  />
                </div>
              </div>
              <div className="row mt-5">
                <div className="col">
                  <EndTicketSales
                    drizzle={this.props.drizzle}
                    drizzleState={this.state.drizzleState}
                    eventId={this.state.eventId}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <CreateEvent
                drizzle={this.props.drizzle}
                drizzleState={this.state.drizzleState}
              />
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-4">
              <CompleteEvent
                drizzle={this.props.drizzle}
                drizzleState={this.state.drizzleState}
                eventId={this.state.eventId}
              />
            </div>
            <div className="col-md-4">
              <SettleEvent
                drizzle={this.props.drizzle}
                drizzleState={this.state.drizzleState}
                eventId={this.state.eventId}
              />
            </div>
            <div className="col-md-4">
              <CancelEvent
                drizzle={this.props.drizzle}
                drizzleState={this.state.drizzleState}
                eventId={this.state.eventId}
              />
            </div>
          </div>
          <div className="row mt-3">
            <div className="col">
              <EventInfo
                drizzle={this.props.drizzle}
                drizzleState={this.state.drizzleState}
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
            <div className="col">
              <PurchaseInfo
                drizzle={this.props.drizzle}
                drizzleState={this.state.drizzleState}
                purchaseId={this.state.purchaseId}
              />
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-8">
              <PurchaseTickets
                drizzle={this.props.drizzle}
                drizzleState={this.state.drizzleState}
                eventId={this.state.eventId}
              />
            </div>
            <div className="col-md-4">
              <div className="row">
                <div className="col">
                  <CancelPurchase
                    drizzle={this.props.drizzle}
                    drizzleState={this.state.drizzleState}
                    purchaseId={this.state.purchaseId}
                  />
                </div>
              </div>
              <div className="row mt-3">
                <div className="col">
                  <RefundPurchase
                    drizzle={this.props.drizzle}
                    drizzleState={this.state.drizzleState}
                    eventId={this.state.eventId}
                    purchaseId={this.state.purchaseId}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col">
              <CheckIn
                drizzle={this.props.drizzle}
                drizzleState={this.state.drizzleState}
                purchaseId={this.state.purchaseId}
              />
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default App;
