import React, { Component } from "react";

class StartTicketSales extends Component {
  state = { txStackId: null };

  handleOnClick = event => {
    const { startTicketSales } = this.props.drizzle.contracts.Bileto.methods;
    const txStackId = startTicketSales.cacheSend(this.props.eventId);
    this.setState({ txStackId });
  };

  render() {
    return (
      <div className="card shadow border-dark text-center h-100">
        <div className="card-body">
          <button
            type="button"
            className="btn btn-outline-success btn-block"
            onClick={this.handleOnClick}
          >
            <strong>START</strong> sales #{this.props.eventId}
          </button>
        </div>
        <span className="card-footer font-weight-bold text-uppercase">
          {this.props.getTxStatus(this.state.txStackId)}
        </span>
      </div>
    );
  }
}

export default StartTicketSales;
