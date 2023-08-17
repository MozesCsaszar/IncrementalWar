import Decimal from "break_infinity.js";
import { getCompareColor, stylizeDecimals } from "./functions";

//a class to handle price, created to accept multiple functions across multiple intervals
export class PriceHandler {
  stopPoints: Decimal[];
  coefficients: Decimal[];
  types: string[];
  stopPointValues: Decimal[];
  //ar = arithmetic increas, ge = geometric increase
  constructor(stopPoints: Decimal[] = [], types: string[] = ["ar"], coefficients = [new Decimal(0)], start_price = new Decimal(0)) {
    this.stopPoints = stopPoints;
    this.stopPoints.unshift(new Decimal(0));
    this.stopPoints.push(new Decimal(Infinity));
    this.coefficients = coefficients;
    this.coefficients.unshift(start_price);
    this.types = types;
    this.types.unshift("ar");
    this.stopPointValues = [coefficients[0]];
    for (let i = 1; i < stopPoints.length; i++) {
      if (types[i] == "ar") {
        this.stopPointValues[i] = this.stopPointValues[i - 1].add(this.stopPoints[i].sub(this.stopPoints[i - 1]).mul(this.coefficients[i]));
      }
      else if (types[i] == "ge") {
        this.stopPointValues[i] = this.stopPointValues[i - 1].mul(this.stopPoints[i].sub(this.stopPoints[i - 1]).pow(this.coefficients[i]));
      }
    }
  }

  getPrice(nrOwned: Decimal, toBuy: Decimal): Decimal {
    let i = 0;
    while (this.stopPoints[i].lte(nrOwned)) {
      i++;
    }
    //get start price
    let start_price = this.stopPointValues[i - 1];
    let new_price = new Decimal(0);
    //calculate new price
    while (toBuy.gt(new Decimal(0))) {
      const upper_border = nrOwned.add(toBuy).gt(this.stopPoints[i]) ? this.stopPoints[i].sub(nrOwned) : toBuy;
      if (this.types[i] == "ar") {
        new_price = new_price.add(Decimal.sumArithmeticSeries(upper_border, start_price, this.coefficients[i], nrOwned.sub(this.stopPoints[i - 1])));
      }
      else if (this.types[i] == "ge") {
        new_price = new_price.add(Decimal.sumGeometricSeries(upper_border, start_price, this.coefficients[i], nrOwned.sub(this.stopPoints[i - 1])));
      }
      start_price = this.stopPointValues[i];
      i++;
      toBuy = toBuy.sub(upper_border);
      nrOwned = nrOwned.add(upper_border);
    }
    return new_price;
  }
}

//elemental circle: fire -> nature -> water -> wind -> fire

/*
    A class which handles subStats, containing values for physical, magic, fire, water, wind and nature.
    Public variables contain useable strings for creating string representation
*/

class HashLike {
  get<T>(key: string): T {
    return this[key as keyof HashLike] as T;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, value: any) {
    this[key as keyof HashLike] = value;
  }
}

interface SubStatsKeys<T> {
  physical: T;
  magic: T;
  fire: T;
  water: T;
  wind: T;
  nature: T;
}

class SubStatsStringFormat extends HashLike implements SubStatsKeys<string> {
  physical: string;
  magic: string;
  fire: string;
  water: string;
  wind: string;
  nature: string;
  constructor(physical: string, magic: string, fire: string, water: string, wind: string, nature: string) {
    super();

    this.physical = physical;
    this.magic = magic;
    this.fire = fire;
    this.water = water;
    this.wind = wind;
    this.nature = nature;
  }
}

class ApplyFunctionForStats extends HashLike {
  comparableTypes(other: unknown) {
    if (this instanceof Stats && other instanceof Stats) {
      return true;
    }
    else if (this instanceof SubStats && other instanceof SubStats) {
      return true;
    }
    return false;
  }

  finalType(other: unknown) {
    if (other instanceof Decimal) return true;
    return false;
  }

