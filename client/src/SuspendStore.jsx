import React, { Component } from "react";

class SuspendStore extends Component {
  state = { stackId: null };

  handleOnClick = _event => {
    const { Bileto } = this.props.drizzle.contracts;
    const { accounts } = this.props.drizzleState;
    const stackId = Bileto.methods.suspendStore.cacheSend({
      from: accounts[0]
    });
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
    const { drizzleStatus, web3 } = this.props.drizzleState;
    if (!drizzleStatus.initialized || web3.status !== "initialized") {
      return "Loading...";
    }

    return (
      <div className="card shadow text-white bg-warning text-center h-100">
        <div className="card-header">
          <button
            type="button"
            className="btn btn-outline-light btn-block"
            onClick={this.handleOnClick}
          >
            <strong>SUSPEND</strong> store
          </button>
        </div>
        <span className="card-body small">
          Temporarily suspend the handling of events and ticket purchases by the
          store.
        </span>
        <span className="card-footer font-weight-bold text-uppercase">
          {this.getTxStatus()}
        </span>
      </div>
    );
  }
}

export default SuspendStore;
