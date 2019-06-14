'use strict'

import Operator from '../operator.js'

export default function OperatorRel (orca, x, y, passive) {
  Operator.call(this, orca, x, y, '-', passive)

  this.name = 'if'
  this.info = 'Bangs if inputs are equal'

  this.operation = function (force = false) {
    if(!(this.hasNeighbor('*') || this.hasNeighbor('♪'))) { return }
    else this.replace("♪")
  }

}
