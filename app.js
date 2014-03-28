(function() {

  var STORE = {
    email: '',
    listing: {},
    detail: {}
  };

  return {

    events: {
      'app.activated': 'onActivated',

      'fetchTransactionsByEmail.done': 'onDoneFetchTransactionsByEmail',
      'fetchTransactionById.done':     'onDoneFetchTransactionById',

      'click .transaction-detail':   'onClickTransactionDetail',
      'click .back-to-transactions': 'onClickBackToTransactions',

      'submit .zendesk-paypal-search-form': 'onSubmitSearch'
    },

    requests: {
      fetchTransactionsByEmail: function(email) {
        return this.generateApiRequest({
          'METHOD': 'TransactionSearch',
          'EMAIL': email,
          'STARTDATE': '2013-08-24T05:38:48Z'
        });
      },

      fetchTransactionById: function(id) {
        return this.generateApiRequest({
          'METHOD': 'GetTransactionDetails',
          'TRANSACTIONID': id
        });
      }
    },

    generateApiRequest: function(payload) {
      var host = this.setting('paypal_sandbox') ? "api-3t.sandbox.paypal.com" : "api-3t.paypal.com";

      var request = {
        url: helpers.fmt('https://%@/nvp', host),
        secure: true,
        type: 'POST'
      };

      var data = {
        'VERSION': '100',
        'USER': '{{setting.paypal_api_username}}',
        'PWD': '{{setting.paypal_api_password}}',
        'SIGNATURE': '{{setting.paypal_api_signature}}'
      };

      request.data = _.extend(data, payload);

      return request;
    },


    onActivated: function(ev) {
      var email = this.ticket().requester().email();
      STORE.email = email;

      this.$('input.zendesk-paypal-search-email').val(email);

      if (_.isUndefined(STORE.listing[email])) {
        this.switchTo('loading', {email: email});
        this.ajax('fetchTransactionsByEmail', email);
      }
      else {
        this.renderListing(STORE.listing[email].list);
      }
    },

    onClickTransactionDetail: function(ev) {
      var transactionId = this.$(ev.currentTarget).data('transaction-id');
      if (_.isUndefined(STORE.detail[transactionId])) {
        this.$('.detail-loading').show();
        this.ajax('fetchTransactionById', transactionId);
      }
      else {
        this.renderDetail(STORE.detail[transactionId]);
      }
    },

    onClickBackToTransactions: function(ev) {
      this.renderListing(STORE.listing[STORE.email].list);
    },

    onDoneFetchTransactionsByEmail: function(data) {
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

    onDoneFetchTransactionById: function(data) {
      var payload = this.parsePaypalPayload(data);
      switch (payload.ACK) {
      case 'Success':
        this.saveAndRenderDetail(payload);
        break;
      default:
        this.handleFailure(payload);
      }
    },

    onSubmitSearch: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      var email = this.$('input.zendesk-paypal-search-email').first().val();

      if (email !== "") {
        STORE.email = email;
        this.switchTo('loading', {email: email});
        this.ajax('fetchTransactionsByEmail', email);
      }
      return false;
    },

    saveAndRenderListing: function(payload) {
      STORE.listing[STORE.email] = payload;
      this.renderListing(payload.list);
    },

    saveAndRenderDetail: function(payload) {
      STORE.detail[payload.TRANSACTIONID] = payload;
      this.$('.detail-loading').hide();
      this.renderDetail(payload);
    },

    handleFailure: function(payload) {
      if(_.some(payload.list, function(el) { return el.ERRORCODE == "10360"; })) {
        this.switchTo('no_results', {email: STORE.email});
      }
      else {
        this.switchTo('error', payload);
      }
    },

    renderListing: function(listing) {
      this.switchTo('transaction_list', {
        transactions: listing
      });
    },

    renderDetail: function(transaction) {
      this.switchTo('transaction_show', transaction);
    },

    parsePaypalPayload: function(str) {
      var payload = str.split('&');

      return _.chain(payload)

              .filter(function(el) { return el !== '';})

              // transform "L_TYPE0=REFUND" into arr['L_TYPE0'] = "REFUND"
              .reduce(function(res, el) {
                var keyValue = el.split('=');
                res[keyValue[0]] = decodeURIComponent(keyValue[1]);
                return res;
              }, {})

              // transform arr['TYPE0'] = "REFUND" into arr[0]['TYPE'] = "REFUND"
              .reduce(function(res, elv, elk) {
                var that = this;
                var fieldValue;

                // if key doesn't start with "L_" then straight copy
                if (elk.substr(0,2) !== "L_" && elk !== '') {
                  fieldValue = elv;
                  if (_.contains(['TIMESTAMP', 'ORDERTIME'], elk)) {
                    fieldValue = that.formatDatetime(fieldValue);
                  }
                  res[elk] = fieldValue;
                }

                // else if key starts with "L_" then treat as list entry
                else {
                  res.list = res.list || [];
                  var matcher = new RegExp("L_([^0-9]+)([0-9]+)"),
                      matchResult = elk.match(matcher),
                      fieldName = matchResult[1],
                      fieldIndex = matchResult[2];

                  var statusMap = {
                    'Pending':            'warning',
                    'Completed':          'success',
                    'Refunded':           'important',
                    'Partially Refunded': 'important',
                    'Denied':             'important',
                    'Reversed':           'inverse'
                  };

                  fieldValue = elv;

                  if (_.contains(['TIMESTAMP', 'ORDERTIME'], fieldName)) {
                    fieldValue = that.formatDatetime(fieldValue);
                  }

                  res.list[fieldIndex] = res.list[fieldIndex] || {};

                  if (fieldName == 'STATUS' && _.has(statusMap, fieldValue)) {
                    res.list[fieldIndex].STATUS_CLASSNAME = 'label-' + statusMap[fieldValue];
                  }

                  res.list[fieldIndex][fieldName] = fieldValue;
                }

                return res;
              }, {}, this)

              .value();
    },

    formatDatetime: function(str) {
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
