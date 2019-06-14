'use strict'

import Operator from '../operator.js'

export default function OperatorSmiley (orca, x, y, passive) {
  Operator.call(this, orca, x, y, '☺', passive)

  this.name = 'north'
  this.info = 'Moves randomly, or bangs'
  this.draw = false

  this.operation = function () {
    const r = Math.random() >= 0.5 ? 1 : -1
    this.move(r<0 ? 0 : 1,r)
    this.passive = false
  }
}
