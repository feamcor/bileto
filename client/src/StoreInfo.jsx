import React, { Component } from "react";

class StoreInfo extends Component {
  state = { dataKey: null };
  storeStateLabels = ["0-CREATED", "1-OPEN", "2-SUSPENDED", "3-CLOSED"];

  componentDidMount() {
    const { Bileto } = this.props.drizzle.contracts;
    const dataKey = Bileto.methods.fetchStoreInfo.cacheCall();
    this.setState({ dataKey });
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

    const storeInfo = Bileto.fetchStoreInfo[this.state.dataKey];
    if (!storeInfo || !storeInfo.value) {
      return "Loading...";
    }

    const {
      storeStatus,
      storeName,
      storeOwner,
      storeSettledBalance,
      storeExcessBalance,
      storeRefundableBalance,
      storeCounterEvents,
      storeCounterPurchases
    } = storeInfo.value;

    return (
      <div className="card shadow h-100">
        <h5 className="card-header">
          Store: <strong>{storeName}</strong>
        </h5>
        <div className="card-body">
          <ul className="list-group list-group-flush">
            <li className="list-group-item">
              <strong>Status: </strong>
              {this.storeStateLabels[storeStatus]}
            </li>
            <li className="list-group-item">
              <strong>Owner: </strong>
              {storeOwner}
            </li>
            <li className="list-group-item">
              <strong>Settled balance: </strong>
              {this.formatWeiToEther(storeSettledBalance)}
            </li>
            <li className="list-group-item">
              <strong>Excess balance: </strong>
              {this.formatWeiToEther(storeExcessBalance)}
            </li>
            <li className="list-group-item">
              <strong>Refundable balance: </strong>
              {this.formatWeiToEther(storeRefundableBalance)}
            </li>
            <li className="list-group-item">
              <strong># of Events created so far: </strong>
              {storeCounterEvents}
            </li>
            <li className="list-group-item">
              <strong># of Purchases completed so far: </strong>
              {storeCounterPurchases}
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

export default StoreInfo;
