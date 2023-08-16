import { Stats, PriceHandler } from './stats';
import Decimal from 'break_infinity.js';

export class ArmyComponent {
    name: string;
    desc: string;
    stats: Stats;
    requires: Stats;
    type: string;
    priceHandler: PriceHandler;
    _bodyParts: Stats;
    constructor(name = 'None', desc = 'None', stats = new Stats(), bodyParts = new Stats(), requires = new Stats(), type = 'Creature', priceHandler = new PriceHandler()) {
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
        return 'Name: ' + this.name + ' → ' + other.name + '<br>' +
            this.stats.getCompareText(other.stats) +
            (this.requires.isNull() ? '' : '<br>' + 'Requires:<br>' + this.requires.getCompareText(other.requires));
    }

    getFullText() {
        return '<b>Name: ' + this.name + '</b><br>' +
            this.stats.getText() +
            '<br>' +
            (this._bodyParts.isNull() ? '' : 'Parts:<br>' + this.bodyParts.getText()) +
            (this.requires.isNull() ? '' : 'Requires:<br>' + this.requires.getText()) +
            '<br><i>' + this.desc + '</i>';
    }

    getText() {
        return '<b>Name: ' + this.name + '</b><br>' +
            this.stats.getText() +
            '<br>' +
            (this._bodyParts.isNull() ? '' : 'Parts:<br>' + this.bodyParts.getText()) + '<br>' +
            (this.requires.isNull() ? '' : 'Requires:<br>' + this.requires.getText()) +
            '<br><i>' + this.desc + '</i>';
    }
}


/*
class Creature extends ArmyComponent {
    constructor(name = 'None', desc = 'None', stats = new Stats(), requires = new Stats(), priceHandler = new PriceHandler()) {
        super(name, desc, stats, requires, priceHandler);
    }


}

class Weapon extends ArmyComponent {
    constructor(name = 'None', desc = 'None', stats = new Stats(['Attack'],[new SubStats()]), hands_needed = 0, priceHandler = new PriceHandler()) {
        this.name = name;
        this.desc = desc;
        this.stats = stats;
        this.hands_needed = hands_needed;
        this.priceHandler = priceHandler;
    }

    //placeholder function
    getPrice(nrOwned, toBuy) {
        return this.priceHandler.getPrice(nrOwned,toBuy);
    }

    getCompareText(other) {
        return '<b>Name: ' + this.name + ' → ' + other.name + '</b><br>' +
        this.stats.getText() +
        'Hands needed: ' + this.hands_needed + ' → <span style="color:' + UtilityFunctions.get_compare_color(other.hands_needed, this.hands_needed, false) + ';">' + other.hands_needed + '</span><br>';

    }

    getText() {
        return '<b>Name: ' + this.name + '</b><br>' +
        this.stats.getText() +
        '<br>' +
        'Hands: ' + this.hands_needed + '<br>' +
        '<br><i>' + this.desc + '</i>';

    }
}
*/