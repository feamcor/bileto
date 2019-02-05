import React, { Component } from "react";

class CreateEvent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stackId: null,
      _externalId: "",
      _organizer: "",
      _name: "",
      _storeIncentive: "",
      _ticketPrice: "",
      _ticketsOnSale: ""
    };
  }

  handleOnClick = event => {
    const { Bileto } = this.props.drizzle.contracts;
    const incentive = parseInt(this.state._storeIncentive, 10) * 100;
    const stackId = Bileto.methods.createEvent.cacheSend(
      this.state._externalId,
      this.state._organizer,
      this.state._name,
      incentive.toString(),
      this.props.drizzle.web3.utils.toWei(this.state._ticketPrice, "ether"),
      this.state._ticketsOnSale
    );
    this.setState({ stackId });
  };

  handleOnChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  getTxStatus = () => {
    const { transactions, transactionStack } = this.props.drizzleState;
    const txHash = transactionStack[this.state.stackId];
    if (!txHash || !transactions[txHash]) return "...";
    // console.log(transactions[txHash]);
    if (transactions[txHash].status === "success") {
      const eventId =
        transactions[txHash].receipt.events.EventCreated.returnValues._id;
      return `EVENT #${eventId}`;
    } else {
      return transactions[txHash].status;
    }
  };

  render() {
    const { drizzleStatus, web3 } = this.props.drizzleState;
    if (!drizzleStatus.initialized || web3.status !== "initialized") {
      return "Loading...";
    }

    return (
      <div className="card shadow text-white bg-info h-100">
        <h5 className="card-header">CREATE event</h5>
        <div className="card-body">
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <span className="input-group-text" id="labelEventName">
                name
              </span>
            </div>
            <input
              type="text"
              key="_name"
              name="_name"
              value={this.state._name}
              onChange={this.handleOnChange}
              className="form-control"
              placeholder="Event Name"
              aria-label="Event Name"
              aria-describedby="labelEventName"
              required
            />
          </div>
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <span className="input-group-text" id="labelExternalId">
                external id
              </span>
            </div>
            <input
              type="text"
              key="_externalId"
              name="_externalId"
              value={this.state._externalId}
              onChange={this.handleOnChange}
              className="form-control"
              placeholder="Event External ID"
              aria-label="Event External ID"
              aria-describedby="labelExternalId"
              required
            />
          </div>
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <span className="input-group-text" id="labelOrganizer">
                organizer
              </span>
            </div>
            <input
              type="text"
              key="_organizer"
              name="_organizer"
              value={this.state._organizer}
              onChange={this.handleOnChange}
              className="form-control"
              placeholder="Event Organizer Address"
              aria-label="Event Organizer Address"
              aria-describedby="labelOrganizer"
              required
            />
          </div>
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <span className="input-group-text" id="labelTicketsOnSale">
                tickets on sale
              </span>
            </div>
            <input
              type="number"
              key="_ticketsOnSale"
              name="_ticketsOnSale"
              value={this.state._ticketsOnSale}
              onChange={this.handleOnChange}
              min="1"
              className="form-control"
              placeholder="Quantity of Tickets on Sale"
              aria-label="Quantity of Tickets on Sale"
              aria-describedby="labelTicketsOnSale"
              required
            />
          </div>
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <span className="input-group-text" id="labelTicketPrice">
                ticket price (in ether)
              </span>
            </div>
            <input
              type="number"
              key="_ticketPrice"
              name="_ticketPrice"
              value={this.state._ticketPrice}
              onChange={this.handleOnChange}
              min="0"
              max="100"
              step="0.01"
              className="form-control"
              placeholder="Price of One Ticket"
              aria-label="Price of One Ticket"
              aria-describedby="labelTicketPrice"
              required
            />
          </div>
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <span className="input-group-text" id="labelStoreIncentive">
                store incentive (in %)
              </span>
            </div>
            <input
              type="number"
              key="_storeIncentive"
              name="_storeIncentive"
              value={this.state._storeIncentive}
              onChange={this.handleOnChange}
              min="0"
              max="100"
              step="1"
              className="form-control"
              placeholder="Percentage Paid to Store as Incentive"
              aria-label="Percentage Paid to Store as Incentive"
              aria-describedby="labelStoreIncentive"
              required
            />
          </div>
          <button
            type="button"
            className="btn btn-light"
            onClick={this.handleOnClick}
          >
            submit
          </button>
        </div>
        <span className="card-footer font-weight-bold text-uppercase">
          {this.getTxStatus()}
        </span>
      </div>
    );
  }
}

export default CreateEvent;