  //apply a logical(comparison) function to all elements of current thisect that match the condFunc
  //non-destructive
  applyLogFunction<T>(other: unknown, logFuncName: keyof T): boolean {
    if (this.comparableTypes(other) && other instanceof HashLike) {
      for (const ss in this) {
        const valThis = this.get<T>(ss);
        const valOther = other.get<unknown>(ss);
        if (!(valThis[logFuncName] as (o: unknown) => boolean)(valOther)) {
          return false;
        }
      }
    }
    else if (this.finalType(other)) {
      for (const ss in this) {
        const valThis = this.get<T>(ss);
        if (!(valThis[logFuncName] as (o: unknown) => boolean)(other)) {
          return false;
        }
      }
    }
    else {
      return false;
    }
    return true;
  }

  //apply a computational function to all elements of current thisect that match the condFunc
  //non-destructive
  applyCompFunction<T>(other: unknown, compFuncName: keyof T, initVal: HashLike,
    condFunc: (t: T, o: unknown) => boolean = () => true): HashLike {
    if (this.comparableTypes(other) && other instanceof HashLike) {
      for (const ss in this) {
        const valThis = this.get<T>(ss);
        const valOther = other.get<unknown>(ss);
        if (condFunc(valThis, valOther)) initVal.set(ss, (valThis[compFuncName] as (o: unknown) => T)(valOther));
      }
    }
    else if (this.finalType(other)) {
      for (const ss in this) {
        const valThis = this.get<T>(ss);
        if (condFunc(valThis, other)) initVal.set(ss, (valThis[compFuncName] as (o: unknown) => boolean)(other));
      }
    }
    return initVal;
  }

  //apply a reducer function to all elements of current thisect that match the condFunc
  //non-destructive
  applyRedFunction<T, V>(initVal: V, reducerFunc: (old: V, curr: T) => V, condFunc: (val: T) => boolean = () => true): V {
    for (const e in this)
      if (condFunc(this[e] as T))
        initVal = reducerFunc(initVal, this[e] as T);
    return initVal;
  }
}

export class SubStats extends ApplyFunctionForStats implements SubStatsKeys<Decimal> {
  static textStart = "<span style=\"color:";
  static typeColor = new SubStatsStringFormat("#c06000\">", "#b000b0\">", "#FF0000\">", "#4848ff\">", "#d0FFd0\">", "#20d000\">");
  static typeEnd = new SubStatsStringFormat("&#x2BC0;</span>", "&#x2BC1;</span>", "&#x2BC5;</span>", "&#x2BC6;</span>", "&#x2BC7;</span>", "&#x2BC8;</span>");

  physical: Decimal;
  magic: Decimal;
  fire: Decimal;
  water: Decimal;
  wind: Decimal;
  nature: Decimal;
  constructor(physical = new Decimal(0), magic = new Decimal(0), fire = new Decimal(0), water = new Decimal(0), wind = new Decimal(0), nature = new Decimal(0)) {
    super();

    this.physical = physical;
    this.magic = magic;
    this.fire = fire;
    this.water = water;
    this.wind = wind;
    this.nature = nature;
  }

  eq(other: unknown): boolean {
    return this.applyLogFunction(other, "eq");
  }
  static eq(first: SubStats, second: SubStats): boolean {
    return first.eq(second);
  }
  lt(other: unknown): boolean {
    return this.applyLogFunction(other, "lt");
  }
  static lt(first: SubStats, second: SubStats): boolean {
    return first.lt(second);
  }
  lte(other: unknown): boolean {
    return this.applyLogFunction(other, "lte");
  }
  static lte(first: SubStats, second: SubStats) {
    return first.lte(second);
  }
  gt(other: unknown): boolean {
    return !this.lte(other);
  }
  static gt(first: SubStats, second: SubStats) {
    return first.gt(second);
  }
  gte(other: unknown): boolean {
    return !this.lt(other);
  }
  static gte(first: SubStats, second: SubStats) {
    return first.gte(second);
  }
  isNull(): boolean {
    return this.applyLogFunction(new Decimal(0.00001), "lte");
  }

