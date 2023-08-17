import Decimal from "break_infinity.js";
import { Player } from "./main";
import { stuff } from "./data";
import { ArmyPage } from "./pages/army";
import { allThingsStatistics } from "./statistics";
import { ArmyCompsI } from "./types";
import { StorePage } from "./pages/store";

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

  buy(buyNr: Decimal) {
    const price = stuff[this.type][this.name].getPrice(this.nrBought, buyNr);
    const currencyAmount = Player.get<Decimal>(this.currency);
    if (currencyAmount.gte(price)) {
      Player.set(this.currency, currencyAmount.sub(price));
      //when adding a new element
      if (!Player.inventory[this.type][this.name]) {
        ArmyPage.elementEquipState[this.type][this.name] = 0;
        Player.inventory[this.type][this.name] = new Decimal(0);
      }
      Player.inventory[this.type][this.name] = Player.inventory[this.type][this.name].add(buyNr);
      this.nrBought = this.nrBought.add(buyNr);
      if (allThingsStatistics.addToStatistics(["StorePage", this.type, this.name], buyNr)) {
        StorePage.itemList.changePage(StorePage.itemList.page);
      }
      return true;
    }
    return false;
  }

  getPrice(buyNr: Decimal) {
    return stuff[this.type][this.name].getPrice(this.nrBought, buyNr);
  }
}