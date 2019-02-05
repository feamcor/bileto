import React, { Component } from "react";

class PurchaseInfo extends Component {
  state = { dataKey: null };
  purchaseStateLabels = [
    "0-COMPLETED",
    "1-CANCELLED",
    "2-REFUNDED",
    "3-CHECKED-IN"
  ];

  fetchData() {
    const { Bileto } = this.props.drizzle.contracts;
    const dataKey = Bileto.methods.fetchPurchaseInfo.cacheCall(
      this.props.purchaseId
    );

    this.setState({ dataKey });
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.purchaseId !== prevProps.purchaseId) {
      this.fetchData();
    }
  }

  formatWeiToEther(_amount) {
    let _output = !_amount
      ? "???"
      : this.props.drizzle.web3.utils.fromWei(_amount.toString(), "ether");
    _output += " ETHER";
    return _output;
  }

  render() {
    const { drizzleStatus, web3 } = this.props.drizzleState;
    if (!drizzleStatus.initialized || web3.status !== "initialized") {
      return "Loading...";
    }

    const { Bileto } = this.props.drizzleState.contracts;

    const purchaseInfo = Bileto.fetchPurchaseInfo[this.state.dataKey];
    if (!purchaseInfo || !purchaseInfo.value) {
      return "Loading...";
    }

    const {
      purchaseStatus,
      purchaseExternalId,
      purchaseTimestamp,
      purchaseCustomer,
      purchaseCustomerId,
      purchaseQuantity,
      purchaseTotal,
      purchaseEventId
    } = purchaseInfo.value;

    const timestamp = new Date(parseInt(purchaseTimestamp, 10));

    return (
      <div className="card shadow h-100">
        <h5 className="card-header">
          Event #{purchaseEventId}
          {" - "}
          <strong>Purchase #{this.props.purchaseId}</strong>
        </h5>
        <div className="card-body">
          <ul className="list-group list-group-flush">
            <li className="list-group-item">
              <strong>Status: </strong>
              {this.purchaseStateLabels[purchaseStatus]}
            </li>
            <li className="list-group-item">
              <strong>Timestamp: </strong>
              {timestamp.toUTCString()}
            </li>
            <li className="list-group-item">
              <strong>Customer: </strong>
              {purchaseCustomer}
            </li>
            <li className="list-group-item">
              <strong>Customer ID: </strong>
              <small>{purchaseCustomerId}</small>
            </li>
            <li className="list-group-item">
              <strong>External ID: </strong>
              <small>{purchaseExternalId}</small>
            </li>
            <li className="list-group-item">
              <strong># of Tickets on Purchase: </strong>
              {purchaseQuantity}
            </li>
            <li className="list-group-item">
              <strong>Purchase Total: </strong>
              {this.formatWeiToEther(purchaseTotal)}
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

export default PurchaseInfo;
