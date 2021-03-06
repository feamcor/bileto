import React, { Component } from "react";

class StoreInfo extends Component {
  state = { dataKey: null };
  storeStateLabels = ["0-CREATED", "1-OPEN", "2-SUSPENDED", "3-CLOSED"];

  componentDidMount() {
    const { Bileto } = this.props.drizzle.contracts;
    const dataKey = Bileto.methods.fetchStoreInfo.cacheCall();
    this.setState({ dataKey });
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
      <div className="card shadow">
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
              {this.props.fromWeiToEther(storeSettledBalance)}
            </li>
            <li className="list-group-item">
              <strong>Excess balance: </strong>
              {this.props.fromWeiToEther(storeExcessBalance)}
            </li>
            <li className="list-group-item">
              <strong>Refundable balance: </strong>
              {this.props.fromWeiToEther(storeRefundableBalance)}
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
