import React, { Component } from "react";

class SuspendTicketSales extends Component {
  state = { txStackId: null };

  handleOnClick = event => {
    const { suspendTicketSales } = this.props.drizzle.contracts.Bileto.methods;
    const txStackId = suspendTicketSales.cacheSend(this.props.eventId);
    this.setState({ txStackId });
  };

  render() {
    return (
      <div className="card shadow border-dark text-center h-100">
        <div className="card-body">
          <button
            type="button"
            className="btn btn-outline-warning btn-block"
            onClick={this.handleOnClick}
          >
            <strong>SUSPEND</strong> sales #{this.props.eventId}
          </button>
        </div>
        <span className="card-footer font-weight-bold text-uppercase">
          {this.props.getTxStatus(this.state.txStackId)}
        </span>
      </div>
    );
  }
}

export default SuspendTicketSales;
