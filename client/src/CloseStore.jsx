import React, { Component } from "react";

class CloseStore extends Component {
  state = { txStackId: null };

  handleOnClick = event => {
    const { closeStore } = this.props.drizzle.contracts.Bileto.methods;
    const txStackId = closeStore.cacheSend();
    this.setState({ txStackId });
  };

  render() {
    return (
      <div className="card shadow text-white bg-danger text-center">
        <div className="card-header">
          <button
            type="button"
            className="btn btn-outline-light btn-block"
            onClick={this.handleOnClick}
          >
            <strong>CLOSE</strong> store
          </button>
        </div>
        <span className="card-body small">
          Permanently close the store, allowing only customer refunds. Settled
          and excess balances are transferred to owner.
        </span>
        <span className="card-footer font-weight-bold text-uppercase">
          {this.props.getTxStatus(this.state.txStackId)}
        </span>
      </div>
    );
  }
}

export default CloseStore;
