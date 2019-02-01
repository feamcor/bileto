const truffleAssert = require("truffle-assertions");
const Bileto = artifacts.require("Bileto");

contract("Bileto", async accounts => {
  let __contract;
  let __contractAddress;
  let __storeBalance;
  let __storeStatus;
  let __storeName;
  let __storeSettledBalance;
  let __storeExcessBalance;
  let __storeRefundableBalance;
  let __storeLastEvent;
  let __storeLastPurchase;
  let __timestamp = new Date().getTime();
  const __owner = accounts[0];
  const __organizer1 = accounts[1];
  const __customer1 = accounts[2];
  const __organizer2 = accounts[3];
  const __customer2 = accounts[4];

  before(async () => {
    __contract = await Bileto.deployed();
    __contractAddress = __contract.address;
    // let _counter = 0;
    // for (let _account of accounts) {
    //   const _balance = await web3.eth.getBalance(_account);
    //   const _balanceETH = web3.utils.fromWei(_balance, "ether");
    //   console.log(`account[${_counter}]:\t${_account} = ${_balanceETH}`);
    //   _counter += 1;
    //   if (_counter == 3) break;
    // }
    // console.log(`store address:\t${__contractAddress}`);
    // console.log(`store owner:\t${__owner}`);
  });

  beforeEach(async () => {
    const storeInfo = await __contract.fetchStoreInfo.call();
    __storeStatus = storeInfo.storeStatus.toString();
    __storeBalance = await web3.eth.getBalance(__contractAddress);
    __storeName = storeInfo.storeName;
    __storeSettledBalance = storeInfo.storeSettledBalance.toString();
    __storeExcessBalance = storeInfo.storeExcessBalance.toString();
    __storeRefundableBalance = storeInfo.storeRefundableBalance.toString();
    __storeLastEvent = storeInfo.storeCounterEvents.toString();
    __storeLastPurchase = storeInfo.storeCounterPurchases.toString();
  });

  it("owner should create store", async () => {
    assert.strictEqual(
      __storeStatus,
      "0",
      "store status is not StoreStatus.Created (0)"
    );
    assert.strictEqual(__storeBalance, "0", "store balance is not zero");
    assert.strictEqual(
      __storeRefundableBalance,
      "0",
      "store refundable balance is not zero"
    );
  });

  it("non-owner should not open store", async () => {
    await truffleAssert.reverts(
      __contract.openStore({
        from: __organizer1
      })
    );
  });

  it("owner should open store", async () => {
    const _result = await __contract.openStore();
    const _info = await __contract.fetchStoreInfo.call();
    __storeStatus = _info.storeStatus.toString();
    assert.strictEqual(
      __storeStatus,
      "1",
      "store status is not StoreStatus.Open (1)"
    );
    truffleAssert.eventEmitted(_result, "StoreOpen");
  });

  it("non-owner should not suspend opened store", async () => {
    await truffleAssert.reverts(
      __contract.suspendStore({
        from: __organizer1
      })
    );
  });

  it("owner should suspend opened store", async () => {
    const _result = await __contract.suspendStore();
    const _info = await __contract.fetchStoreInfo.call();
    __storeStatus = _info.storeStatus.toString();
    assert.strictEqual(
      __storeStatus,
      "2",
      "store status is not StoreStatus.Open (2)"
    );
    truffleAssert.eventEmitted(_result, "StoreSuspended");
  });

  it("owner should re-open suspended store", async () => {
    const _result = await __contract.openStore();
    const _info = await __contract.fetchStoreInfo.call();
    __storeStatus = _info.storeStatus.toString();
    assert.strictEqual(
      __storeStatus,
      "1",
      "store status is not StoreStatus.Open (1)"
    );
    truffleAssert.eventEmitted(_result, "StoreOpen");
  });

  it("non-owner should not create an event", async () => {
    await truffleAssert.reverts(
      __contract.createEvent(
        "BILETO-EVENT-1",
        __organizer1,
        "BILETO EVENT 1",
        1000,
        web3.utils.toWei("0.1", "ether"),
        10,
        {
          from: __organizer1
        }
      )
    );
  });

  it("owner should not create an event when organizer is a contract", async () => {
    await truffleAssert.reverts(
      __contract.createEvent(
        "BILETO-EVENT-1",
        __contractAddress,
        "BILETO EVENT 1",
        1000,
        web3.utils.toWei("0.1", "ether"),
        10
      ),
      "E012"
    );
  });

  it("owner should not create an event without external ID", async () => {
    await truffleAssert.reverts(
      __contract.createEvent(
        "",
        __organizer1,
        "BILETO EVENT 1",
        1000,
        web3.utils.toWei("0.1", "ether"),
        10
      ),
      "E013"
    );
  });

  it("owner should not create an event without name", async () => {
    await truffleAssert.reverts(
      __contract.createEvent(
        "BILETO-EVENT-1",
        __organizer1,
        "",
        1000,
        web3.utils.toWei("0.1", "ether"),
        10
      ),
      "E014"
    );
  });

  it("owner should not create an event with incentive greater than 100%", async () => {
    await truffleAssert.reverts(
      __contract.createEvent(
        "BILETO-EVENT-1",
        __organizer1,
        "BILETO EVENT 1",
        10001,
        web3.utils.toWei("0.1", "ether"),
        10
      ),
      "E015"
    );
  });

  it("owner should not create an event with no tickets available for sale", async () => {
    await truffleAssert.reverts(
      __contract.createEvent(
        "BILETO-EVENT-1",
        __organizer1,
        "BILETO EVENT 1",
        1000,
        web3.utils.toWei("0.1", "ether"),
        0
      ),
      "E016"
    );
  });

  it("owner should create an event", async () => {
    const _result = await __contract.createEvent(
      "BILETO-EVENT-1",
      __organizer1,
      "BILETO EVENT 1",
      1000,
      web3.utils.toWei("0.1", "ether"),
      10
    );
    let _info = await __contract.fetchStoreInfo.call();
    const _eventId = _info.storeCounterEvents;
    _info = await __contract.fetchEventInfo.call(_eventId);
    assert.strictEqual(
      _info.eventStatus.toString(),
      "0",
      "event status is not EventStatus.Created (0)"
    );
    truffleAssert.eventEmitted(_result, "EventCreated");
  });

  it("contract should store event basic info accordingly", async () => {
    const _info = await __contract.fetchEventInfo.call(__storeLastEvent);
    const _hash = web3.utils.keccak256("BILETO-EVENT-1");
    assert.strictEqual(
      _info.eventStatus.toString(),
      "0",
      "event status is not EventStatus.Created (0)"
    );
    assert.strictEqual(
      _info.eventExternalId,
      _hash,
      "event external ID hash is incorrect"
    );
    assert.strictEqual(
      _info.eventOrganizer,
      __organizer1,
      "event organizer address is incorrect"
    );
    assert.strictEqual(
      _info.eventName,
      "BILETO EVENT 1",
      "event name is incorrect"
    );
    assert.strictEqual(
      _info.eventStoreIncentive.toNumber(),
      1000,
      "event store incentive is incorrect"
    );
    assert.strictEqual(
      _info.eventTicketPrice.toString(),
      web3.utils.toWei("0.1", "ether"),
      "event ticket price is incorrect"
    );
    assert.strictEqual(
      _info.eventTicketsOnSale.toNumber(),
      10,
      "event tickets on sale is incorrect"
    );
  });

  it("contract should init event sales info accordingly", async () => {
    const _basic = await __contract.fetchEventInfo.call(__storeLastEvent);
    const _info = await __contract.fetchEventSalesInfo.call(__storeLastEvent);
    assert.strictEqual(
      _info.eventTicketsSold.toNumber(),
      0,
      "event tickets sold should be zero"
    );
    assert.strictEqual(
      _info.eventTicketsLeft.toNumber(),
      _basic.eventTicketsOnSale.toNumber(),
      "event tickets left should be equal to tickets on sale"
    );
    assert.strictEqual(
      _info.eventTicketsCancelled.toNumber(),
      0,
      "event tickets cancelled should be zero"
    );
    assert.strictEqual(
      _info.eventTicketsRefunded.toNumber(),
      0,
      "event tickets refunded should be zero"
    );
    assert.strictEqual(
      _info.eventTicketsCheckedIn.toNumber(),
      0,
      "event tickets checked-in should be zero"
    );
    assert.strictEqual(
      _info.eventBalance.toNumber(),
      0,
      "event balance should be zero"
    );
    assert.strictEqual(
      _info.eventRefundableBalance.toNumber(),
      0,
      "event refundable balance should be zero"
    );
  });

  it("customer should not complete purchase when sales not started yet", async () => {
    await truffleAssert.reverts(
      __contract.purchaseTickets(
        __storeLastEvent,
        1,
        "BILETO-EVENT-1-PURCHASE-1",
        new Date().getTime(),
        "BILETO-CUSTOMER-1",
        {
          from: __customer1,
          value: web3.utils.toWei("0.1", "ether")
        }
      ),
      "E023"
    );
  });

  it("organizer should start ticket sales of event", async () => {
    const _result = await __contract.startTicketSales(__storeLastEvent, {
      from: __organizer1
    });
    const _info = await __contract.fetchEventInfo.call(__storeLastEvent);
    assert.strictEqual(
      _info.eventStatus.toString(),
      "1",
      "event status is not EventStatus.SalesStarted (1)"
    );
    truffleAssert.eventEmitted(_result, "EventSalesStarted");
  });

  it("customer should not complete purchase when quantity is zero", async () => {
    await truffleAssert.reverts(
      __contract.purchaseTickets(
        __storeLastEvent,
        0,
        "BILETO-EVENT-1-PURCHASE-1",
        new Date().getTime(),
        "BILETO-CUSTOMER-1",
        {
          from: __customer1,
          value: web3.utils.toWei("0.1", "ether")
        }
      ),
      "E025"
    );
  });

  it("customer should not complete purchase when there are not enough tickets", async () => {
    await truffleAssert.reverts(
      __contract.purchaseTickets(
        __storeLastEvent,
        100,
        "BILETO-EVENT-1-PURCHASE-1",
        new Date().getTime(),
        "BILETO-CUSTOMER-1",
        {
          from: __customer1,
          value: web3.utils.toWei("0.1", "ether")
        }
      ),
      "E026"
    );
  });

  it("customer should not complete purchase without external ID", async () => {
    await truffleAssert.reverts(
      __contract.purchaseTickets(
        __storeLastEvent,
        1,
        "",
        new Date().getTime(),
        "BILETO-CUSTOMER-1",
        {
          from: __customer1,
          value: web3.utils.toWei("0.1", "ether")
        }
      ),
      "E027"
    );
  });

  it("customer should not complete purchase without timestamp", async () => {
    await truffleAssert.reverts(
      __contract.purchaseTickets(
        __storeLastEvent,
        1,
        "BILETO-EVENT-1-PURCHASE-1",
        0,
        "BILETO-CUSTOMER-1",
        {
          from: __customer1,
          value: web3.utils.toWei("0.1", "ether")
        }
      ),
      "E028"
    );
  });

  it("customer should not complete purchase without customer ID", async () => {
    await truffleAssert.reverts(
      __contract.purchaseTickets(
        __storeLastEvent,
        1,
        "BILETO-EVENT-1-PURCHASE-1",
        new Date().getTime(),
        "",
        {
          from: __customer1,
          value: web3.utils.toWei("0.1", "ether")
        }
      ),
      "E029"
    );
  });

  it("customer should not complete purchase when value less than total", async () => {
    await truffleAssert.reverts(
      __contract.purchaseTickets(
        __storeLastEvent,
        1,
        "BILETO-EVENT-1-PURCHASE-1",
        new Date().getTime(),
        "BILETO-CUSTOMER-1",
        {
          from: __customer1,
          value: web3.utils.toWei("0.01", "ether")
        }
      ),
      "E030"
    );
  });

  it("customer should not complete purchase when value more than total", async () => {
    await truffleAssert.reverts(
      __contract.purchaseTickets(
        __storeLastEvent,
        1,
        "BILETO-EVENT-1-PURCHASE-1",
        new Date().getTime(),
        "BILETO-CUSTOMER-1",
        {
          from: __customer1,
          value: web3.utils.toWei("0.11", "ether")
        }
      ),
      "E030"
    );
  });

  it("customer should complete 1st purchase", async () => {
    const _result = await __contract.purchaseTickets(
      __storeLastEvent,
      1,
      "BILETO-EVENT-1-PURCHASE-1",
      __timestamp,
      "BILETO-CUSTOMER-1",
      {
        from: __customer1,
        value: web3.utils.toWei("0.1", "ether")
      }
    );
    let _info = await __contract.fetchStoreInfo.call();
    const _purchaseId = _info.storeCounterPurchases;
    _info = await __contract.fetchPurchaseInfo.call(_purchaseId);
    assert.strictEqual(
      _info.purchaseStatus.toString(),
      "0",
      "purchase status is not PurchaseStatus.Completed (0)"
    );
    truffleAssert.eventEmitted(_result, "PurchaseCompleted");
  });

  it("contract should store purchase info accordingly", async () => {
    const _info = await __contract.fetchPurchaseInfo.call(__storeLastPurchase);
    const _hash1 = web3.utils.keccak256("BILETO-EVENT-1-PURCHASE-1");
    const _hash2 = web3.utils.keccak256("BILETO-CUSTOMER-1");
    assert.strictEqual(
      _info.purchaseStatus.toString(),
      "0",
      "purchase status is not PurchaseStatus.Completed (0)"
    );
    assert.strictEqual(
      _info.purchaseExternalId,
      _hash1,
      "purchase external ID hash is incorrect"
    );
    assert.strictEqual(
      _info.purchaseTimestamp.toString(),
      __timestamp.toString(),
      "purchase timestamp is incorrect"
    );
    assert.strictEqual(
      _info.purchaseCustomer,
      __customer1,
      "customer address is incorrect"
    );
    assert.strictEqual(
      _info.purchaseCustomerId,
      _hash2,
      "customer external ID hash is incorrect"
    );
    assert.strictEqual(
      _info.purchaseQuantity.toString(),
      "1",
      "quantity of tickets purchased is incorrect"
    );
    assert.strictEqual(
      _info.purchaseTotal.toString(),
      web3.utils.toWei("0.1", "ether"),
      "event ticket price is incorrect"
    );
    assert.strictEqual(
      _info.purchaseEventId.toString(),
      __storeLastEvent.toString(),
      "event ID is incorrect"
    );
  });

  it("customer should cancel a purchase", async () => {
    const _result = await __contract.cancelPurchase(
      __storeLastPurchase,
      "BILETO-EVENT-1-PURCHASE-1",
      "BILETO-CUSTOMER-1",
      {
        from: __customer1
      }
    );
    const _info = await __contract.fetchPurchaseInfo.call(__storeLastPurchase);
    assert.strictEqual(
      _info.purchaseStatus.toNumber(),
      1,
      "purchase status is not PurchaseStatus.Cancelled (1)"
    );
    truffleAssert.eventEmitted(_result, "PurchaseCancelled");
  });

  it("organizer should suspend ticket sales of an event", async () => {
    const _result = await __contract.suspendTicketSales(__storeLastEvent, {
      from: __organizer1
    });
    const _info = await __contract.fetchEventInfo.call(__storeLastEvent);
    assert.strictEqual(
      _info.eventStatus.toString(),
      "2",
      "event status is not EventStatus.SalesSuspended (2)"
    );
    truffleAssert.eventEmitted(_result, "EventSalesSuspended");
  });

  it("organizer should refund a cancelled purchase", async () => {
    const _result = await __contract.refundPurchase(
      __storeLastEvent,
      __storeLastPurchase,
      {
        from: __organizer1
      }
    );
    const _info = await __contract.fetchPurchaseInfo.call(__storeLastPurchase);
    assert.strictEqual(
      _info.purchaseStatus.toString(),
      "2",
      "purchase status is not PurchaseStatus.Refunded (2)"
    );
    truffleAssert.eventEmitted(_result, "PurchaseRefunded");
  });

  it("organizer should resume ticket sales of a suspended event", async () => {
    const _result = await __contract.startTicketSales(__storeLastEvent, {
      from: __organizer1
    });
    const _info = await __contract.fetchEventInfo.call(__storeLastEvent);
    assert.strictEqual(
      _info.eventStatus.toString(),
      "1",
      "event status is not EventStatus.SalesStarted (1)"
    );
    truffleAssert.eventEmitted(_result, "EventSalesStarted");
  });

  it("customer should complete 2nd purchase", async () => {
    const _result = await __contract.purchaseTickets(
      __storeLastEvent,
      3,
      "BILETO-EVENT-1-PURCHASE-2",
      __timestamp,
      "BILETO-CUSTOMER-1",
      {
        from: __customer1,
        value: web3.utils.toWei("0.3", "ether")
      }
    );
    let _info = await __contract.fetchStoreInfo.call();
    const _purchaseId = _info.storeCounterPurchases;
    _info = await __contract.fetchPurchaseInfo.call(_purchaseId);
    assert.strictEqual(
      _info.purchaseStatus.toString(),
      "0",
      "purchase status is not PurchaseStatus.Completed (0)"
    );
    truffleAssert.eventEmitted(_result, "PurchaseCompleted");
  });

  it("customer should complete 3rd purchase", async () => {
    const _result = await __contract.purchaseTickets(
      __storeLastEvent,
      2,
      "BILETO-EVENT-1-PURCHASE-3",
      __timestamp,
      "BILETO-CUSTOMER-1",
      {
        from: __customer1,
        value: web3.utils.toWei("0.2", "ether")
      }
    );
    let _info = await __contract.fetchStoreInfo.call();
    const _purchaseId = _info.storeCounterPurchases;
    _info = await __contract.fetchPurchaseInfo.call(_purchaseId);
    assert.strictEqual(
      _info.purchaseStatus.toString(),
      "0",
      "purchase status is not PurchaseStatus.Completed (0)"
    );
    truffleAssert.eventEmitted(_result, "PurchaseCompleted");
  });

  it("organizer should end ticket sales of an event", async () => {
    const _result = await __contract.endTicketSales(__storeLastEvent, {
      from: __organizer1
    });
    const _info = await __contract.fetchEventInfo.call(__storeLastEvent);
    assert.strictEqual(
      _info.eventStatus.toString(),
      "3",
      "event status is not EventStatus.SalesFinished (3)"
    );
    truffleAssert.eventEmitted(_result, "EventSalesFinished");
  });

  it("contract should not check-in invalid customer", async () => {
    await truffleAssert.reverts(
      __contract.checkIn(__storeLastPurchase, {
        from: __organizer1
      }),
      "E037"
    );
  });

  it("contract should not check-in invalid purchase", async () => {
    await truffleAssert.reverts(
      __contract.checkIn(100, {
        from: __customer1
      }),
      "E003"
    );
  });

  it("contract should check-in customer", async () => {
    const _result = await __contract.checkIn(__storeLastPurchase, {
      from: __customer1
    });
    const _info = await __contract.fetchPurchaseInfo.call(__storeLastPurchase);
    assert.strictEqual(
      _info.purchaseStatus.toString(),
      "3",
      "purchase status is not PurchaseStatus.CheckedIn (3)"
    );
    truffleAssert.eventEmitted(_result, "CustomerCheckedIn");
  });

  it("organizer should complete an event", async () => {
    const _result = await __contract.completeEvent(__storeLastEvent, {
      from: __organizer1
    });
    const _info = await __contract.fetchEventInfo.call(__storeLastEvent);
    assert.strictEqual(
      _info.eventStatus.toString(),
      "4",
      "event status is not EventStatus.Completed (4)"
    );
    truffleAssert.eventEmitted(_result, "EventCompleted");
  });

  it("owner should settle an event", async () => {
    const _result = await __contract.settleEvent(__storeLastEvent);
    const _info = await __contract.fetchEventInfo.call(__storeLastEvent);
    assert.strictEqual(
      _info.eventStatus.toString(),
      "5",
      "event status is not EventStatus.Settled (5)"
    );
    truffleAssert.eventEmitted(_result, "EventSettled");
  });

  it("organizer should not be able to cancel a settled event", async () => {
    await truffleAssert.reverts(
      __contract.cancelEvent(__storeLastEvent, {
        from: __organizer1
      }),
      "E022"
    );
  });

  it("non-owner should not close store", async () => {
    await truffleAssert.reverts(
      __contract.closeStore({
        from: __organizer1
      })
    );
  });

  it("owner should close store", async () => {
    const _result = await __contract.closeStore();
    const _info = await __contract.fetchStoreInfo.call();
    __storeStatus = _info.storeStatus.toString();
    assert.strictEqual(
      __storeStatus,
      "3",
      "store status is not StoreStatus.Open (2)"
    );
    truffleAssert.eventEmitted(_result, "StoreClosed");
  });
});