  add(other: unknown): SubStats {
    return this.applyCompFunction(other, "add", new Stats()) as SubStats;
  }
  static add(first: SubStats, second: SubStats) {
    return first.add(second);
  }
  sub(other: unknown): SubStats {
    return this.applyCompFunction(other, "sub", new Stats()) as SubStats;
  }
  static sub(first: SubStats, second: SubStats) {
    return first.sub(second);
  }
  mul(other: unknown): SubStats {
    return this.applyCompFunction(other, "mul", new Stats()) as SubStats;
  }
  static mul(first: SubStats, second: SubStats) {
    return first.mul(second);
  }
  div(other: unknown): SubStats {
    const isNotZero = (t: Decimal, o: unknown) => !(o as Decimal).eq(new Decimal(0));
    return this.applyCompFunction(other, "div", new Stats(), isNotZero) as SubStats;
  }
  static div(first: SubStats, second: SubStats) {
    return first.div(second);
  }

  getText() {
    let t = "";
    if (this.isNull()) {
      return "0";
    }
    for (const ss in this) {
      if (this[ss] != 0) {
        t += SubStats.textStart + SubStats.typeColor.get<string>(ss) + stylizeDecimals(this.get<Decimal>(ss)) + SubStats.typeEnd.get<string>(ss) + "&nbsp";
      }
    }
    return t;
  }
  //get the elemental attributly unmodified power of attack or defense
  getPlainPower(): Decimal {
    let pow = new Decimal(0);
    for (const e in this) {
      pow = pow.add(this[e] as Decimal);
    }
    return pow;
  }
}

/*
    A class to store data related to stats.
    Uses SubStats for complex (or multi-variable stats) like attack and defense.
    Supports only entries which have eq, mul, add, sub and div methods
*/
export class Stats extends ApplyFunctionForStats {
  //stat names: Attack, Defense (subStats), Health (not implemented yet)
  constructor(statNames: string[] = [], statSubstats: Array<SubStats | Decimal> = []) {
    super();

    for (let i = 0; i < statNames.length; i++) {
      this.set(statNames[i], statSubstats[i]);
    }
  }

  eq(other: unknown): boolean {
    return this.applyLogFunction(other, "eq");
  }
  lt(other: unknown): boolean {
    return this.applyLogFunction(other, "lt");
  }
  lte(other: unknown): boolean {
    return this.applyLogFunction(other, "lte");
  }
  gt(other: unknown): boolean {
    return !this.lte(other);
  }
  gte(other: unknown): boolean {
    return !this.lt(other);
  }
  isNull(): boolean {
    return this.applyLogFunction(new Decimal(0.00001), "lte");
  }

  add(other: unknown): Stats {
    const initVal: Stats = new Stats([], []);
    return this.applyCompFunction(other, "add", initVal) as Stats;
  }
  sub(other: unknown): Stats {
    const initVal = new Stats([], []);
    return this.applyCompFunction(other, "sub", initVal) as Stats;
  }
  mul(other: unknown): Stats {
    const initVal = new Stats([], []);
    return this.applyCompFunction(other, "mul", initVal) as Stats;
  }
  div(other: unknown): Stats {
    const initVal = new Stats([], []);
    const isNotZero = (t: Decimal, o: unknown) => !(o as Decimal | SubStats).eq(new Decimal(0));
    return this.applyCompFunction(other, "div", initVal, isNotZero) as Stats;
  }

  /*
      Get the string(HTML) representation of the thing with a newline at the end.
  */
  getText(showZeros = false) {
    let t = "";
    for (const ss in this) {
      const entry = this[ss];
      if (entry instanceof Stats) {
        t += "<br>" + entry.getText() + "<br>";
      }
      else if (entry instanceof SubStats) {
        if (!entry.isNull() || showZeros) {
          t += ss + ":&nbsp" + entry.getText() + "<br>";
        }
      }
      else if (entry instanceof Decimal) {
        if (entry.neq_tolerance(0, 0.00001) || showZeros) {
          t += ss + ":&nbsp" + stylizeDecimals(entry) + "<br>";
        }
      }
    }
    return t;
  }

