import React, { Component } from "react";

class PurchaseTickets extends Component {
  state = {
    stackId: null,
    _quantity: "",
    _externalId: "",
    _customerId: "",
    _ticketPrice: ""
  };

  handleOnClick = _event => {
    const { Bileto } = this.props.drizzle.contracts;
    const quantity = parseInt(this.state._quantity, 10);
    const price = parseFloat(this.state._ticketPrice);
    const total = quantity * price;
    const value = this.props.drizzle.web3.utils.toWei(
      total.toString(),
      "ether"
    );
    const stackId = Bileto.methods.purchaseTickets.cacheSend(
      this.props.eventId,
      this.state._quantity,
      this.state._externalId,
      new Date().getTime().toString(),
      this.state._customerId,
      { value }
    );
    this.setState({ stackId });
  };

  handleOnChange = _event => {
    this.setState({ [_event.target.name]: _event.target.value });
  };

  getTxStatus = () => {
    const { transactions, transactionStack } = this.props.drizzleState;
    const txHash = transactionStack[this.state.stackId];
    if (!txHash || !transactions[txHash]) return "...";
    if (transactions[txHash].status === "success") {
      const purchaseId =
        transactions[txHash].receipt.events.PurchaseCompleted.returnValues._id;
      return `PURCHASE #${purchaseId}`;
    } else {
      return transactions[txHash].status;
    }
  };

  render() {
    return (
      <div className="card shadow text-white bg-info">
        <h5 className="card-header">PURCHASE tickets</h5>
        <div className="card-body">
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
              placeholder="Purchase External ID"
              aria-label="Purchase External ID"
              aria-describedby="labelExternalId"
              required
            />
          </div>
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <span className="input-group-text" id="labelCustomerId">
                customer id
              </span>
            </div>
            <input
              type="text"
              key="_customerId"
              name="_customerId"
              value={this.state._customerId}
              onChange={this.handleOnChange}
              min="1"
              className="form-control"
              placeholder="Customer ID"
              aria-label="Customer Id"
              aria-describedby="labelCustomerId"
              required
            />
          </div>
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <span className="input-group-text" id="labelQuantity">
                quantity
              </span>
            </div>
            <input
              type="number"
              key="_quantity"
              name="_quantity"
              value={this.state._quantity}
              onChange={this.handleOnChange}
              className="form-control"
              placeholder="Quantity"
              aria-label="Quantity"
              aria-describedby="labelQuantity"
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

export default PurchaseTickets;
