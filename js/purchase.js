;(function ($, braintree, Formatter) {
  'use strict'

  loadClientToken(setupBraintreeClientV3, clientTokenLoadFailure)

  function handleError (err) {
    console.error(err)
    $('#errorMessage').html(err.message)
    showPanel('#panelError')
  };

  function handleFail () {
    showPanel('#panelFail')
  };

  function setupBraintreeClientV3 (clientToken) {
    console.log('setting up client', clientToken)
    if (!clientToken.token) {
      console.error('Error connecting to payment provider', clientToken)
      return handleFail()
    }
    braintree.client.create({
      authorization: clientToken.token
      // enableCORS: true
    }, setupHostedFieldsV3)
  }

  function setupHostedFieldsV3 (err, clientInstance) {
    if (err) {
      console.error('Error creating payment client', err)
      return handleFail()
    }
    braintree.hostedFields.create({
      client: clientInstance,
      styles: {
        'input': {
          'font-size': '14px',
          'font-family': 'courier, monospace',
          'color': '#3a3a3a'
        },
        ':focus': {
          'color': 'black'
        },
        '.valid': {
          'color': '#8bdda8'
        },
        '.invalid': {
          'color': 'tomato'
        }
      },
      fields: {
        number: {
          selector: '#frmCCNum',
          placeholder: '4111 1111 1111 1111'
        },
        cvv: {
          selector: '#frmCCCVC',
          placeholder: '123'
        },
        expirationDate: {
          selector: '#frmCCExp',
          placeholder: 'MM/YY'
        },
        postalCode: {
          selector: '#frmCCZip',
          placeholder: '90210'
        }
      }
    }, onHostedFieldsReady)
  }

  function onHostedFieldsReady (err, hostedFieldsInstance) {
    if (err) {
      console.error('Error creating hosted fields', err)
      return handleFail()
    }

    hostedFieldsInstance.on('validityChange', function (event) {
      var field = event.fields[event.emittedBy]

      if (field.isValid) {
        // Apply styling for a valid field
        $(field.container).addClass('braintree-hosted-fields-valid')
        // if (event.emittedBy === 'number') {
        //   $('#card-number').next('span').text('')
        // }
      } else if (field.isPotentiallyValid) {
        // Remove styling from potentially valid fields
        $(field.container).removeClass('braintree-hosted-fields-valid')
        $(field.container).removeClass('braintree-hosted-fields-invalid')
        // if (event.emittedBy === 'number') {
        //   $('#card-number').next('span').text('')
        // }
      } else {
        // Add styling to invalid fields
        $(field.container).addClass('braintree-hosted-fields-invalid')
        // Add helper text for an invalid card number
        // if (event.emittedBy === 'number') {
        //   $('#frmCCNum').next('span').text('Looks like this card number has an error.')
        // }
      }
    })

    hostedFieldsInstance.on('cardTypeChange', function (event) {
      // Handle a field's change, such as a change in validity or credit card type
      // if (event.cards.length === 1) {
      //   $('#card-type').text(event.cards[0].niceType)
      // } else {
      //   $('#card-type').text('Card')
      // }
    })

    onBraintreeReady(hostedFieldsInstance)
  }

  function onBraintreeReady (hostedFieldsInstance) {
    $(document).ready(function () {
      $('input').on('focus', function (e) {
        var div = $(e.target).parent()
        div.removeClass('braintree-hosted-fields-valid')
        div.removeClass('braintree-hosted-fields-invalid')
        div.addClass('braintree-hosted-fields-focused')
      }).on('blur', function (e) {
        var div = $(e.target).parent()
        div.removeClass('braintree-hosted-fields-focused')
        div.removeClass('braintree-hosted-fields-valid')
        div.removeClass('braintree-hosted-fields-invalid')
        if (e.target.checkValidity()) {
          div.addClass('braintree-hosted-fields-valid')
        } else {
          div.addClass('braintree-hosted-fields-invalid')
        }
      })

      var formatterPhone = new Formatter(document.getElementById('frmPhone'), {
        'pattern': '({{999}}) {{999}}-{{9999}}'
      })

      $('button').click(setupClickHander(hostedFieldsInstance))

      $('#frmFee').on('blur', function () {
        $('#btnPay').html('Send $' + $('#frmFee').val().trim() + ' Payment')
        $('#feeDisplay').html('$' + $('#frmFee').val().trim())
      })

      showPanel('#panel1')
    })
  }

  function sendPaymentForm (data, onDone, onFail) {
    $.ajax({
      url: 'https://tl4hta2txd.execute-api.us-west-2.amazonaws.com/dev/checkout',
      type: 'POST',
      contentType: 'application/json; charset=UTF-8',
      data: {
        nonce: data.nonce,
        merchant: data.merchant,
        purpose: data.purpose,
        payor: data.payor,
        reason: data.reason,
        amount: data.amount,
        email: data.email,
        phone: data.phone,
        name: data.name
      },
      crossDomain: true
    })
      .done(onDone)
      .fail(onFail)
  }

  function loadClientToken (onDone, onFail) {
    $.ajax({
      url: 'https://tl4hta2txd.execute-api.us-west-2.amazonaws.com/dev/token',
      type: 'GET',
      crossDomain: true
    })
      .done(onDone)
      .fail(onFail)
  }

  function clientTokenLoadFailure (xhr, status) {
    console.log('fail loading client token')
    handleFail()
  }

  function updateReason (reason, amount) {
    $('#frmPurpose').val(reason)
    $('#frmFee').val(amount)
    $('#btnPay').html('Send $' + amount + ' Payment')
    $('#feeDisplay').html('$' + amount)
  }

  function displayFields (props) {
    $('#lblFee, #lblReason').hide()
    $('#wrapFee, #wrapReason').hide()
    $('#frmFee, #frmReason, #frmCCName').removeAttr('required')
    $(props.show).show()
    $(props.required).attr('required', 'required')
  }

  function setupClickHander (hostedFieldsInstance) {
    return function onButtonClicked (event) {
      var id = event.target.id
      var amount = $(event.target).data('amount')
      var panel = $(event.target).data('panel')
      switch (id) {
        case 'btnIndoor':
          updateReason('indoor', amount)
          displayFields({
            show: '',
            required: ''
          })
          break
        case 'btnFutsal':
          updateReason('futsal', amount)
          displayFields({
            show: '',
            required: ''
          })
          break
        case 'btnBoth':
          updateReason('both', amount)
          displayFields({
            show: '',
            required: ''
          })
          break
        case 'btnRecert':
          updateReason('recert', amount)
          displayFields({
            show: '',
            required: ''
          })
          break
        case 'btnOther':
          updateReason('other', amount)
          displayFields({
            show: '#lblReason, #wrapReason, #lblFee, #wrapFee',
            required: '#frmReason, #frmFee'
          })
          break
        case 'btnNext':
          if (onClickNext()) {
            $('#frmCCName').attr('required', 'required')
          } else {
            panel = null
          }
          break
        case 'btnPay':
          event.preventDefault()
          // Deactivate submit button
          $(event.target).prop('disabled', true)

          hostedFieldsInstance.tokenize(function (err, obj) {
            if (err) {
              return handleError(err)
            }

            console.log('payment method received', obj)

            // amount: transaction.amount,
            // createdAt: transaction.createdAt,
            // id: transaction.id,
            // descriptor: transaction.descriptor.name,
            // cardType: transaction.creditCard.cardType,
            // maskedNumber: transaction.creditCard.maskedNumber,
            // errors: []

            // Get data from form
            var data = $.extend(getFormData(), { nonce: obj.nonce })
            // console.log('sending data', data)
            // Send payment nonce with additional form data
            sendPaymentForm(data, function (result) {
              // console.log('sent payment form', result)
              $('#feeDisplay').html('$' + result.amount)
              $('#cardTypeDisplay').html(result.cardType)
              $('#last4Display').html(result.last4)
              $('#descriptorDisplay').html(result.descriptor)
              $('#transactionIdDisplay').html(result.id)
              showPanel('#panel4')
            }, function (err) {
              // Activate submit button
              $(event.target).prop('disabled', false)
              return handleError(err)
            })
          })
          break
        case 'btnBack1':
        case 'btnBack2':
        case 'btnRetry':
          break
        case 'btnCancel':
        case 'btnDone':
          window.location.replace('/')
          break
        default:
          // Shouldn't happen, error out
      }
      if (panel) {
        showPanel(panel)
      }
    }
  }

  function showPanel (panel) {
    $('#panel0, #panel1, #panel2, #panel3, #panel4, #panelError, #panelFail').removeClass('hidden').hide()
    $(panel).show()
  }

  function onClickNext () {
    // var $form = $('#payment-form')
    var $inputs = $('#frmPayor, #frmFee, #frmReason, #frmEmail, #frmPhone')
    if (checkValidity($inputs)) {
      $('#frmCCName, #frmCCNum, #frmCCExp, #frmCCCVC, #frmCCZip').attr('required', 'required')
      return true
    } else {
      // If the form is invalid, submit it. The form won't actually submit
      // this will just cause the browser to display the native HTML5 error messages.
      // $form.find(':submit').click()
      return false
    }
  }

  function checkValidity (inputs) {
    var result = true
    for (var i = 0, len = inputs.length; i < len; i++) {
      var div = $(inputs[i]).parent()
      if (!inputs[i].checkValidity()) {
        div.addClass('braintree-hosted-fields-invalid')
        result = false
      } else {
        div.addClass('braintree-hosted-fields-valid')
      }
    }
    return result
  }

  function getFormData () {
    return {
      merchant: $('#frmMerchant').val().trim(),
      // purpose: $('input[type=radio][name=purposeRadios]:checked').val(),
      purpose: $('#frmPurpose').val().trim(),
      payor: $('#frmPayor').val().trim(),
      reason: $('#frmReason').val().trim(),
      amount: $('#frmFee').val().trim(),
      email: $('#frmEmail').val().trim(),
      phone: $('#frmPhone').val().trim(),

      name: $('#frmCCName').val().trim(),
      number: $('#frmCCNum').val().trim(),
      expiry: $('#frmCCExp').val().trim(),
      cvc: $('#frmCCCVC').val().trim(),
      zip: $('#frmCCZip').val().trim()
    }
  }
})(jQuery, braintree, Formatter)
