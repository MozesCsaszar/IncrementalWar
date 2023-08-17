import Decimal from "break_infinity.js";
import { stuff } from "./data";
import { allThingsStatistics } from "./statistics";
import { ArmyCompsI } from "./types";
import { GameManagerClass } from "./base_classes";

export class Buyer {
  borderColors = {
    "gold": "gold",
  };
  type: keyof ArmyCompsI<never>;
  name: string;
  nrBought: Decimal;
  currency: string;

  constructor(type: keyof ArmyCompsI<never>, name: string, currency = "gold", nrBought = new Decimal(0)) {
    this.type = type;
    this.name = name;
    this.nrBought = nrBought;
    this.currency = currency;
  }

  buy(buyNr: Decimal, gM: GameManagerClass): boolean {
    const price = stuff[this.type][this.name].getPrice(this.nrBought, buyNr);
    const currencyAmount = gM.Player.get<Decimal>(this.currency);
    if (currencyAmount.gte(price)) {
      gM.Player.set(this.currency, currencyAmount.sub(price));
      //when adding a new element
      if (!gM.Player.getElementCount(this.type, this.name)) {
        gM.ArmyPage.setElementEquipState(this.type, this.name, 0);
        gM.Player.setElementCount(this.type, this.name, new Decimal(0));
      }
      const newAmount = gM.Player.getElementCount(this.type, this.name).add(buyNr);
      gM.Player.setElementCount(this.type, this.name, newAmount);
      this.nrBought = this.nrBought.add(buyNr);
      if (allThingsStatistics.addToStatistics(["StorePage", this.type, this.name], buyNr)) {
        gM.StorePage.itemList.changePage(gM.StorePage.itemList.page);
      }
      return true;
    }
    return false;
  }

  getPrice(buyNr: Decimal): Decimal {
    return stuff[this.type][this.name].getPrice(this.nrBought, buyNr);
  }
}