import React, { Component } from "react";

class SuspendStore extends Component {
  state = { txStackId: null };

  handleOnClick = event => {
    const { suspendStore } = this.props.drizzle.contracts.Bileto.methods;
    const txStackId = suspendStore.cacheSend();
    this.setState({ txStackId });
  };

  render() {
    return (
      <div className="card shadow text-white bg-warning text-center">
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
          {this.props.getTxStatus(this.state.txStackId)}
        </span>
      </div>
    );
  }
}

export default SuspendStore;
