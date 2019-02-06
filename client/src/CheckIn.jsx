import React, { Component } from "react";

class CheckIn extends Component {
  state = { stackId: null };

  constructor(props) {
    super(props);
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  handleOnClick = _event => {
    const { Bileto } = this.props.drizzle.contracts;
    const stackId = Bileto.methods.checkIn.cacheSend(this.props.purchaseId);
    this.setState({ stackId });
  };

  getTxStatus = () => {
    const { transactions, transactionStack } = this.props.drizzleState;
    const txHash = transactionStack[this.state.stackId];
    if (!txHash) return "...";
    // console.log(transactions[txHash]);
    return transactions[txHash].status;
  };

  render() {
    return (
      <div className="card shadow text-white bg-dark text-center h-100">
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
          {this.getTxStatus()}
        </span>
      </div>
    );
  }
}

export default CheckIn;