  /*
      Get HTML string which represents the result of the comparison to current thisect.
  */
  //TODO: Look at getCompareText
  getCompareText(other: Stats | SubStats) {
    /*'Level: ' + (Player.armies[ArmyPage.currentArmy].level+1) +
     + (Player.armies[ArmyPage.currentArmy].level + 2) + '<br>';*/
    const a = this.add(other);
    let t = "";
    for (const ss in a) {
      const thisEntry = this.get<unknown>(ss);
      const otherEntry = other.get<unknown>(ss);
      //if entry is not present in current stats
      if (thisEntry == undefined) {
        if (otherEntry instanceof Stats) {
          t += "<br>" + otherEntry.getCompareText(new Stats());
        }
        else {
          t += ss + ":&nbsp";
          if (otherEntry instanceof SubStats) {
            t += "0 &rightarrow; " + otherEntry.getText();
          }
          else {
            t += "0 &rightarrow; " + stylizeDecimals(otherEntry as Decimal);
          }
        }
      }
      //if entry is not present in the other stats
      else if (otherEntry == undefined) {
        if (thisEntry instanceof Stats) {
          t += "<br>" + thisEntry.getCompareText(new Stats());
        }
        else {
          t += ss + ":&nbsp";
          if (thisEntry instanceof SubStats) {
            t += thisEntry.getText() + " &rightarrow; 0";
          }
          else {
            t += stylizeDecimals(thisEntry as Decimal) + " &rightarrow; 0";
          }
        }

      }
      //if entry is present in both stats
      else {
        if (otherEntry instanceof Stats) {
          // t += "<br>" + thisEntry.getCompareText(otherEntry);
        }
        else {
          t += ss + ":&nbsp";
          const colored_arrow = "<span style=\"color:" + getCompareColor(thisEntry as Decimal, otherEntry as Decimal)
            + "\">  &rightarrow; </span>";
          if (otherEntry instanceof SubStats) {
            // t += thisEntry.getText() + colored_arrow + otherEntry.getText();
          }
          else {
            t += stylizeDecimals(thisEntry as Decimal) + colored_arrow + stylizeDecimals(otherEntry as Decimal);
          }
        }

      }
      t += "<br>";
    }
    return t;
  }

  //get the elemental attributly unmodified power of attack or defense
  getPlainPower(type = "Attack||Defense"): Decimal {
    const key = type as keyof Stats;
    if (this[key] instanceof SubStats) {
      return this.get<SubStats>(type).getPlainPower();
    }
    return new Decimal(0);
  }

  //get the elemental attributly modified power of attack or defense
  getPower(statsB: Stats, typeA = "Attack||Defense", typeB = "Defense||Attack"): Decimal {
    let pow = new Decimal(0);

    const subStatsA = this.get<SubStats>(typeA);
    const subStatsB = statsB.get<SubStats>(typeB);

    if (subStatsA) {
      pow = this.get<SubStats>(typeA).getPlainPower();
    }
    else {
      return pow;
    }
    if (!subStatsB) {
      return pow;
    }
    else {
      pow = pow.sub(subStatsB.physical);
    }

    if (subStatsA.fire.gt(0)) {
      pow = pow.add(subStatsB.nature.abs().min(subStatsA.fire).mul(new Decimal(0.5)));
      if (subStatsB.wind.gt(0)) {
        pow = pow.sub(subStatsB.wind.min(subStatsA.fire).mul(new Decimal(0.5)));
      }
    }
    if (subStatsA.nature.gt(0)) {
      pow = pow.add(subStatsB.water.abs().min(subStatsA.nature).mul(new Decimal(0.5)));
      if (subStatsB.wind.gt(0)) {
        pow = pow.sub(subStatsB.fire.min(subStatsA.nature).mul(new Decimal(0.5)));
      }
    }
    if (subStatsA.water.gt(0)) {
      pow = pow.add(subStatsB.wind.abs().min(subStatsA.water).mul(new Decimal(0.5)));
      if (subStatsB.wind.gt(0)) {
        pow = pow.sub(subStatsB.nature.min(subStatsA.water).mul(new Decimal(0.5)));
      }
    }
    if (subStatsA.wind.gt(0)) {
      pow = pow.add(subStatsB.fire.abs().min(subStatsA.wind).mul(new Decimal(0.5)));
      if (subStatsB.wind.gt(0)) {
        pow = pow.sub(subStatsB.water.min(subStatsA.wind).mul(new Decimal(0.5)));
      }
    }

    return pow;
  }
}