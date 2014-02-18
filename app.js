(function() {

  var mockListing = "L_TIMESTAMP0=2014%2d02%2d18T04%3a07%3a20Z&L_TIMESTAMP1=2014%2d02%2d18T04%3a02%3a47Z&L_TIMESTAMP2=2014%2d02%2d18T04%3a02%3a08Z&L_TIMEZONE0=GMT&L_TIMEZONE1=GMT&L_TIMEZONE2=GMT&L_TYPE0=Refund&L_TYPE1=Payment&L_TYPE2=Payment&L_EMAIL0=zd%2dpersonal2%40isaacsu%2ecom&L_EMAIL1=zd%2dpersonal2%40isaacsu%2ecom&L_EMAIL2=zd%2dpersonal2%40isaacsu%2ecom&L_NAME0=Dao%20Chuan%20Isaac%20Su&L_NAME1=Dao%20Chuan%20Isaac%20Su&L_NAME2=Dao%20Chuan%20Isaac%20Su&L_TRANSACTIONID0=8K520326T2098332F&L_TRANSACTIONID1=1HE88866CX024940H&L_TRANSACTIONID2=7YP30818S6372374T&L_STATUS0=Completed&L_STATUS1=Partially%20Refunded&L_STATUS2=Completed&L_AMT0=%2d29%2e00&L_AMT1=229%2e00&L_AMT2=33%2e00&L_CURRENCYCODE0=USD&L_CURRENCYCODE1=USD&L_CURRENCYCODE2=USD&L_FEEAMT0=0%2e99&L_FEEAMT1=%2d8%2e09&L_FEEAMT2=%2d1%2e42&L_NETAMT0=%2d28%2e01&L_NETAMT1=220%2e91&L_NETAMT2=31%2e58&TIMESTAMP=2014%2d02%2d18T04%3a08%3a02Z&CORRELATIONID=233f1ea317d34&ACK=Success&VERSION=100&BUILD=9720069&";

  return {
    events: {
      'app.activated':'doSomething'
    },

    doSomething: function() {
      console.log(this.getListing(), 'boomboom');
      this.switchTo('listing', { // render the ticket.hdbs template
        transactions: this.getListing()
//        transactions: mockListing.split('&'),
      });
    },

    getListing: function() {
      var transactions = mockListing.split('&');
      return _.chain(transactions)
              .filter(function(el) { return el.substr(0,2) === "L_" })
              .reduce(function(res, el) {
                var keyValue = el.split('=');
                res[keyValue[0].substr(2)] = keyValue[1];
                return res;
              }, {})
              .reduce(function(res, elv, elk) {
                var acceptedFields = [
                  'AMT', 'CURRENCYCODE', 'EMAIL', 'FEEAMT',
                  'NAME', 'NETAMT', 'STATUS', 'TIMESTAMP',
                  'TIMEZONE', 'TRANSACTIONID', 'TYPE'];
                // extract index

                _.each(acceptedFields, function(fieldName) {
                  var matcher = new RegExp("^(" + fieldName + ")([0-9]+)");
                  var matchResult = elk.match(matcher);
                  if (matchResult !== null) {
                    res[matchResult[2]] = res[matchResult[2]] || {};
                    res[matchResult[2]][matchResult[1]] = decodeURIComponent(elv);
                  }
                });
                return res;
              }, [])
              .value();
    }
  };

}());
