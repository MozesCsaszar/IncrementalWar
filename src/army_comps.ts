import { Stats, PriceHandler } from "./stats";
import Decimal from "break_infinity.js";

export class ArmyComponent {
  name: string;
  desc: string;
  stats: Stats;
  requires: Stats;
  type: string;
  priceHandler: PriceHandler;
  _bodyParts: Stats;
  constructor(name = "None", desc = "None", stats = new Stats(), bodyParts = new Stats(), requires = new Stats(), type = "Creature", priceHandler = new PriceHandler()) {
    this.name = name;
    this.desc = desc;
    this.stats = stats;
    this.requires = requires;
    this.type = type;
    this.priceHandler = priceHandler;
    this._bodyParts = bodyParts;
  }

  get bodyParts() {
    return this._bodyParts;
  }

  getPrice(nrOwned: Decimal, toBuy: Decimal): Decimal {
    return this.priceHandler.getPrice(nrOwned, toBuy);
  }

  getCompareText(other: ArmyComponent) {
    return "Name: " + this.name + " → " + other.name + "<br>" +
      this.stats.getCompareText(other.stats) +
      (this.requires.isNull() ? "" : "<br>" + "Requires:<br>" + this.requires.getCompareText(other.requires));
  }

  getFullText() {
    return "<b>Name: " + this.name + "</b><br>" +
      this.stats.getText() +
      "<br>" +
      (this._bodyParts.isNull() ? "" : "Parts:<br>" + this.bodyParts.getText()) +
      (this.requires.isNull() ? "" : "Requires:<br>" + this.requires.getText()) +
      "<br><i>" + this.desc + "</i>";
  }

  getText() {
    return "<b>Name: " + this.name + "</b><br>" +
      this.stats.getText() +
      "<br>" +
      (this._bodyParts.isNull() ? "" : "Parts:<br>" + this.bodyParts.getText()) + "<br>" +
      (this.requires.isNull() ? "" : "Requires:<br>" + this.requires.getText()) +
      "<br><i>" + this.desc + "</i>";
  }
}
