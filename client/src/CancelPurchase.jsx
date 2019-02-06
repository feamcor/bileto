import React, { Component } from "react";

class CancelPurchase extends Component {
  state = { txStackId: null, _externalId: "", _customerId: "" };

  handleOnClick = event => {
    const { cancelPurchase } = this.props.drizzle.contracts.Bileto.methods;
    const txStackId = cancelPurchase.cacheSend(
      this.props.purchaseId,
      this.state._externalId,
      this.state._customerId
    );
    this.setState({ txStackId });
  };

  handleOnChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
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
          {this.props.getTxStatus(this.state.txStackId)}
        </span>
      </div>
    );
  }
}

export default CancelPurchase;
