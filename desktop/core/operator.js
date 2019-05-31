'use strict'

import transpose from './transpose.js'
import scales from './scales.js'

export default function Operator (orca, x, y, glyph = '.', passive = false) {
  this.notes = ['C', 'c', 'D', 'd', 'E', 'F', 'f', 'G', 'g', 'A', 'a', 'B']
  this.name = 'unknown'
  this.x = x
  this.y = y
  this.passive = passive
  this.draw = passive
  this.glyph = passive ? glyph.toUpperCase() : glyph
  this.info = '--'
  this.ports = { bang: !passive }

  // Actions

  this.listen = function (port, toValue = false) {
    if (!port) { return (toValue ? 0 : '.') }
    const g = orca.glyphAt(this.x + port.x, this.y + port.y)
    const glyph = (g === '.' || g === '*') && port.default ? port.default : g
    if (toValue) {
      const min = port.clamp && port.clamp.min ? port.clamp.min : 0
      const max = port.clamp && port.clamp.max ? port.clamp.max : 36
      return clamp(orca.valueOf(glyph), min, max)
    }
    return glyph
  }

  this.output = function (g) {
    if (!this.ports.output) { console.warn(this.name, 'Trying to output, but no port'); return }
    if (!g) { return }
    orca.write(this.x + this.ports.output.x, this.y + this.ports.output.y, this.requireUC() === true ? `${g}`.toUpperCase() : g)
  }

  this.bang = function (b) {
    if (!this.ports.output) { console.warn(this.name, 'Trying to bang, but no port'); return }
    orca.write(this.x + this.ports.output.x, this.y + this.ports.output.y, b === true ? '*' : '.')
  }

  // Phases

  this.run = function (force = false) {
    // Permissions
    for (const id in this.ports) {
      orca.lock(this.x + this.ports[id].x, this.y + this.ports[id].y)
    }
    this.draw = true
    // Operate
    const payload = this.operation(force)
    if (this.ports.output) {
      if (this.ports.output.bang === true) {
        this.bang(payload)
      } else {
        this.output(payload)
      }
    }
  }

  this.operation = function () {

  }

  // Helpers

  this.lock = function () {
    orca.lock(this.x, this.y)
  }

  this.replace = function (g) {
    orca.write(this.x, this.y, g)
  }

  this.erase = function () {
    this.replace('.')
  }

  this.explode = function () {
    this.replace('*')
    // this.lock()
  }

  this.move = function (x, y) {
    const offset = { x: this.x + x, y: this.y + y }
    if (!orca.inBounds(offset.x, offset.y)) { this.explode(); return }
    const collider = orca.glyphAt(offset.x, offset.y)
    if (collider !== '*' && collider !== '.') { this.explode(); return }
    this.erase()
    this.x += x
    this.y += y
    this.replace(this.glyph)
    this.lock()
  }

  this.hasNeighbor = function (g) {
    if (orca.glyphAt(this.x + 1, this.y) === g) { return true }
    if (orca.glyphAt(this.x - 1, this.y) === g) { return true }
    if (orca.glyphAt(this.x, this.y + 1) === g) { return true }
    if (orca.glyphAt(this.x, this.y - 1) === g) { return true }
    return false
  }

  // Docs

  this.getPorts = function () {
    const a = []
    if (this.draw === true) {
      a.push([this.x, this.y, 0, `${this.name.charAt(0).toUpperCase() + this.name.substring(1).toLowerCase()}`])
    }
    if (!this.passive) { return a }
    for (const id in this.ports) {
      const port = this.ports[id]
      a.push([this.x + port.x, this.y + port.y, port.x < 0 || port.y < 0 ? 1 : 2, `${this.glyph}-${id}`])
    }
    if (this.ports.output) {
      const port = this.ports.output
      a.push([this.x + port.x, this.y + port.y, port.reader || port.bang ? 8 : 3, `${this.glyph}-output`])
    }
    return a
  }

  this.requireUC = function (ports = this.ports) {
    if (this.ports.output.sensitive !== true) { return false }
    for (const id in ports) {
      const value = this.listen(ports[id])
      if (value.length !== 1) { continue }
      if (value.toLowerCase() === value.toUpperCase()) { continue }
      if (`${value}`.toUpperCase() === `${value}`) { return true }
    }
    return false
  }

  // Notes tools

  this.transpose = function (n, o = 3) {
    if (!transpose[n]) { return { note: n, octave: o } }
    const note = transpose[n].charAt(0)
    const octave = clamp(parseInt(transpose[n].charAt(1)) + o, 0, 8)
    const value = this.notes.indexOf(note)
    const id = clamp((octave * 12) + value, 0, 127)
    const real = id < 89 ? Object.keys(transpose)[id - 45] : null
    return { id, value, note, octave, real }
  }

  this.resolveDegree = function(key, scaleIndex, degree) {
    const scale = scales[scaleIndex];
    const keyIndex = this.notes.indexOf(key);
    let octave = 0;

    degree+=1; // Makes degree calculations easier
    if (degree > scale.length) {
      octave = ~~((degree-1) / scale.length);
      degree = degree % scale.length;
      if (degree == 0) degree = scale.length;
    }

    const noteIndex = scale[degree-1];

    if(keyIndex!=0) {
      // If not C then change ordering of notes
      this.notes = this.notes.slice(keyIndex,this.notes.length).concat(this.notes.slice(0,keyIndex))
      if(noteIndex>=(12-keyIndex)) octave += 1; // Shift octave for the last keys.
      return {"note": this.notes[noteIndex], "octave": octave};
    } else {
      return {"note": this.notes[noteIndex], "octave": octave};
    }
  }

  // Docs

  function clamp (v, min, max) { return v < min ? min : v > max ? max : v }
}
