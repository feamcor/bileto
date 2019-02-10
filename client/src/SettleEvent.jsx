import React, { Component } from "react";

class SettleEvent extends Component {
    state = { txStackId: null };

    handleOnClick = (event) => {
        const txStackId = this.props.settleEvent.cacheSend(this.props.eventId);
        this.setState({ txStackId });
    };

    render() {
        return (
            <div className="card shadow bg-warning text-white text-center">
                <div className="card-body">
                    <button
                        type="button"
                        className="btn btn-outline-light btn-block"
                        onClick={this.handleOnClick}
                    >
                        <strong>SETTLE</strong> event #{this.props.eventId}
                    </button>
                </div>
                <span className="card-footer font-weight-bold text-uppercase">
                    {this.props.getTxStatus(this.state.txStackId)}
                </span>
            </div>
        );
    }
}

export default SettleEvent;
