import React, { Component } from "react";

class EventInfo extends Component {
  state = { dataKey1: null, dataKey2: null };
  eventStateLabels = [
    "0-CREATED",
    "1-SALES STARTED",
    "2-SALES SUSPENDED",
    "3-SALES FINISHED",
    "4-COMPLETED",
    "5-SETTLED",
    "6-CANCELLED"
  ];

  fetchData() {
    const { Bileto } = this.props.drizzle.contracts;
    const dataKey1 = Bileto.methods.fetchEventInfo.cacheCall(
      this.props.eventId
    );
    const dataKey2 = Bileto.methods.fetchEventSalesInfo.cacheCall(
      this.props.eventId
    );
    this.setState({ dataKey1, dataKey2 });
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.eventId !== prevProps.eventId) {
      this.fetchData();
    }
  }

  formatWeiToEther(_amount) {
    let _output = !_amount
      ? "???"
      : this.props.drizzle.web3.utils.fromWei(_amount.toString(), "ether");
    _output += " ETHER";
    return _output;
  }

  render() {
    const { drizzleStatus, web3 } = this.props.drizzleState;
    if (!drizzleStatus.initialized || web3.status !== "initialized") {
      return "Loading...";
    }

    const { Bileto } = this.props.drizzleState.contracts;

    const eventInfo = Bileto.fetchEventInfo[this.state.dataKey1];
    if (!eventInfo || !eventInfo.value) {
      return "Loading...";
    }

    const eventSalesInfo = Bileto.fetchEventSalesInfo[this.state.dataKey2];
    if (!eventSalesInfo || !eventSalesInfo.value) {
      return "Loading...";
    }

    const {
      eventStatus,
      eventExternalId,
      eventOrganizer,
      eventName,
      eventStoreIncentive,
      eventTicketPrice,
      eventTicketsOnSale
    } = eventInfo.value;

    const {
      eventTicketsSold,
      eventTicketsLeft,
      eventTicketsCancelled,
      eventTicketsRefunded,
      eventTicketsCheckedIn,
      eventBalance,
      eventRefundableBalance
    } = eventSalesInfo.value;

    return (
      <div className="card shadow h-100">
        <h5 className="card-header">
          Event #{this.props.eventId}: <strong>{eventName}</strong>
        </h5>
        <div className="card-body">
          <ul className="list-group list-group-flush">
            <li className="list-group-item">
              <strong>Status: </strong>
              {this.eventStateLabels[eventStatus]}
            </li>
            <li className="list-group-item">
              <strong>Organizer: </strong>
              {eventOrganizer}
            </li>
            <li className="list-group-item">
              <strong>External ID: </strong>
              <small>{eventExternalId}</small>
            </li>
          </ul>
          <div className="row">
            <div className="col-md-6">
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong># of Tickets on Sale (initial): </strong>
                  {eventTicketsOnSale}
                </li>
                <li className="list-group-item">
                  <strong>Ticket Price: </strong>
                  {this.formatWeiToEther(eventTicketPrice)}
                </li>
                <li className="list-group-item">
                  <strong>Store Incentive (%): </strong>
                  {parseInt(eventStoreIncentive, 10) / 100}
                </li>
                <li className="list-group-item">
                  <strong>Total Balance: </strong>
                  {this.formatWeiToEther(eventBalance)}
                </li>
                <li className="list-group-item">
                  <strong>Refundable Balance: </strong>
                  {this.formatWeiToEther(eventRefundableBalance)}
                </li>
              </ul>
            </div>
            <div className="col-md-6">
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong># of Tickets Sold: </strong>
                  {eventTicketsSold}
                </li>
                <li className="list-group-item">
                  <strong># of Tickets Left: </strong>
                  {eventTicketsLeft}
                </li>
                <li className="list-group-item">
                  <strong># of Tickets Cancelled: </strong>
                  {eventTicketsCancelled}
                </li>
                <li className="list-group-item">
                  <strong># of Tickets Checked In: </strong>
                  {eventTicketsCheckedIn}
                </li>
                <li className="list-group-item">
                  <strong># of Tickets Refunded: </strong>
                  {eventTicketsRefunded}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EventInfo;
