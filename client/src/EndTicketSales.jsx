import React, { Component } from "react";

class EndTicketSales extends Component {
    state = { txStackId: null };

    handleOnClick = (event) => {
        const txStackId = this.props.endTicketSales.cacheSend(this.props.eventId);
        this.setState({ txStackId });
    };

    render() {
        return (
            <div className="card shadow border-dark text-center">
                <div className="card-body">
                    <button
                        type="button"
                        className="btn btn-outline-danger btn-block"
                        onClick={this.handleOnClick}
                    >
                        <strong>END</strong> sales #{this.props.eventId}
                    </button>
                </div>
                <span className="card-footer font-weight-bold text-uppercase">
                    {this.props.getTxStatus(this.state.txStackId)}
                </span>
            </div>
        );
    }
}

export default EndTicketSales;
