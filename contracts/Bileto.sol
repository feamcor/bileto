pragma solidity 0.5.6;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/drafts/Counters.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

/// @author Fábio Corrêa <feamcor@gmail.com>
/// @title Bileto: a decentralized ticket store for the Ethereum blockchain.
contract Bileto is Ownable, Pausable, ReentrancyGuard {
  using SafeMath for uint;
  using Counters for Counters.Counter;
  using Address for address;
  using Address for address payable;

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
    uint settledBalance;
    uint excessBalance;
    uint refundableBalance;
    address[] organizers;
    Counters.Counter counterEvents;
    mapping(uint => Event) events;
    mapping(address => uint[]) organizerEvents;
    address[] customers;
    Counters.Counter counterPurchases;
    mapping(uint => Purchase) purchases;
    mapping(address => uint[]) customerPurchases;
  }

  struct Event {
    EventStatus status;
    bytes32 externalId;
    address payable organizer;
    string name;
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

  // 1% of every purchase transaction is reverted to the Store for funding
  uint constant STORE_INCENTIVE = 100;

  Store private store;

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
  /// @param _eventId event internal ID
  /// @dev corresponds to `PurchaseStatus.Completed`
  event PurchaseCompleted(uint indexed _id, bytes32 indexed _externalId, address indexed _by, uint _eventId);

  /// @notice Ticket purchase was cancelled.
  /// @param _id purchase internal ID (indexed)
  /// @param _externalId hash of the purchase external ID (indexed)
  /// @param _by customer address (indexed)
  /// @param _eventId event internal ID
  /// @dev corresponds to `PurchaseStatus.Cancelled`
  event PurchaseCancelled(uint indexed _id, bytes32 indexed _externalId, address indexed _by, uint _eventId);

  /// @notice Ticket purchase was refunded.
  /// @param _id purchase internal ID (indexed)
  /// @param _externalId hash of the purchase external ID (indexed)
  /// @param _by customer address (indexed)
  /// @param _eventId event internal ID
  /// @dev corresponds to `PurchaseStatus.Refunded`
  event PurchaseRefunded(uint indexed _id, bytes32 indexed _externalId, address indexed _by, uint _eventId);

  /// @notice Customer checked in the event.
  /// @param _eventId event internal ID (indexed)
  /// @param _purchaseId purchase internal ID (indexed)
  /// @param _by customer address (indexed)
  /// @dev corresponds to `PurchaseStatus.CheckedIn`
  event CustomerCheckedIn(uint indexed _eventId, uint indexed _purchaseId, address indexed _by);

  /// @notice Fallback function.
  /// @notice Only owner will be able to withdraw these funds.
  function() external payable {
    require(msg.data.length == 0, "E008");
    store.excessBalance = store.excessBalance.add(msg.value);
  }

  /// @notice Check if Event ID is within range.
  /// @param _eventId event internal ID
  /// @return true or revert transaction (false)
  function isEventIdValid(uint _eventId)
    internal 
    view 
    returns (bool) 
  {
    require(_eventId <= store.counterEvents.current(), "E002");
    return true;
  }

  /// @notice Check if sender is Event's Organizer.
  /// @param _eventId event internal ID
  /// @return true or revert transaction (false)
  function isEventOrganizer(uint _eventId) 
    internal 
    view 
    returns (bool) 
  {
    require(msg.sender == store.events[_eventId].organizer, "E004");
    return true;
  }

  /// @notice Check if Purchase ID is within range.
  /// @param _purchaseId purchase internal ID
  /// @return true or revert transaction
  function isPurchaseIdValid(uint _purchaseId)
    internal
    view
    returns (bool)
  {
    require(_purchaseId <= store.counterPurchases.current(), "E003");
    return true;
  }

  /// @notice Check if Purchase's state is completed.
  /// @param _purchaseId purchase internal ID
  /// @return true or revert transaction
  function isPurchaseCompleted(uint _purchaseId)
    internal
    view
    returns (bool)
  {
    require(store.purchases[_purchaseId].status == PurchaseStatus.Completed, "E006");
    return true;
  }

  /// @notice Create a ticket event. Sender becomes event organizer.
  /// @param _externalId event external ID provided by organizer. Will be stored hashed
  /// @param _name event name
  /// @param _ticketPrice ticket price (in wei)
  /// @param _ticketsOnSale number of tickets available for sale
  /// @return Event internal ID.
  /// @dev emit `EventCreated` event
  function createEvent(
    string calldata _externalId,
    string calldata _name,
    uint _ticketPrice,
    uint _ticketsOnSale
  ) 
    external 
    nonReentrant 
    whenNotPaused
    returns (uint eventId)
  {
    require(!msg.sender.isContract(), "E012");
    require(bytes(_externalId).length != 0, "E013");
    require(bytes(_name).length != 0, "E014");
    require(_ticketsOnSale > 0, "E016");
    store.counterEvents.increment();
    eventId = store.counterEvents.current();
    store.events[eventId].status = EventStatus.Created;
    store.events[eventId].externalId = keccak256(bytes(_externalId));
    store.events[eventId].organizer = msg.sender;
    store.events[eventId].name = _name;
    store.events[eventId].ticketPrice = _ticketPrice;
    store.events[eventId].ticketsOnSale = _ticketsOnSale;
    store.events[eventId].ticketsLeft = _ticketsOnSale;
    store.organizerEvents[msg.sender].push(eventId);
    if (store.organizerEvents[msg.sender].length == 1) {
      store.organizers.push(msg.sender);
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
    whenNotPaused
  {
    isEventIdValid(_eventId);
    isEventOrganizer(_eventId);
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
    whenNotPaused
  {
    isEventIdValid(_eventId);
    isEventOrganizer(_eventId);
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
    whenNotPaused
  {
    isEventIdValid(_eventId);
    isEventOrganizer(_eventId);
    require(
      store.events[_eventId].status == EventStatus.SalesStarted || 
      store.events[_eventId].status == EventStatus.SalesSuspended, 
      "E019"
    );
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
    whenNotPaused
  {
    isEventIdValid(_eventId);
    isEventOrganizer(_eventId);
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
    whenNotPaused
  {
    isEventIdValid(_eventId);
    isEventOrganizer(_eventId);
    require(store.events[_eventId].status == EventStatus.Completed, "E021");
    store.events[_eventId].status = EventStatus.Settled;
    uint _eventBalance = store.events[_eventId].eventBalance;
    uint _settlement = 0;
    if (_eventBalance > 0) {
      uint _storeIncentiveBalance = _eventBalance.mul(STORE_INCENTIVE).div(10000);
      _settlement = _eventBalance.sub(_storeIncentiveBalance);
      store.settledBalance = store.settledBalance.add(_storeIncentiveBalance);
    }
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
    whenNotPaused
  {
    isEventIdValid(_eventId);
    isEventOrganizer(_eventId);
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
    whenNotPaused
    returns (uint purchaseId)
  {
    isEventIdValid(_eventId);
    require(store.events[_eventId].status == EventStatus.SalesStarted, "E023");
    require(!msg.sender.isContract(), "E024");
    require(_quantity > 0, "E025");
    require(_quantity <= store.events[_eventId].ticketsLeft, "E026");
    require(bytes(_externalId).length != 0, "E027");
    require(_timestamp > 0, "E028");
    require(bytes(_customerId).length != 0, "E029");
    require(msg.value == _quantity.mul(store.events[_eventId].ticketPrice), "E030");
    store.counterPurchases.increment();
    purchaseId = store.counterPurchases.current();
    store.purchases[purchaseId].status = PurchaseStatus.Completed;
    store.purchases[purchaseId].eventId = _eventId;
    store.purchases[purchaseId].quantity = _quantity;
    store.purchases[purchaseId].externalId = keccak256(bytes(_externalId));
    store.purchases[purchaseId].timestamp = _timestamp;
    store.purchases[purchaseId].customer = msg.sender;
    store.purchases[purchaseId].customerId = keccak256(bytes(_customerId));
    store.purchases[purchaseId].total = _quantity.mul(store.events[_eventId].ticketPrice);
    store.events[_eventId].ticketsSold = store.events[_eventId].ticketsSold.add(_quantity);
    store.events[_eventId].ticketsLeft = store.events[_eventId].ticketsLeft.sub(_quantity);
    store.events[_eventId].eventBalance = store.events[_eventId].eventBalance.add(store.purchases[purchaseId].total);
    store.customerPurchases[msg.sender].push(purchaseId);
    if (store.customerPurchases[msg.sender].length == 1) {
      store.customers.push(msg.sender);
    }
    emit PurchaseCompleted(purchaseId, store.purchases[purchaseId].externalId, msg.sender, _eventId);
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
    whenNotPaused
  {
    isPurchaseIdValid(_purchaseId);
    isPurchaseCompleted(_purchaseId);
    uint _eventId = store.purchases[_purchaseId].eventId;
    require(
      store.events[_eventId].status == EventStatus.SalesStarted || 
      store.events[_eventId].status == EventStatus.SalesSuspended || 
      store.events[_eventId].status == EventStatus.SalesFinished || 
      store.events[_eventId].status == EventStatus.Cancelled, 
      "E031"
    );
    require(msg.sender == store.purchases[_purchaseId].customer, "E032");
    require(keccak256(bytes(_customerId)) == store.purchases[_purchaseId].customerId, "E033");
    require(keccak256(bytes(_externalId)) == store.purchases[_purchaseId].externalId, "E034");
    store.purchases[_purchaseId].status = PurchaseStatus.Cancelled;
    store.events[_eventId].ticketsCancelled = store.events[_eventId].ticketsCancelled.add(store.purchases[_purchaseId].quantity);
    store.events[_eventId].ticketsLeft = store.events[_eventId].ticketsLeft.add(store.purchases[_purchaseId].quantity);
    store.events[_eventId].eventBalance = store.events[_eventId].eventBalance.sub(store.purchases[_purchaseId].total);
    store.events[_eventId].refundableBalance = store.events[_eventId].refundableBalance.add(store.purchases[_purchaseId].total);
    store.refundableBalance = store.refundableBalance.add(store.purchases[_purchaseId].total);
    emit PurchaseCancelled(_purchaseId, store.purchases[_purchaseId].externalId, msg.sender, _eventId);
  }

  /// @notice Refund a cancelled purchase to customer.
  /// @param _eventId internal ID of the event associated to the purchase
  /// @param _purchaseId purchase internal ID
  /// @dev emit `PurchaseRefunded` event
  function refundPurchase(uint _eventId, uint _purchaseId)
    external
    nonReentrant
    whenNotPaused
  {
    isEventIdValid(_eventId);
    isEventOrganizer(_eventId);
    isPurchaseIdValid(_purchaseId);
    require(store.purchases[_purchaseId].status == PurchaseStatus.Cancelled, "E035");
    store.purchases[_purchaseId].status = PurchaseStatus.Refunded;
    store.events[_eventId].ticketsRefunded = store.events[_eventId].ticketsRefunded.add(store.purchases[_purchaseId].quantity);
    store.events[_eventId].refundableBalance = store.events[_eventId].refundableBalance.sub(store.purchases[_purchaseId].total);
    store.refundableBalance = store.refundableBalance.sub(store.purchases[_purchaseId].total);
    store.purchases[_purchaseId].customer.transfer(store.purchases[_purchaseId].total);
    emit PurchaseRefunded(_purchaseId, store.purchases[_purchaseId].externalId, msg.sender, _eventId);
  }

  /// @notice Check into an event.
  /// @notice It means that customer and his/her companions (optional) attended to the event.
  /// @param _purchaseId purchase internal ID
  /// @dev emit `CustomerCheckedIn` event
  function checkIn(uint _purchaseId)
    external
    nonReentrant
    whenNotPaused
  {
    isPurchaseIdValid(_purchaseId);
    isPurchaseCompleted(_purchaseId);
    uint _eventId = store.purchases[_purchaseId].eventId;
    require(
      store.events[_eventId].status == EventStatus.SalesStarted || 
      store.events[_eventId].status == EventStatus.SalesSuspended || 
      store.events[_eventId].status == EventStatus.SalesFinished, 
      "E036"
    );
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
      bool storePaused,
      uint storeSettledBalance,
      uint storeExcessBalance,
      uint storeRefundableBalance,
      uint storeCounterEvents,
      uint storeCounterPurchases
    )
  {
    storeOwner = owner();
    storePaused = paused();
    storeSettledBalance = store.settledBalance;
    storeExcessBalance = store.excessBalance;
    storeRefundableBalance = store.refundableBalance;
    storeCounterEvents = store.counterEvents.current();
    storeCounterPurchases = store.counterPurchases.current();
  }

  /// @notice Fetch event basic information.
  /// @notice Basic info are those static attributes set when event is created.
  /// @param _eventId event internal ID
  /// @return Event status, external ID, organizer address, event name, ticket price and quantity of tickets for sale.
  function fetchEventInfo(uint _eventId)
    external
    view
    returns (
      uint eventStatus,
      bytes32 eventExternalId,
      address eventOrganizer,
      string memory eventName,
      uint eventTicketPrice,
      uint eventTicketsOnSale
    )
  {
    isEventIdValid(_eventId);
    eventStatus = uint(store.events[_eventId].status);
    eventExternalId = store.events[_eventId].externalId;
    eventOrganizer = store.events[_eventId].organizer;
    eventName = store.events[_eventId].name;
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
    isEventIdValid(_eventId);
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
    isPurchaseIdValid(_purchaseId);
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
