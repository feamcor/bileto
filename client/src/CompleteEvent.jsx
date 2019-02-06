import React, { Component } from "react";

class CompleteEvent extends Component {
  state = { txStackId: null };

  handleOnClick = event => {
    const { completeEvent } = this.props.drizzle.contracts.Bileto.methods;
    const txStackId = completeEvent.cacheSend(this.props.eventId);
    this.setState({ txStackId });
  };

  render() {
    return (
      <div className="card shadow bg-success text-white text-center">
        <div className="card-body">
          <button
            type="button"
            className="btn btn-outline-light btn-block"
            onClick={this.handleOnClick}
          >
            <strong>COMPLETE</strong> event #{this.props.eventId}
          </button>
        </div>
        <span className="card-footer font-weight-bold text-uppercase">
          {this.props.getTxStatus(this.state.txStackId)}
        </span>
      </div>
    );
  }
}

export default CompleteEvent;
