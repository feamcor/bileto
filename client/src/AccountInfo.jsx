import React, { Component } from "react";

class AccountInfo extends Component {
  state = { dataKey1: null, dataKey2: null, dataKey3: null };

  formatWeiToEther(_amount) {
    let _output = !_amount
      ? "???"
      : this.props.drizzle.web3.utils.fromWei(_amount.toString(), "ether");
    _output += " ETHER";
    return _output;
  }

  fetchData() {
    const { Bileto } = this.props.drizzle.contracts;
    const { accounts } = this.props.drizzleState;
    const dataKey1 = Bileto.methods.getAccountRole.cacheCall(accounts[0]);
    const dataKey2 = Bileto.methods.getCountOrganizerEvents.cacheCall(
      accounts[0]
    );
    const dataKey3 = Bileto.methods.getCountCustomerPurchases.cacheCall(
      accounts[0]
    );
    this.setState({ dataKey1, dataKey2, dataKey3 });
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.drizzleState.accounts[0] !== prevProps.drizzleState.accounts[0]
    ) {
      this.fetchData();
    }
  }

  render() {
    const { drizzleStatus, web3 } = this.props.drizzleState;
    if (!drizzleStatus.initialized || web3.status !== "initialized") {
      return "Loading...";
    }

    const { accounts, accountBalances } = this.props.drizzleState;
    const { Bileto } = this.props.drizzleState.contracts;

    const accountRole = Bileto.getAccountRole[this.state.dataKey1];
    if (!accountRole || !accountRole.value) {
      return "Loading...";
    }

    const countOrganizerEvents =
      Bileto.getCountOrganizerEvents[this.state.dataKey2];
    if (!countOrganizerEvents || !countOrganizerEvents.value) {
      return "Loading...";
    }

    const countCustomerPurchases =
      Bileto.getCountCustomerPurchases[this.state.dataKey3];
    if (!countCustomerPurchases || !countCustomerPurchases.value) {
      return "Loading...";
    }

    const {
      accountIsOwner,
      accountIsOrganizer,
      accountIsCustomer
    } = accountRole.value;

    const countEvents = countOrganizerEvents.value;

    const countPurchases = countCustomerPurchases.value;

    return (
      <div className="card shadow text-white bg-primary h-100">
        <h5 className="card-header">
          <strong>ACCOUNT</strong> information
        </h5>
        <div className="card-body">
          <p className="card-text">
            <strong>Address: </strong>
            {accounts[0]}
          </p>
          <p className="card-text">
            <strong>Balance: </strong>
            {this.formatWeiToEther(accountBalances[accounts[0]])}
          </p>
          <p className="card-text">
            <strong>Roles: </strong>
            <span className="card-text">
              {accountIsOwner === true && " OWNER "}
              {accountIsOwner === true && accountIsOrganizer === true && "/"}
              {accountIsOrganizer === true &&
                " ORGANIZER (" + countEvents + " events)"}
              {(accountIsOwner === true || accountIsOrganizer === true) &&
                accountIsCustomer === true &&
                "/"}
              {accountIsCustomer === true &&
                " CUSTOMER (" + countPurchases + " purchases)"}
              {accountIsOwner === false &&
                accountIsOrganizer === false &&
                accountIsCustomer === false &&
                " NONE "}
            </span>
          </p>
        </div>
      </div>
    );
  }
}

export default AccountInfo;
