import React, { Component } from "react";

class AccountInfo extends Component {
    state = { dataKey1: null, dataKey2: null, dataKey3: null };

    fetchData() {
        const { account, methods } = this.props;
        const dataKey1 = methods.getAccountRole.cacheCall(account);
        const dataKey2 = methods.getCountOrganizerEvents.cacheCall(account);
        const dataKey3 = methods.getCountCustomerPurchases.cacheCall(account);
        this.setState({ dataKey1, dataKey2, dataKey3 });
    }

    componentDidMount() {
        this.fetchData();
    }

    componentDidUpdate(prevProps) {
        if (this.props.account !== prevProps.account) {
            this.fetchData();
        }
    }

    render() {
        const { account, accountBalance, results } = this.props;
        const { dataKey1, dataKey2, dataKey3 } = this.state;
        const accountRole = results.getAccountRole[dataKey1];
        const countOrganizerEvents = results.getCountOrganizerEvents[dataKey2];
        const countCustomerPurchases = results.getCountCustomerPurchases[dataKey3];

        if (
            !accountRole ||
            !accountRole.value ||
            !countOrganizerEvents ||
            !countOrganizerEvents.value ||
            !countCustomerPurchases ||
            !countCustomerPurchases.value
        ) {
            return "Loading...";
        }

        const { accountIsOwner, accountIsOrganizer, accountIsCustomer } = accountRole.value;
        const countEvents = countOrganizerEvents.value;
        const countPurchases = countCustomerPurchases.value;

        return (
            <div className="card shadow text-white bg-primary">
                <h5 className="card-header">
                    <strong>ACCOUNT</strong> information
                </h5>
                <div className="card-body">
                    <p className="card-text">
                        <strong>Address: </strong>
                        {account}
                    </p>
                    <p className="card-text">
                        <strong>Balance: </strong>
                        {accountBalance}
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
