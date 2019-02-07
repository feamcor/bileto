import React, { Component } from "react";

class RefundPurchase extends Component {
  state = { txStackId: null };

  handleOnClick = event => {
    const { refundPurchase } = this.props.drizzle.contracts.Bileto.methods;
    const { eventId, purchaseId } = this.props;
    const txStackId = refundPurchase.cacheSend(eventId, purchaseId);
    this.setState({ txStackId });
  };

  render() {
    return (
      <div className="card shadow bg-warning text-white text-center">
        <div className="card-body">
          <button
            type="button"
            className="btn btn-outline-light btn-block"
            onClick={this.handleOnClick}
          >
            <strong>REFUND</strong> purchase #{this.props.purchaseId}
          </button>
        </div>
        <span className="card-footer font-weight-bold text-uppercase">
          {this.props.getTxStatus(this.state.txStackId)}
        </span>
      </div>
    );
  }
}

export default RefundPurchase;
