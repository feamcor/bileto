import React, { Component } from "react";

class CancelPurchase extends Component {
  state = { stackId: null, _externalId: "", _customerId: "" };

  constructor(props) {
    super(props);
    this.handleOnChange = this.handleOnChange.bind(this);
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  handleOnClick = _event => {
    const { Bileto } = this.props.drizzle.contracts;
    const stackId = Bileto.methods.cancelPurchase.cacheSend(
      this.props.purchaseId,
      this.state._externalId,
      this.state._customerId
    );
    this.setState({ stackId });
  };

  handleOnChange = _event => {
    this.setState({ [_event.target.name]: _event.target.value });
  };

  getTxStatus = () => {
    const { transactions, transactionStack } = this.props.drizzleState;
    const txHash = transactionStack[this.state.stackId];
    if (!txHash) return "...";
    // console.log(transactions[txHash]);
    return transactions[txHash].status;
  };

  render() {
    const { drizzleStatus, web3 } = this.props.drizzleState;
    if (!drizzleStatus.initialized || web3.status !== "initialized") {
      return "Loading...";
    }

    return (
      <div className="card shadow border-dark text-center h-100">
        <div className="card-header">
          <button
            type="button"
            className="btn btn-danger btn-block"
            onClick={this.handleOnClick}
          >
            <strong>CANCEL</strong> purchase #{this.props.purchaseId}
          </button>
        </div>
        <div className="card-body">
          <input
            type="text"
            key="_externalId"
            name="_externalId"
            value={this.state._externalId}
            onChange={this.handleOnChange}
            className="form-control"
            placeholder="Purchase External ID"
            aria-label="Purchase External ID"
            required
          />
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
            required
          />
        </div>
        <span className="card-footer font-weight-bold text-uppercase">
          {this.getTxStatus()}
        </span>
      </div>
    );
  }
}

export default CancelPurchase;
