import React, { Component } from "react";

class OpenStore extends Component {
  state = { txStackId: null };

  handleOnClick = event => {
    const { openStore } = this.props.drizzle.contracts.Bileto.methods;
    const txStackId = openStore.cacheSend();
    this.setState({ txStackId });
  };

  render() {
    return (
      <div className="card shadow text-white bg-success text-center h-100">
        <div className="card-header">
          <button
            type="button"
            className="btn btn-outline-light btn-block"
            onClick={this.handleOnClick}
          >
            <strong>OPEN</strong> store
          </button>
        </div>
        <span className="card-body small">
          Enable, or resume, the store for handling of events and ticket
          purchases.
        </span>
        <span className="card-footer font-weight-bold text-uppercase">
          {this.props.getTxStatus(this.state.txStackId)}
        </span>
      </div>
    );
  }
}

export default OpenStore;
