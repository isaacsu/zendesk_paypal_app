(function() {

  var STORE = {
    email: '',
    listing: {},
    detail: {}
  };

  var mockListing = "L_TIMESTAMP0=2014%2d02%2d18T04%3a07%3a20Z&L_TIMESTAMP1=2014%2d02%2d18T04%3a02%3a47Z&L_TIMESTAMP2=2014%2d02%2d18T04%3a02%3a08Z&L_TIMEZONE0=GMT&L_TIMEZONE1=GMT&L_TIMEZONE2=GMT&L_TYPE0=Refund&L_TYPE1=Payment&L_TYPE2=Payment&L_EMAIL0=zd%2dpersonal2%40isaacsu%2ecom&L_EMAIL1=zd%2dpersonal2%40isaacsu%2ecom&L_EMAIL2=zd%2dpersonal2%40isaacsu%2ecom&L_NAME0=Dao%20Chuan%20Isaac%20Su&L_NAME1=Dao%20Chuan%20Isaac%20Su&L_NAME2=Dao%20Chuan%20Isaac%20Su&L_TRANSACTIONID0=8K520326T2098332F&L_TRANSACTIONID1=1HE88866CX024940H&L_TRANSACTIONID2=7YP30818S6372374T&L_STATUS0=Completed&L_STATUS1=Partially%20Refunded&L_STATUS2=Completed&L_AMT0=%2d29%2e00&L_AMT1=229%2e00&L_AMT2=33%2e00&L_CURRENCYCODE0=USD&L_CURRENCYCODE1=USD&L_CURRENCYCODE2=USD&L_FEEAMT0=0%2e99&L_FEEAMT1=%2d8%2e09&L_FEEAMT2=%2d1%2e42&L_NETAMT0=%2d28%2e01&L_NETAMT1=220%2e91&L_NETAMT2=31%2e58&TIMESTAMP=2014%2d02%2d18T04%3a08%3a02Z&CORRELATIONID=233f1ea317d34&ACK=Success&VERSION=100&BUILD=9720069&";

  var mockDetail = "RECEIVERBUSINESS=zd%2dbusiness%40isaacsu%2ecom&RECEIVEREMAIL=zd%2dbusiness%40isaacsu%2ecom&RECEIVERID=CPZYNZZCY2RJJ&EMAIL=zd%2dpersonal2%40isaacsu%2ecom&PAYERID=WDHVHRWSMF6ZA&PAYERSTATUS=verified&COUNTRYCODE=US&SHIPTONAME=Dao%20Chuan%20Isaac%20Su&SHIPTOSTREET=1%20Main%20St&SHIPTOCITY=San%20Jose&SHIPTOSTATE=CA&SHIPTOCOUNTRYCODE=US&SHIPTOCOUNTRYNAME=United%20States&SHIPTOZIP=95131&ADDRESSOWNER=PayPal&ADDRESSSTATUS=Confirmed&TIMESTAMP=2014%2d02%2d20T00%3a18%3a44Z&CORRELATIONID=9dabe963aa77&ACK=Success&VERSION=100&BUILD=9720069&FIRSTNAME=Dao%20Chuan%20Isaac&LASTNAME=Su&TRANSACTIONID=1HE88866CX024940H&TRANSACTIONTYPE=sendmoney&PAYMENTTYPE=instant&ORDERTIME=2014%2d02%2d18T04%3a02%3a46Z&AMT=229%2e00&FEEAMT=8%2e09&CURRENCYCODE=USD&PAYMENTSTATUS=PartiallyRefunded&PENDINGREASON=None&REASONCODE=None&PROTECTIONELIGIBILITY=Ineligible&PROTECTIONELIGIBILITYTYPE=None&L_CURRENCYCODE0=USD&L_TAXABLE0=false";

  var mockNoResults = "TIMESTAMP=2014%2d02%2d24T00%3a15%3a42Z&CORRELATIONID=e0335ae52a67e&ACK=Failure&VERSION=100&BUILD=9720069&L_ERRORCODE0=10360&L_SHORTMESSAGE0=Transaction%20refused%20because%20of%20an%20invalid%20argument%2e%20See%20additional%20error%20messages%20for%20details%2e&L_LONGMESSAGE0=We%20didn%27t%20find%20any%20transactions%20associated%20with%20this%20email%20address%2e&L_SEVERITYCODE0=Error";
  
  return {
    
    generateApiRequest: function(payload) {
      //var host = this.setting('paypal_sandbox') ? "api-3t.sandbox.paypal.com" : "api-3t.paypal.com";
      var host = "api-3t.sandbox.paypal.com";
      //var host = "api-3t.paypal.com";

      var request = {
        url:  'https://' + host + '/nvp' ,
        type: 'POST'
//        secure: true
      };
      
      var data = {

        'VERSION': '100',
        "SIGNATURE": "AFcWxV21C7fd0v3bYYYRCpSSRl31AE3zsxym77ysOuXXEZYRlyc4GXxU",
        "PWD": "1392690824",
        "USER": "zd-business_api1.isaacsu.com",
//        'USER': '{{setting.paypal_api_username}}',
//        'PWD': '{{setting.paypal_api_password}}',
//        'SIGNATURE': '{{setting.paypal_api_signature}}'
      };
          
      request.data = _.extend(data, payload);
      return request;
    },
    
    events: {
      'app.activated':'onActivated',
      'fetchPaypalTransactionsByEmail.done': 'onDoneFetchPaypalTransactionsByEmail',
      'fetchPaypalTransactionById.done': 'saveAndRenderDetail',
      'click .transaction-detail': 'onClickTransactionDetail',
      'click .back-to-transactions': 'onClickBackToTransactions'
    },

    requests: {
      fetchPaypalTransactionsByEmail: function(email) {
        return this.generateApiRequest({
          'METHOD': 'TransactionSearch',
          'EMAIL': email,
          'STARTDATE': '2013-08-24T05:38:48Z'
        });
      },

      fetchPaypalTransactionById: function(id) {
        return this.generateApiRequest({
          'METHOD': 'GetTransactionDetails',
          'TRANSACTIONID': id
        });
      }
    },

    onActivated: function(ev) {
      var email = this.ticket().requester().email();
      STORE.email = email;

      if (_.isUndefined(STORE.listing[email])) {
        this.switchTo('loading', {email: email});
        this.ajax('fetchPaypalTransactionsByEmail', email);
      }
      else {
        this.renderListing(STORE.listing[email].list);
      }
    },

    onClickTransactionDetail: function(ev) {
      var transactionId = this.$(ev.currentTarget).data('transaction-id');
      if (_.isUndefined(STORE.detail[transactionId])) {
        console.log('ajaxing');
        this.$('.detail-loading').show();
        this.ajax('fetchPaypalTransactionById', transactionId);        
      }
      else {
        console.log('cache hit');
        this.renderDetail(STORE.detail[transactionId]);
      }
    },

    onClickBackToTransactions: function(ev) {
      this.renderListing(STORE.listing[STORE.email].list);
    },


    onDoneFetchPaypalTransactionsByEmail: function(data) {
      var payload = this.parsePaypalPayload(data);

      switch (payload.ACK) {
      case 'Success':
        if (!_.isUndefined(payload.list) && payload.list.length > 0) {
          this.saveAndRenderListing(payload);
        }
        else {
          this.switchTo('no_results', {email: STORE.email});
        }
        break;
        
      case 'SuccessWithWarning':
        break;

      case 'Failure':
        this.handleFailure(payload);
        break;

      case 'FailureWithWarning':
        this.handleFailure(payload);
        break;

      }
    },


    handleFailure: function(payload) {
      if(_.some(payload.list, function(el) { return el.ERRORCODE == "103601"; })) {
        this.switchTo('no_results', {email: STORE.email});
      }
      else {
        this.switchTo('error', payload);
      }
    },

    onDoneFetchPaypalTransactionById: function(data) {
      // parse data
      // if ACK==Success
      saveAndRenderDetail(data);
      // else
      // handle error
    },

    saveAndRenderListing: function(payload) {
      STORE.listing[STORE.email] = payload;
      this.renderListing(payload.list);
    },

    saveAndRenderDetail: function(data) {
      var transaction = this.parseDetail(data);
      STORE.detail[transaction.TRANSACTIONID] = transaction;
      this.$('.detail-loading').hide();
      this.renderDetail(transaction);
    },
    
    renderListing: function(listing) {
      this.switchTo('transaction_list', {
        transactions: listing
      });
    },

    renderDetail: function(transaction) {
      this.switchTo('transaction_show', transaction);
    },


    parseListing: function(str) {
      var transactions = str.split('&');
      
      return _.chain(transactions)
      
              // only work with "L_*" parameters
              .filter(function(el) { return el.substr(0,2) === "L_"; })

              // transform "TYPE0=REFUND" into arr['TYPE0'] = "REFUND"
              .reduce(function(res, el) {
                var keyValue = el.split('=');
                res[keyValue[0].substr(2)] = keyValue[1];
                return res;
              }, {})

              // transform arr['TYPE0'] = "REFUND" into arr[0]['TYPE'] = "REFUND"
              .reduce(function(res, elv, elk) {
                var that = this;

                var acceptedFields = [
                  'AMT', 'CURRENCYCODE', 'EMAIL', 'FEEAMT',
                  'NAME', 'NETAMT', 'STATUS', 'TIMESTAMP',
                  'TIMEZONE', 'TRANSACTIONID', 'TYPE'];

                _.each(acceptedFields, function(fieldName) {
                  var statusMap = {
                    'Pending':            'warning',
                    'Completed':          'success',
                    'Refunded':           'important',
                    'Partially Refunded': 'important',
                    'Denied':             'important',
                    'Reversed':           'inverse'
                  };

                  var matcher     = new RegExp("^(" + fieldName + ")([0-9]+)"),
                      matchResult = elk.match(matcher),
                      fieldValue;

                  if (matchResult !== null) {
                    fieldValue = decodeURIComponent(elv);

                    if (fieldName == 'TIMESTAMP') {
                      fieldValue = that.formatDatetime(fieldValue);
                    }

                    res[matchResult[2]] = res[matchResult[2]] || {};

                    if (fieldName == 'STATUS' && _.has(statusMap, fieldValue)) {
                      res[matchResult[2]].STATUS_CLASSNAME = 'label-' + statusMap[fieldValue];
                    }

                    res[matchResult[2]][matchResult[1]] = fieldValue;
                  }
                });
                return res;}, [], this)

              // end of chain!
              .value();
    },


    parsePaypalPayload: function(str) {
      var payload = str.split('&');
      return _.chain(payload)

              .filter(function(el) { return el !== ''})

              // transform "L_TYPE0=REFUND" into arr['L_TYPE0'] = "REFUND"
              .reduce(function(res, el) {
                var keyValue = el.split('=');
                res[keyValue[0]] = decodeURIComponent(keyValue[1]);
                return res;
              }, {})
              
              // transform arr['TYPE0'] = "REFUND" into arr[0]['TYPE'] = "REFUND"
              .reduce(function(res, elv, elk) {
                var that = this;

                // if key doesn't start with "L_" then straight copy
                if (elk.substr(0,2) !== "L_" && elk !== '') {
                  res[elk] = elv;
                }
                
                // else if key starts with "L_" then treat as list entry
                else {
                  res.list = res.list || [];
                  var matcher = new RegExp("L_([^0-9]+)([0-9]+)"),
                      matchResult = elk.match(matcher),
                      fieldName = matchResult[1],
                      fieldIndex = matchResult[2],
                      fieldValue;

                  var statusMap = {
                    'Pending':            'warning',
                    'Completed':          'success',
                    'Refunded':           'important',
                    'Partially Refunded': 'important',
                    'Denied':             'important',
                    'Reversed':           'inverse'
                  };
                  
                  fieldValue = elv;

                  if (fieldName == 'TIMESTAMP') {
                    fieldValue = that.formatDatetime(fieldValue);
                  }

                  res.list[fieldIndex] = res.list[fieldIndex] || {};

                  if (fieldName == 'STATUS' && _.has(statusMap, fieldValue)) {
                    res.list[fieldIndex].STATUS_CLASSNAME = 'label-' + statusMap[fieldValue];
                  }

                  res.list[fieldIndex][fieldName] = fieldValue;
                }

                return res;
                
                //var acceptedFields = [
                //  'AMT', 'CURRENCYCODE', 'EMAIL', 'FEEAMT',
                //  'NAME', 'NETAMT', 'STATUS', 'TIMESTAMP',
                //  'TIMEZONE', 'TRANSACTIONID', 'TYPE'];
                // 
                //_.each(acceptedFields, function(fieldName) {
                //  var statusMap = {
                //    'Pending':            'warning',
                //    'Completed':          'success',
                //    'Refunded':           'important',
                //    'Partially Refunded': 'important',
                //    'Denied':             'important',
                //    'Reversed':           'inverse'
                //  };
                // 
                //  var matcher     = new RegExp("^(" + fieldName + ")([0-9]+)"),
                //      matchResult = elk.match(matcher),
                //      fieldValue;
                // 
                //  if (matchResult !== null) {
                //    fieldValue = decodeURIComponent(elv);
                // 
                //    if (fieldName == 'TIMESTAMP') {
                //      fieldValue = that.formatDatetime(fieldValue);
                //    }
                // 
                //    res[matchResult[2]] = res[matchResult[2]] || {};
                // 
                //    if (fieldName == 'STATUS' && _.has(statusMap, fieldValue)) {
                //      res[matchResult[2]].STATUS_CLASSNAME = 'label-' + statusMap[fieldValue];
                //    }
                // 
                //    res[matchResult[2]][matchResult[1]] = fieldValue;
                //  }
                //});
                return res;}, {}, this)

        .value();


    },

    parseDetail: function(str) {
      var detail = str.split('&');
      return _.chain(detail)
                           // transform "TYPE0=REFUND" into arr['TYPE0'] = "REFUND"
              .reduce(function(res, el) {
                var keyValue = el.split('=');
                var fieldValue = decodeURIComponent(keyValue[1]);

                if (keyValue[0] == 'TIMESTAMP' || keyValue[0] == 'ORDERTIME') {
                  fieldValue = this.formatDatetime(fieldValue);
                }

                res[keyValue[0]] = fieldValue;
                return res;
              }, {}, this)

             .value();
    },

    formatDatetime: function(str) {
      // would be really nice if we could use moment() instead
      var M = ["Jan", "Feb", "Mar", "Apr", 
               "May", "Jun", "Jul", "Aug", 
               "Sep", "Oct", "Nov", "Dec"];

      var date = new Date(str);
      // e.g. 22 Feb, 1984
      return date.getDate().toString() + " " + 
             M[date.getMonth()] + ", " + 
             date.getFullYear().toString();
    }

  };

}());
