import React, { Component } from "react";

class CheckIn extends Component {
  state = { txStackId: null };

  handleOnClick = event => {
    const { checkIn } = this.props.drizzle.contracts.Bileto.methods;
    const txStackId = checkIn.cacheSend(this.props.purchaseId);
    this.setState({ txStackId });
  };

  render() {
    return (
      <div className="card shadow text-white bg-dark text-center">
        <div className="card-body">
          <button
            type="button"
            className="btn btn-outline-light btn-block"
            onClick={this.handleOnClick}
          >
            <strong>CHECK-IN</strong> purchase #{this.props.purchaseId}
          </button>
        </div>
        <span className="card-footer font-weight-bold text-uppercase">
          {this.props.getTxStatus(this.state.txStackId)}
        </span>
      </div>
    );
  }
}

export default CheckIn;
