'use strict'

import Operator from '../operator.js'

export default function OperatorRelayBang (orca, x, y, passive) {
  Operator.call(this, orca, x, y, '♪', passive)

  this.name = 'Relay bang'
  this.info = 'Alternative bang'

  this.operation = function (force = false) {
    this.replace("-")
    this.passive = false
  }

}
