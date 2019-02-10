import React, { Component } from "react";

class SuspendTicketSales extends Component {
    state = { txStackId: null };

    handleOnClick = (event) => {
        const txStackId = this.props.suspendTicketSales.cacheSend(this.props.eventId);
        this.setState({ txStackId });
    };

    render() {
        return (
            <div className="card shadow border-dark text-center">
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
