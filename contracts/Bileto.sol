pragma solidity 0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/drafts/Counter.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

/// @author Fábio Corrêa <feamcor@gmail.com>
/// @title Bileto: a decentralized ticket store for the Ethereum blockchain.
contract Bileto is Ownable, ReentrancyGuard {
  using SafeMath for uint;
  using Counter for Counter.Counter;
  using Address for address;
  using Address for address payable;

  enum StoreStatus {
    Created, 
    Open, 
    Suspended, 
    Closed
  }

  enum EventStatus {
    Created, 
    SalesStarted, 
    SalesSuspended, 
    SalesFinished, 
    Completed, 
    Settled, 
    Cancelled
  }

  enum PurchaseStatus {
    Completed, 
    Cancelled, 
    Refunded, 
    CheckedIn
  }

  struct Store {
    StoreStatus status;
    uint settledBalance;
    uint excessBalance;
    uint refundableBalance;
    address[] organizers;
    Counter.Counter counterEvents;
    mapping(uint => Event) events;
    mapping(address => uint[]) organizerEvents;
    address[] customers;
    Counter.Counter counterPurchases;
    mapping(uint => Purchase) purchases;
    mapping(address => uint[]) customerPurchases;
  }

  struct Event {
    EventStatus status;
    bytes32 externalId;
    address payable organizer;
    string name;
    uint storeIncentive;
    uint ticketPrice;
    uint ticketsOnSale;
    uint ticketsSold;
    uint ticketsLeft;
    uint ticketsCancelled;
    uint ticketsRefunded;
    uint ticketsCheckedIn;
    uint eventBalance;
    uint refundableBalance;
  }

  struct Purchase {
    PurchaseStatus status;
    bytes32 externalId;
    uint timestamp;
    address payable customer;
    bytes32 customerId;
    uint quantity;
    uint total;
    uint eventId;
  }

  Store private store;

  /// @notice Ticket store was opened.
  /// @param _by store owner address (indexed)
  /// @dev corresponds to `StoreStatus.Open`
  event StoreOpen(address indexed _by);

  /// @notice Ticket store was suspended.
  /// @param _by store owner address (indexed)
  /// @dev corresponds to `StoreStatus.Suspended`
  event StoreSuspended(address indexed _by);

  /// @notice Ticket store was closed.
  /// @param _by store owner address (indexed)
  /// @param _settlement amount settled (transferred) to store owner
  /// @param _excess amount transferred to store owner due to excess funds (fallback)
  /// @dev corresponds to `StoreStatus.Closed`
  event StoreClosed(address indexed _by, uint _settlement, uint _excess);

  /// @notice Ticket event was created.
  /// @param _id event new internal ID (indexed)
  /// @param _externalId hash of the event external ID (indexed)
  /// @param _by store owner address (indexed)
  /// @dev corresponds to `EventStatus.Created`
  event EventCreated(uint indexed _id, bytes32 indexed _externalId, address indexed _by);

  /// @notice Event ticket sales was started.
  /// @param _id event internal ID (indexed)
  /// @param _externalId hash of the event external ID (indexed)
  /// @param _by events organizer address (indexed)
  /// @dev corresponds to `EventStatus.SalesStarted`
  event EventSalesStarted(uint indexed _id, bytes32 indexed _externalId, address indexed _by);

  /// @notice Event ticket sales was suspended.
  /// @param _id event internal ID (indexed)
  /// @param _externalId hash of the event external ID (indexed)
  /// @param _by events organizer address (indexed)
  /// @dev corresponds to `EventStatus.SalesSuspended`
  event EventSalesSuspended(uint indexed _id, bytes32 indexed _externalId, address indexed _by);

  /// @notice Event ticket sales was finished.
  /// @param _id event internal ID (indexed)
  /// @param _externalId hash of the event external ID (indexed)
  /// @param _by events organizer address (indexed)
  /// @dev corresponds to `EventStatus.SalesFinished`
  event EventSalesFinished(uint indexed _id, bytes32 indexed _externalId, address indexed _by);

  /// @notice Ticket event was completed.
  /// @param _id event new internal ID (indexed)
  /// @param _externalId hash of the event external ID (indexed)
  /// @param _by events organizer address (indexed)
  /// @dev corresponds to `EventStatus.Completed`
  event EventCompleted(uint indexed _id, bytes32 indexed _externalId, address indexed _by);

  /// @notice Ticket event was settled.
  /// @param _id event internal ID (indexed)
  /// @param _externalId hash of the event external ID (indexed)
  /// @param _by store owner address (indexed)
  /// @param _settlement amount settled (transferred) to event organizer
  /// @dev corresponds to `EventStatus.Settled`
  event EventSettled(uint indexed _id, bytes32 indexed _externalId, address indexed _by, uint _settlement);

  /// @notice Ticket event was cancelled.
  /// @param _id event internal ID (indexed)
  /// @param _externalId hash of the event external ID (indexed)
  /// @param _by event organizer address (indexed)
  /// @dev corresponds to `EventStatus.Cancelled`
  event EventCancelled(uint indexed _id, bytes32 indexed _externalId, address indexed _by);

  /// @notice Ticket purchase was completed.
  /// @param _id purchase new internal ID (indexed)
  /// @param _externalId hash of the purchase external ID (indexed)
  /// @param _by customer address (indexed)
  /// @param _id event internal ID
  /// @dev corresponds to `PurchaseStatus.Completed`
  event PurchaseCompleted(uint indexed _id, bytes32 indexed _externalId, address indexed _by, uint _eventId);

  /// @notice Ticket purchase was cancelled.
  /// @param _id purchase internal ID (indexed)
  /// @param _externalId hash of the purchase external ID (indexed)
  /// @param _by customer address (indexed)
  /// @param _id event internal ID
  /// @dev corresponds to `PurchaseStatus.Cancelled`
  event PurchaseCancelled(uint indexed _id, bytes32 indexed _externalId, address indexed _by, uint _eventId);

  /// @notice Ticket purchase was refunded.
  /// @param _id purchase internal ID (indexed)
  /// @param _externalId hash of the purchase external ID (indexed)
  /// @param _by customer address (indexed)
  /// @param _id event internal ID
  /// @dev corresponds to `PurchaseStatus.Refunded`
  event PurchaseRefunded(uint indexed _id, bytes32 indexed _externalId, address indexed _by, uint _eventId);

  /// @notice Customer checked in the event.
  /// @param _eventId event internal ID (indexed)
  /// @param _purchaseId purchase internal ID (indexed)
  /// @param _by customer address (indexed)
  /// @dev corresponds to `PurchaseStatus.CheckedIn`
  event CustomerCheckedIn(uint indexed _eventId, uint indexed _purchaseId, address indexed _by);

  /// @dev Verify that ticket store is open, otherwise revert.
  modifier storeOpen() {
    require(store.status == StoreStatus.Open, "E001");
    _;
  }

  /// @dev Verify that event ID is within current range.
  modifier validEventId(uint _eventId) {
    require(_eventId <= store.counterEvents.current, "E002");
    _;
  }

  /// @dev Verify that purchase ID is within current range.
  modifier validPurchaseId(uint _purchaseId) {
    require(_purchaseId <= store.counterPurchases.current, "E003");
    _;
  }

  /// @dev Verify that transaction on an event was triggered by its organizer, otherwise revert.
  modifier onlyOrganizer(uint _eventId) {
    require(msg.sender == store.events[_eventId].organizer, "E004");
    _;
  }

  /// @dev Verify that transaction on an event was triggered by its organizer or store owner.
  modifier onlyOwnerOrOrganizer(uint _eventId) {
    require(isOwner() || msg.sender == store.events[_eventId].organizer, "E005");
    _;
  }

  /// @dev Verify that a purchase was completed, otherwise revert.
  modifier purchaseCompleted(uint _purchaseId) {
    require(store.purchases[_purchaseId].status == PurchaseStatus.Completed, "E006");
    _;
  }

  /// @notice Initialize the ticket store and its respective owner.
  /// @dev store owner is set by the account who created the store
  constructor() public {
    store.status = StoreStatus.Created;
  }

  /// @notice Fallback function.
  /// @notice Funds will be locked until store is closed, when owner will be able to withdraw them.
  function() external payable {
    require(msg.data.length == 0, "E008");
    store.excessBalance = store.excessBalance.add(msg.value);
  }

  /// @notice Open ticket store.
  /// @dev emit `StoreOpen` event
  function openStore() 
    external 
    nonReentrant 
    onlyOwner 
  {
    require(
      store.status == StoreStatus.Created || 
      store.status == StoreStatus.Suspended, 
      "E009"
    );
    store.status = StoreStatus.Open;
    emit StoreOpen(msg.sender);
  }

  /// @notice Suspend ticket store.
  /// @notice Should be used with extreme caution and on exceptional cases only.
  /// @dev emit `StoreSuspended` event
  function suspendStore() 
    external 
    nonReentrant 
    onlyOwner 
    storeOpen 
  {
    store.status = StoreStatus.Suspended;
    emit StoreSuspended(msg.sender);
  }

  /// @notice Close ticket store.
  /// @notice This is ticket store final state and become inoperable after.
  /// @notice Ticket store won't close while there are refundable balance left.
  /// @notice Only settled and excess balance will be transferred to store owner.
  /// @dev emit `StoreClosed` event
  function closeStore() 
    external 
    nonReentrant 
    onlyOwner 
  {
    require(store.status != StoreStatus.Closed, "E010");
    // require(store.refundableBalance == 0, "E011");
    store.status = StoreStatus.Closed;
    uint _total = store.settledBalance.add(store.excessBalance);
    if (_total > 0) {
      msg.sender.transfer(_total);
    }
    emit StoreClosed(msg.sender, store.settledBalance, store.excessBalance);
  }

  /// @notice Create a ticket event.
  /// @param _externalId event external ID provided by organizer. Will be stored hashed
  /// @param _organizer event organizer address. Will be able to manage the event thereafter
  /// @param _name event name
  /// @param _storeIncentive commission granted to store upon sale of tickets. From 0.00% (000) to 100.00% (10000)
  /// @param _ticketPrice ticket price (in wei)
  /// @param _ticketsOnSale number of tickets available for sale
  /// @return Event internal ID.
  /// @dev emit `EventCreated` event
  function createEvent(
    string calldata _externalId,
    address payable _organizer,
    string calldata _name,
    uint _storeIncentive,
    uint _ticketPrice,
    uint _ticketsOnSale
  ) 
    external 
    nonReentrant 
    onlyOwner 
    storeOpen 
    returns (uint eventId)
  {
    require(!_organizer.isContract(), "E012");
    require(bytes(_externalId).length != 0, "E013");
    require(bytes(_name).length != 0, "E014");
    require(_storeIncentive >= 0 && _storeIncentive <= 10000, "E015");
    require(_ticketsOnSale > 0, "E016");
    eventId = store.counterEvents.next();
    store.events[eventId].status = EventStatus.Created;
    store.events[eventId].externalId = keccak256(bytes(_externalId));
    store.events[eventId].organizer = _organizer;
    store.events[eventId].name = _name;
    store.events[eventId].storeIncentive = _storeIncentive;
    store.events[eventId].ticketPrice = _ticketPrice;
    store.events[eventId].ticketsOnSale = _ticketsOnSale;
    store.events[eventId].ticketsLeft = _ticketsOnSale;
    store.organizerEvents[_organizer].push(eventId);
    if (store.organizerEvents[_organizer].length == 1) {
      store.organizers.push(_organizer);
    }
    emit EventCreated(eventId, store.events[eventId].externalId, msg.sender);
    return (eventId);
  }

  /// @notice Start sale of tickets for an event.
  /// @param _eventId event internal ID
  /// @dev emit `EventSalesStarted` event
  function startTicketSales(uint _eventId)
    external
    nonReentrant
    storeOpen
    validEventId(_eventId)
    onlyOrganizer(_eventId)
  {
    require(
      store.events[_eventId].status == EventStatus.Created || 
      store.events[_eventId].status == EventStatus.SalesSuspended, 
      "E017"
    );
    store.events[_eventId].status = EventStatus.SalesStarted;
    emit EventSalesStarted(_eventId, store.events[_eventId].externalId, msg.sender);
  }

  /// @notice Suspend sale of tickets for an event.
  /// @param _eventId event internal ID
  /// @dev emit `EventSalesSuspended` event
  function suspendTicketSales(uint _eventId)
    external
    nonReentrant
    storeOpen
    validEventId(_eventId)
    onlyOrganizer(_eventId)
  {
    require(store.events[_eventId].status == EventStatus.SalesStarted, "E018");
    store.events[_eventId].status = EventStatus.SalesSuspended;
    emit EventSalesSuspended(_eventId, store.events[_eventId].externalId, msg.sender);
  }

  /// @notice End sale of tickets for an event.
  /// @notice It means that no tickets for the event can be sold thereafter.
  /// @param _eventId event internal ID
  /// @dev emit `EventSalesFinished` event
  function endTicketSales(uint _eventId)
    external
    nonReentrant
    storeOpen
    validEventId(_eventId)
    onlyOrganizer(_eventId)
  {
    require(store.events[_eventId].status == EventStatus.SalesStarted || store.events[_eventId].status == EventStatus.SalesSuspended, "E019");
    store.events[_eventId].status = EventStatus.SalesFinished;
    emit EventSalesFinished(_eventId, store.events[_eventId].externalId, msg.sender);
  }

  /// @notice Complete an event.
  /// @notice It means that the event is past and can be settled (paid out to organizer).
  /// @param _eventId event internal ID
  /// @dev emit `EventCompleted` event
  function completeEvent(uint _eventId)
    external
    nonReentrant
    storeOpen
    validEventId(_eventId)
    onlyOrganizer(_eventId)
  {
    require(store.events[_eventId].status == EventStatus.SalesFinished, "E020");
    store.events[_eventId].status = EventStatus.Completed;
    emit EventCompleted(_eventId, store.events[_eventId].externalId, msg.sender);
  }

  /// @notice Settle an event.
  /// @notice It means that (non-refundable) funds will be transferred to organizer.
  /// @notice No transfer will be performed if settlement balance is zero,
  /// @notice even though event will be considered settled.
  /// @param _eventId event internal ID
  /// @dev emit `EventSettled` event
  function settleEvent(uint _eventId)
    external
    nonReentrant
    storeOpen
    onlyOwner
  {
    require(store.events[_eventId].status == EventStatus.Completed, "E021");
    store.events[_eventId].status = EventStatus.Settled;
    uint _eventBalance = store.events[_eventId].eventBalance;
    uint _storeIncentive = store.events[_eventId].storeIncentive;
    uint _storeIncentiveBalance = _eventBalance.mul(_storeIncentive).div(10000);
    uint _settlement = _eventBalance.sub(_storeIncentiveBalance);
    store.settledBalance = store.settledBalance.add(_storeIncentiveBalance);
    if (_settlement > 0) {
      store.events[_eventId].organizer.transfer(_settlement);
    }
    emit EventSettled( _eventId, store.events[_eventId].externalId, msg.sender, _settlement );
  }

  /// @notice Cancel an event.
  /// @notice It means that ticket sales will stop and sold tickets (purchases) are refundable.
  /// @param _eventId event internal ID
  /// @dev emit `EventCancelled` event
  function cancelEvent(uint _eventId)
    external
    nonReentrant
    storeOpen
    validEventId(_eventId)
    onlyOrganizer(_eventId)
  {
    require(
      store.events[_eventId].status == EventStatus.Created || 
      store.events[_eventId].status == EventStatus.SalesStarted || 
      store.events[_eventId].status == EventStatus.SalesSuspended || 
      store.events[_eventId].status == EventStatus.SalesFinished, 
      "E022");
    store.events[_eventId].status = EventStatus.Cancelled;
    emit EventCancelled( _eventId, store.events[_eventId].externalId, msg.sender );
  }

  /// @notice Purchase one or more tickets.
  /// @param _eventId event internal ID
  /// @param _quantity number of tickets being purchase at once. It has to be greater than zero and available
  /// @param _externalId purchase external ID (usually for correlation). Cannot be empty. Will be stored hashed
  /// @param _timestamp purchase date provided by organizer (UNIX epoch)
  /// @param _customerId ID of the customer provided during purchase. Cannot be empty. Will be store hashed
  /// @return Purchase internal ID.
  /// @dev emit `PurchaseCompleted` event
  function purchaseTickets(
    uint _eventId,
    uint _quantity,
    string calldata _externalId,
    uint _timestamp,
    string calldata _customerId
  )
    external
    payable
    nonReentrant
    storeOpen
    validEventId(_eventId)
    returns (uint purchaseId)
  {
    require(store.events[_eventId].status == EventStatus.SalesStarted, "E023");
    require(!msg.sender.isContract(), "E024");
    require(_quantity > 0, "E025");
    require(_quantity <= store.events[_eventId].ticketsLeft, "E026");
    require(bytes(_externalId).length != 0, "E027");
    require(_timestamp > 0, "E028");
    require(bytes(_customerId).length != 0, "E029");
    require(msg.value == _quantity.mul(store.events[_eventId].ticketPrice), "E030");
    purchaseId = store.counterPurchases.next();
    store.purchases[purchaseId].status = PurchaseStatus.Completed;
    store.purchases[purchaseId].eventId = _eventId;
    store.purchases[purchaseId].quantity = _quantity;
    store.purchases[purchaseId].externalId = keccak256(bytes(_externalId));
    store.purchases[purchaseId].timestamp = _timestamp;
    store.purchases[purchaseId].customer = msg.sender;
    store.purchases[purchaseId].customerId = keccak256(bytes(_customerId));
    store.purchases[purchaseId].total = _quantity.mul( store.events[_eventId].ticketPrice );
    store.events[_eventId].ticketsSold = store.events[_eventId].ticketsSold.add( _quantity );
    store.events[_eventId].ticketsLeft = store.events[_eventId].ticketsLeft.sub( _quantity );
    store.events[_eventId].eventBalance = store.events[_eventId].eventBalance.add( store.purchases[purchaseId].total );
    store.customerPurchases[msg.sender].push(purchaseId);
    if (store.customerPurchases[msg.sender].length == 1) {
      store.customers.push(msg.sender);
    }
    emit PurchaseCompleted( purchaseId, store.purchases[purchaseId].externalId, msg.sender, _eventId );
    return (purchaseId);
  }

  /// @notice Cancel a purchase.
  /// @notice Other IDs are required in order to avoid fraudulent cancellations.
  /// @param _purchaseId purchase internal ID
  /// @param _externalId purchase external ID which will be hashed and then compared to store one
  /// @param _customerId purchase customer ID which will be hashed and then compared to store one
  /// @dev emit `PurchaseCancelled` event
  function cancelPurchase(
    uint _purchaseId,
    string calldata _externalId,
    string calldata _customerId
  )
    external
    nonReentrant
    validPurchaseId(_purchaseId)
    purchaseCompleted(_purchaseId)
  {
    uint _eventId = store.purchases[_purchaseId].eventId;
    require((store.status == StoreStatus.Open || store.status == StoreStatus.Closed) && (store.events[_eventId].status == EventStatus.SalesStarted || store.events[_eventId].status == EventStatus.SalesSuspended || store.events[_eventId].status == EventStatus.SalesFinished || store.events[_eventId].status == EventStatus.Cancelled), "E031");
    require(msg.sender == store.purchases[_purchaseId].customer, "E032");
    require(keccak256(bytes(_customerId)) == store.purchases[_purchaseId].customerId, "E033");
    require(keccak256(bytes(_externalId)) == store.purchases[_purchaseId].externalId, "E034");
    store.purchases[_purchaseId].status = PurchaseStatus.Cancelled;
    store.events[_eventId].ticketsCancelled = store.events[_eventId].ticketsCancelled.add( store.purchases[_purchaseId].quantity );
    store.events[_eventId].ticketsLeft = store.events[_eventId].ticketsLeft.add( store.purchases[_purchaseId].quantity );
    store.events[_eventId].eventBalance = store.events[_eventId].eventBalance.sub( store.purchases[_purchaseId].total );
    store.events[_eventId].refundableBalance = store.events[_eventId].refundableBalance.add( store.purchases[_purchaseId].total );
    store.refundableBalance = store.refundableBalance.add( store.purchases[_purchaseId].total );
    emit PurchaseCancelled( _purchaseId, store.purchases[_purchaseId].externalId, msg.sender, _eventId );
  }

  /// @notice Refund a cancelled purchase to customer.
  /// @param _eventId internal ID of the event associated to the purchase
  /// @param _purchaseId purchase internal ID
  /// @dev emit `PurchaseRefunded` event
  function refundPurchase(uint _eventId, uint _purchaseId)
    external
    nonReentrant
    validEventId(_eventId)
    onlyOrganizer(_eventId)
    validPurchaseId(_purchaseId)
  {
    require((store.status == StoreStatus.Open || store.status == StoreStatus.Closed) && store.purchases[_purchaseId].status == PurchaseStatus.Cancelled, "E035");
    store.purchases[_purchaseId].status = PurchaseStatus.Refunded;
    store.events[_eventId].ticketsRefunded = store.events[_eventId].ticketsRefunded.add( store.purchases[_purchaseId].quantity );
    store.events[_eventId].refundableBalance = store.events[_eventId].refundableBalance.sub( store.purchases[_purchaseId].total );
    store.refundableBalance = store.refundableBalance.sub( store.purchases[_purchaseId].total );
    store.purchases[_purchaseId].customer.transfer( store.purchases[_purchaseId].total );
    emit PurchaseRefunded( _purchaseId, store.purchases[_purchaseId].externalId, msg.sender, _eventId );
  }

  /// @notice Check into an event.
  /// @notice It means that customer and his/her companions (optional) attended to the event.
  /// @param _purchaseId purchase internal ID
  /// @dev emit `CustomerCheckedIn` event
  function checkIn(uint _purchaseId)
    external
    nonReentrant
    storeOpen
    validPurchaseId(_purchaseId)
    purchaseCompleted(_purchaseId)
  {
    uint _eventId = store.purchases[_purchaseId].eventId;
    require(store.events[_eventId].status == EventStatus.SalesStarted || store.events[_eventId].status == EventStatus.SalesSuspended || store.events[_eventId].status == EventStatus.SalesFinished, "E036");
    require(msg.sender == store.purchases[_purchaseId].customer, "E037");
    store.purchases[_purchaseId].status = PurchaseStatus.CheckedIn;
    emit CustomerCheckedIn(_eventId, _purchaseId, msg.sender);
  }

  /// @notice Fetch store basic information.
  /// @notice Basic info are those static attributes set when store is created.
  /// @return Store attributes.
  function fetchStoreInfo()
    external
    view
    returns (
      address storeOwner,
      uint storeStatus,
      uint storeSettledBalance,
      uint storeExcessBalance,
      uint storeRefundableBalance,
      uint storeCounterEvents,
      uint storeCounterPurchases
    )
  {
    storeOwner = owner();
    storeStatus = uint(store.status);
    storeSettledBalance = store.settledBalance;
    storeExcessBalance = store.excessBalance;
    storeRefundableBalance = store.refundableBalance;
    storeCounterEvents = store.counterEvents.current;
    storeCounterPurchases = store.counterPurchases.current;
  }

  /// @notice Fetch event basic information.
  /// @notice Basic info are those static attributes set when event is created.
  /// @param _eventId event internal ID
  /// @return Event status, external ID, organizer address, event name, store incentive, ticket price and quantity of tickets for sale.
  function fetchEventInfo(uint _eventId)
    external
    view
    validEventId(_eventId)
    returns (
      uint eventStatus,
      bytes32 eventExternalId,
      address eventOrganizer,
      string memory eventName,
      uint eventStoreIncentive,
      uint eventTicketPrice,
      uint eventTicketsOnSale
    )
  {
    eventStatus = uint(store.events[_eventId].status);
    eventExternalId = store.events[_eventId].externalId;
    eventOrganizer = store.events[_eventId].organizer;
    eventName = store.events[_eventId].name;
    eventStoreIncentive = store.events[_eventId].storeIncentive;
    eventTicketPrice = store.events[_eventId].ticketPrice;
    eventTicketsOnSale = store.events[_eventId].ticketsOnSale;
  }

  /// @notice Fetch event sales information.
  /// @notice Sales info are those attributes which change upon each purchase/cancellation transaction.
  /// @param _eventId event internal ID
  /// @return Event status, tickets sold/left/cancelled/refunded/checked-in, event total/refundable balances.
  function fetchEventSalesInfo(uint _eventId)
    external
    view
    validEventId(_eventId)
    returns (
      uint eventStatus,
      uint eventTicketsSold,
      uint eventTicketsLeft,
      uint eventTicketsCancelled,
      uint eventTicketsRefunded,
      uint eventTicketsCheckedIn,
      uint eventBalance,
      uint eventRefundableBalance
    )
  {
    eventStatus = uint(store.events[_eventId].status);
    eventTicketsSold = store.events[_eventId].ticketsSold;
    eventTicketsLeft = store.events[_eventId].ticketsLeft;
    eventTicketsCancelled = store.events[_eventId].ticketsCancelled;
    eventTicketsRefunded = store.events[_eventId].ticketsRefunded;
    eventTicketsCheckedIn = store.events[_eventId].ticketsCheckedIn;
    eventBalance = store.events[_eventId].eventBalance;
    eventRefundableBalance = store.events[_eventId].refundableBalance;
  }

  /// @notice Fetch purchase information.
  /// @param _purchaseId purchase internal ID
  /// @return Purchase status, external ID, timestamp, customer address/ID, quantity of tickets, total and event ID.
  function fetchPurchaseInfo(uint _purchaseId)
    external
    view
    validPurchaseId(_purchaseId)
    returns (
      uint purchaseStatus,
      bytes32 purchaseExternalId,
      uint purchaseTimestamp,
      address purchaseCustomer,
      bytes32 purchaseCustomerId,
      uint purchaseQuantity,
      uint purchaseTotal,
      uint purchaseEventId
    )
  {
    require(isOwner() || msg.sender == store.purchases[_purchaseId].customer || msg.sender == store.events[store.purchases[_purchaseId].eventId].organizer, "E038");
    purchaseStatus = uint(store.purchases[_purchaseId].status);
    purchaseExternalId = store.purchases[_purchaseId].externalId;
    purchaseTimestamp = store.purchases[_purchaseId].timestamp;
    purchaseCustomer = store.purchases[_purchaseId].customer;
    purchaseCustomerId = store.purchases[_purchaseId].customerId;
    purchaseQuantity = store.purchases[_purchaseId].quantity;
    purchaseTotal = store.purchases[_purchaseId].total;
    purchaseEventId = store.purchases[_purchaseId].eventId;
  }

  /// @notice Get number of events created by an organizer.
  /// @param _organizer organizer address
  /// @return Count of events. Zero in case organizer hasn't yet created any events.
  function getCountOrganizerEvents(address _organizer) 
    external 
    view 
    returns (uint countEvents)
  {
    // require(msg.sender == owner() || msg.sender == _organizer, "E039");
    countEvents = store.organizerEvents[_organizer].length;
    return countEvents;
  }

  /// @notice Get ID of an event, according to its position on list of events created by an organizer.
  /// @param _organizer organizer address
  /// @param _index position in the list. Starting from zero
  /// @return  Event ID
  function getEventIdByIndex(address _organizer, uint _index) 
    external 
    view 
    returns (uint eventId)
  {
    require(store.organizerEvents[_organizer].length != 0, "E040");
    require(_index < store.organizerEvents[_organizer].length, "E041");
    eventId = store.organizerEvents[_organizer][_index];
    return eventId;
  }

  /// @notice Get number of ticket purchases performed by a customer.
  /// @param _customer customer address
  /// @return Count of purchases. Zero in case customer hasn't yet purchased any tickets.
  function getCountCustomerPurchases(address _customer) 
    external 
    view 
    returns (uint countPurchases)
  {
    // require(msg.sender == owner() || msg.sender == _customer, "E042");
    countPurchases = store.customerPurchases[_customer].length;
    return countPurchases;
  }

  /// @notice Get ID of a purchase, according to its position on list of purchases performed by a customer.
  /// @param _customer customer address
  /// @param _index position in the list. Starting from zero
  /// @return Purchase ID
  function getPurchaseIdByIndex(address _customer, uint _index) 
    external 
    view 
    returns (uint purchaseId)
  {
    require(store.customerPurchases[_customer].length != 0, "E043");
    require(_index < store.customerPurchases[_customer].length, "E044");
    purchaseId = store.customerPurchases[_customer][_index];
    return purchaseId;
  }

  /// @notice Get number of organizers who dealt with the store.
  /// @return Count of organizers. Zero in case of none yet.
  function getCountOrganizers() 
    external 
    view 
    returns (uint countOrganizers) 
  {
    countOrganizers = store.organizers.length;
    return countOrganizers;
  }

  /// @notice Get address of an organizer, according to its position on list of organizers who delt with the store.
  /// @param _index position in the list. Starting from zero
  /// @return Organizer address
  function getOrganizerByIndex(uint _index) 
    external 
    view 
    returns (address organizer)
  {
    require(_index < store.organizers.length, "E045");
    organizer = store.organizers[_index];
    return organizer;
  }

  /// @notice Get number of customers who purchased tickets from the store.
  /// @return Count of customers. Zero in case of none yet.
  function getCountCustomers() 
    external 
    view 
    returns (uint countCustomers) 
  {
    countCustomers = store.customers.length;
    return countCustomers;
  }

  /// @notice Get address of an customer, according to its position on list of customers who purchased from the store.
  /// @param _index position in the list. Starting from zero
  /// @return Customer address
  function getCustomerByIndex(uint _index) 
    external 
    view 
    returns (address customer)
  {
    require(_index < store.customers.length, "E046");
    customer = store.customers[_index];
    return customer;
  }

  /// @notice Get role of an account in relation to the store.
  /// @param _account address of the account to be checked
  /// @return True or False for each of the possible roles
  function getAccountRole(address _account)
    external
    view
    returns (
    bool accountIsOwner,
    bool accountIsOrganizer,
    bool accountIsCustomer
  )
  {
    accountIsOwner = _account == owner();
    accountIsOrganizer = store.organizerEvents[_account].length > 0;
    accountIsCustomer = store.customerPurchases[_account].length > 0;
  }
}
